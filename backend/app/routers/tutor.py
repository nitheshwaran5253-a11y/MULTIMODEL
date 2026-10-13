import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Conversation, ChatMessage, MaterialChunk, StudyMaterial
from ..schemas import ChatRequest, ChatResponse, ChatMessageSchema
from ..services.vector_store import VectorStoreService
from ..services.llm_service import LLMService

router = APIRouter(prefix="/tutor", tags=["Source-Grounded AI Tutor"])

@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter_by(user_id=1).order_by(Conversation.created_at.desc()).all()
    if not convs:
        # Create default conversation
        conv = Conversation(user_id=1, title="Java Tutoring Session")
        db.add(conv)
        db.commit()
        db.refresh(conv)
        convs = [conv]

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "message_count": len(c.messages)
        } for c in convs
    ]

@router.get("/messages/{conversation_id}", response_model=List[ChatMessageSchema])
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter_by(conversation_id=conversation_id).order_by(ChatMessage.created_at.asc()).all()
    results = []
    for m in msgs:
        cites = []
        try:
            cites = json.loads(m.citations_json or "[]")
        except Exception:
            pass
        results.append(ChatMessageSchema(
            id=m.id,
            sender=m.sender,
            content=m.content,
            mode=m.mode or "step_by_step",
            citations=cites,
            is_simulated=m.is_simulated,
            created_at=m.created_at
        ))
    return results

@router.post("/chat", response_model=ChatResponse)
def ask_tutor(req: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-driven AI tutor grounded strictly in student's uploaded course materials.
    """
    # 1. Ensure conversation exists
    conv_id = req.conversation_id
    if not conv_id:
        conv = Conversation(user_id=1, title=req.question[:40] + "...")
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv_id = conv.id

    # 2. Persist student question
    user_msg = ChatMessage(
        conversation_id=conv_id,
        sender="user",
        content=req.question,
        mode=req.mode,
        citations_json="[]",
        is_simulated=False
    )
    db.add(user_msg)
    db.commit()

    # 3. Retrieve chunks from database
    chunk_query = db.query(MaterialChunk)
    if req.material_id:
        chunk_query = chunk_query.filter(MaterialChunk.material_id == req.material_id)
    chunks = chunk_query.all()

    # 4. Perform vector + keyword hybrid search
    retrieved = VectorStoreService.search_chunks(req.question, chunks, top_k=3, min_threshold=0.18)

    # 5. Generate grounded answer
    gen_result = LLMService.generate_tutoring_answer(req.question, retrieved, mode=req.mode)

    # 6. Persist tutor response
    tutor_msg = ChatMessage(
        conversation_id=conv_id,
        sender="tutor",
        content=gen_result["answer"],
        mode=req.mode,
        citations_json=json.dumps(gen_result["citations"]),
        is_simulated=gen_result["is_simulated"]
    )
    db.add(tutor_msg)
    db.commit()

    return ChatResponse(
        conversation_id=conv_id,
        answer=gen_result["answer"],
        citations=gen_result["citations"],
        mode=req.mode,
        is_simulated=gen_result["is_simulated"],
        grounded_in_sources=gen_result["grounded_in_sources"],
        suggested_followups=gen_result["suggested_followups"]
    )

@router.get("/suggested-questions")
def get_suggested_questions(db: Session = Depends(get_db)):
    """Provides curated, grounded prompt questions based on uploaded materials."""
    return [
        {
            "category": "Loops & Iteration",
            "question": "How many times does `for (int i = 0; i <= 4; i++)` run?",
            "source": "Java_Control_Flow_Loops.pdf (Page 3)"
        },
        {
            "category": "Loop Semantics",
            "question": "Why is a `do-while` loop guaranteed to execute at least once?",
            "source": "Java_Control_Flow_Loops.pdf (Page 2)"
        },
        {
            "category": "Boolean Conditions",
            "question": "How does short-circuit evaluation work with `&&` in Java?",
            "source": "Java_Conditionals_Operators.pptx (Slide 3)"
        },
        {
            "category": "Arrays & Indexing",
            "question": "What happens if I loop with `i <= arr.length` instead of `i < arr.length`?",
            "source": "Java_Arrays_and_Iteration.mp4 (Timestamp 03:45)"
        }
    ]
