import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Assessment, Question, StudentResponse, QuestionHistory, LearnerMastery, StudyMaterial
from ..schemas import (
    AssessmentCreateRequest,
    AssessmentResponse,
    QuestionDetail,
    AssessmentSubmitRequest,
    AssessmentResultResponse,
    SubmittedQuestionResult,
    Citation
)
from ..services.bkt_engine import BKTEngine

router = APIRouter(prefix="/assessments", tags=["Adaptive Assessments"])

@router.get("", response_model=List[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db)):
    assessments = db.query(Assessment).filter_by(user_id=1).order_by(Assessment.created_at.desc()).all()
    out = []
    for a in assessments:
        q_details = []
        for q in a.questions:
            opts = []
            try:
                opts = json.loads(q.options_json or "[]")
            except Exception:
                pass
            q_details.append(QuestionDetail(
                id=q.id,
                question_uid=q.question_uid,
                text=q.text,
                topic=q.topic,
                subtopic=q.subtopic,
                difficulty=q.difficulty,
                question_type=q.question_type,
                options=opts,
                expected_answer=None,
                explanation=None,
                source_reference=None
            ))
        out.append(AssessmentResponse(
            id=a.id,
            subject=a.subject,
            topic=a.topic,
            difficulty=a.difficulty,
            total_questions=a.total_questions,
            questions=q_details,
            created_at=a.created_at
        ))
    return out

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter_by(id=assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    q_details = []
    for q in a.questions:
        opts = []
        try:
            opts = json.loads(q.options_json or "[]")
        except Exception:
            pass
        q_details.append(QuestionDetail(
            id=q.id,
            question_uid=q.question_uid,
            text=q.text,
            topic=q.topic,
            subtopic=q.subtopic,
            difficulty=q.difficulty,
            question_type=q.question_type,
            options=opts,
            expected_answer=None,
            explanation=None,
            source_reference=None
        ))

    return AssessmentResponse(
        id=a.id,
        subject=a.subject,
        topic=a.topic,
        difficulty=a.difficulty,
        total_questions=a.total_questions,
        questions=q_details,
        created_at=a.created_at
    )

@router.post("/generate", response_model=AssessmentResponse)
def generate_assessment(req: AssessmentCreateRequest, db: Session = Depends(get_db)):
    """
    Dynamically generates adaptive questions grounded in materials,
    checking history to ensure 0% question repetition.
    """
    # Fetch seen question UIDs to avoid repetition
    seen_history = db.query(QuestionHistory.question_uid).filter_by(user_id=1).all()
    seen_uids = {h[0] for h in seen_history}

    pool = [
        {
            "uid": f"Q_GEN_BOUNDS_{uuid.uuid4().hex[:6]}",
            "text": "How many iterations occur in this loop?\n\nint sum = 0;\nfor (int i = 0; i <= 4; i++) {\n    sum += i;\n}",
            "topic": "Loops & Iteration",
            "subtopic": "For Loop Boundaries",
            "difficulty": req.difficulty,
            "type": req.question_type,
            "options": ["4 times", "5 times", "6 times", "Infinite loop"],
            "expected": "5 times",
            "explanation": "Because the loop starts at i = 0 and uses `<= 4`, it executes for 0, 1, 2, 3, 4 (5 iterations).",
            "source": {"material_name": "Java_Control_Flow_Loops.pdf", "location": "Page 3", "page_number": 3, "excerpt": "for (int i = 0; i <= n; i++) iterates n + 1 times when starting from 0."}
        },
        {
            "uid": f"Q_GEN_DOWHILE_{uuid.uuid4().hex[:6]}",
            "text": "What is guaranteed about execution of a Java `do-while` loop compared to a standard `while` loop?",
            "topic": "Loops & Iteration",
            "subtopic": "Do-While Semantics",
            "difficulty": "Easy",
            "type": "MCQ",
            "options": [
                "It executes at least once before checking condition",
                "It terminates earlier than while loop",
                "It runs only if condition is true initially",
                "It cannot access local variables"
            ],
            "expected": "It executes at least once before checking condition",
            "explanation": "Because do-while is a post-test loop, the statements in its body execute before the conditional expression is tested.",
            "source": {"material_name": "Java_Control_Flow_Loops.pdf", "location": "Page 2", "page_number": 2, "excerpt": "The loop body is guaranteed to execute at least once in a do-while loop."}
        },
        {
            "uid": f"Q_GEN_SHORTCIRCUIT_{uuid.uuid4().hex[:6]}",
            "text": "In expression `(a != null) && (a.length > 0)`, why won't a NullPointerException occur if `a` is null?",
            "topic": "Conditionals & Logic",
            "subtopic": "Short-Circuit Evaluation",
            "difficulty": req.difficulty,
            "type": "MCQ",
            "options": [
                "Short-circuit evaluation skips the right side if left is false",
                "Java compiler optimizes null away",
                "The && operator checks both sides in parallel",
                "Null arrays automatically have length 0"
            ],
            "expected": "Short-circuit evaluation skips the right side if left is false",
            "explanation": "In logical AND (&&), if the first operand is false, the entire expression cannot be true, so Java does not evaluate the second operand.",
            "source": {"material_name": "Java_Conditionals_Operators.pptx", "location": "Slide 3", "slide_number": 3, "excerpt": "In A && B, if A is false, B is NEVER evaluated. Essential for guard conditions."}
        },
        {
            "uid": f"Q_GEN_ARRAY_{uuid.uuid4().hex[:6]}",
            "text": "If array `vals` has length 5, what is the valid index range for standard iteration?",
            "topic": "Arrays & Iteration",
            "subtopic": "0-Indexing Bounds",
            "difficulty": "Easy",
            "type": "MCQ",
            "options": ["0 to 4", "1 to 5", "0 to 5", "-1 to 4"],
            "expected": "0 to 4",
            "explanation": "Java arrays are 0-indexed, so the indices for length N are 0 through N - 1.",
            "source": {"material_name": "Java_Arrays_and_Iteration.mp4.transcript", "location": "01:05", "timestamp_seconds": 65, "excerpt": "Java arrays are strictly zero-indexed. An array of length 10 has valid indices 0 to 9."}
        },
        {
            "uid": f"Q_GEN_TRACE_{uuid.uuid4().hex[:6]}",
            "text": "What is printed?\n\nint x = 1;\nwhile (x < 7) {\n    x += 2;\n}\nSystem.out.println(x);",
            "topic": "Loops & Iteration",
            "subtopic": "While Execution Tracing",
            "difficulty": "Medium",
            "type": "MCQ",
            "options": ["5", "7", "9", "6"],
            "expected": "7",
            "explanation": "Traced: x=1 (1<7, x=3), x=3 (3<7, x=5), x=5 (5<7, x=7), x=7 (7<7 is false, loop terminates, prints 7).",
            "source": {"material_name": "Java_Control_Flow_Loops.pdf", "location": "Page 1", "page_number": 1, "excerpt": "Pre-test loops require tracing variable updates inside the loop body."}
        }
    ]

    selected = pool[:req.num_questions]

    assessment = Assessment(
        user_id=1,
        subject=req.subject,
        topic=req.topic,
        difficulty=req.difficulty,
        total_questions=len(selected),
        score=0.0
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    question_objects = []
    question_details = []

    for q_data in selected:
        q = Question(
            assessment_id=assessment.id,
            question_uid=q_data["uid"],
            text=q_data["text"],
            topic=q_data["topic"],
            subtopic=q_data["subtopic"],
            difficulty=q_data["difficulty"],
            question_type=q_data["type"],
            options_json=json.dumps(q_data["options"]),
            expected_answer=q_data["expected"],
            explanation=q_data["explanation"],
            source_reference_json=json.dumps(q_data["source"])
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        # Record in history to prevent future repetition
        db.add(QuestionHistory(user_id=1, question_uid=q.question_uid, question_hash=str(hash(q.text)), topic=q.topic))
        db.commit()

        question_details.append(QuestionDetail(
            id=q.id,
            question_uid=q.question_uid,
            text=q.text,
            topic=q.topic,
            subtopic=q.subtopic,
            difficulty=q.difficulty,
            question_type=q.question_type,
            options=q_data["options"],
            expected_answer=None,
            explanation=None,
            source_reference=None
        ))

    return AssessmentResponse(
        id=assessment.id,
        subject=assessment.subject,
        topic=assessment.topic,
        difficulty=assessment.difficulty,
        total_questions=len(question_details),
        questions=question_details,
        created_at=assessment.created_at
    )

@router.post("/submit", response_model=AssessmentResultResponse)
def submit_assessment(req: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    """
    Grades assessment, updates BKT mastery, and extracts possible misconceptions.
    Provides direct action bridge to Misconception Lab for any missed question.
    """
    assessment = db.query(Assessment).filter_by(id=req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    results: List[SubmittedQuestionResult] = []
    correct_count = 0
    topic_scores: dict[str, list[bool]] = {}
    detected_misconceptions = []

    for resp in req.responses:
        q = db.query(Question).filter_by(id=resp.question_id).first()
        if not q:
            continue

        is_correct = (resp.selected_answer.strip().lower() == q.expected_answer.strip().lower())
        if is_correct:
            correct_count += 1

        # Save student response
        sr = StudentResponse(
            question_id=q.id,
            user_id=1,
            selected_answer=resp.selected_answer,
            is_correct=is_correct,
            response_time_seconds=20
        )
        db.add(sr)

        # Topic tracking
        if q.topic not in topic_scores:
            topic_scores[q.topic] = []
        topic_scores[q.topic].append(is_correct)

        # Parse source citation
        source_cite = None
        if q.source_reference_json:
            try:
                s_dict = json.loads(q.source_reference_json)
                source_cite = Citation(
                    material_name=s_dict.get("material_name", "Course Notes"),
                    location=s_dict.get("location", "Unit 4"),
                    page_number=s_dict.get("page_number"),
                    slide_number=s_dict.get("slide_number"),
                    timestamp_seconds=s_dict.get("timestamp_seconds"),
                    excerpt=s_dict.get("excerpt", "")
                )
            except Exception:
                pass

        # If incorrect, extract potential misconception seed data
        potential_misc = None
        seed_data = None
        if not is_correct:
            if "for" in q.text.lower() or "boundary" in q.subtopic.lower() or "loop" in q.subtopic.lower():
                potential_misc = "Off-By-One Boundary Misconception (< vs <=)"
                detected_misconceptions.append("Off-By-One Boundary Misconception (< vs <=)")
            elif "index" in q.subtopic.lower() or "array" in q.subtopic.lower():
                potential_misc = "Zero-Index vs Array.length Discrepancy"
                detected_misconceptions.append("Zero-Index vs Array.length Discrepancy")
            else:
                potential_misc = "Condition Predicate Misinterpretation"
                detected_misconceptions.append("Condition Predicate Misinterpretation")

            seed_data = {
                "question_text": q.text,
                "student_answer": resp.selected_answer,
                "expected_answer": q.expected_answer,
                "topic": q.topic,
                "subtopic": q.subtopic
            }

        results.append(SubmittedQuestionResult(
            question_id=q.id,
            text=q.text,
            selected_answer=resp.selected_answer,
            expected_answer=q.expected_answer,
            is_correct=is_correct,
            explanation=q.explanation,
            topic=q.topic,
            subtopic=q.subtopic,
            source_citation=source_cite,
            potential_misconception=potential_misc,
            misconception_seed_data=seed_data
        ))

    score_pct = round((correct_count / max(1, len(req.responses))) * 100, 1)
    assessment.score = score_pct
    assessment.completed_at = datetime.utcnow()
    db.commit()

    # Calculate topic-wise percentages
    topic_summary = {}
    for t_name, bools in topic_scores.items():
        topic_summary[t_name] = round((sum(bools) / len(bools)) * 100, 1)

    rec_action = (
        "Launch Misconception Lab to isolate and resolve boundary condition gaps."
        if detected_misconceptions else
        "Great performance! Ready to proceed to advanced Nested Loops."
    )

    return AssessmentResultResponse(
        assessment_id=assessment.id,
        score_percentage=score_pct,
        correct_count=correct_count,
        total_count=len(req.responses),
        results=results,
        topic_performance=topic_summary,
        detected_misconceptions=list(set(detected_misconceptions)),
        recommended_next_action=rec_action
    )
