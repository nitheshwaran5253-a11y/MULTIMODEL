from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Concept, Prerequisite, LearnerMastery, StudyMaterial
from ..schemas import ConceptNode, ConceptEdge, LearningPathGraph

router = APIRouter(prefix="/learning-path", tags=["Prerequisite Learning Path"])

@router.get("/graph", response_model=LearningPathGraph)
def get_concept_graph(db: Session = Depends(get_db)):
    """
    Returns nodes and edges formatted for React Flow, with real-time student mastery states.
    """
    concepts = db.query(Concept).order_by(Concept.order_index).all()
    prereqs = db.query(Prerequisite).all()
    masteries = {m.concept_code: m for m in db.query(LearnerMastery).filter_by(user_id=1).all()}

    # Graph layout coordinates (Directed DAG from Left to Right / Top to Bottom)
    positions = {
        "JAVA_VARS_TYPES": {"x": 50, "y": 150},
        "JAVA_COMPARISON_OPS": {"x": 280, "y": 80},
        "JAVA_BOOLEAN_LOGIC": {"x": 520, "y": 80},
        "JAVA_IF_ELSE": {"x": 760, "y": 80},
        "JAVA_LOOP_CONDITIONS": {"x": 280, "y": 260},
        "JAVA_WHILE_LOOPS": {"x": 520, "y": 200},
        "JAVA_FOR_LOOPS": {"x": 520, "y": 320},
        "JAVA_ARRAY_INDEXING": {"x": 280, "y": 420},
        "JAVA_NESTED_LOOPS": {"x": 760, "y": 320},
    }

    nodes = []
    for c in concepts:
        m = masteries.get(c.code)
        m_prob = m.mastery_probability if m else 0.0
        status = m.status if m else "NOT_ASSESSED"
        attempts = m.attempts_count if m else 0

        # Sources relevant to this concept
        sources = []
        if "loop" in c.code.lower():
            sources.append("Java_Control_Flow_Loops.pdf (Page 1-3)")
        elif "comp" in c.code.lower() or "bool" in c.code.lower() or "if" in c.code.lower():
            sources.append("Java_Conditionals_Operators.pptx (Slide 2-3)")
        elif "array" in c.code.lower():
            sources.append("Java_Arrays_and_Iteration.mp4 (Timestamp 01:05-04:55)")
        else:
            sources.append("Java Course Overview")

        nodes.append(ConceptNode(
            id=c.code,
            label=c.name,
            subject=c.subject,
            description=c.description,
            difficulty=c.difficulty_level,
            status=status,
            mastery_pct=int(m_prob * 100),
            attempts=attempts,
            sources=sources,
            position=positions.get(c.code, {"x": 100, "y": 100})
        ))

    concept_id_map = {c.id: c.code for c in concepts}
    edges = []
    for idx, p in enumerate(prereqs):
        src_code = concept_id_map.get(p.prerequisite_id)
        tgt_code = concept_id_map.get(p.concept_id)
        if src_code and tgt_code:
            is_weak = (src_code == "JAVA_LOOP_CONDITIONS" or tgt_code == "JAVA_LOOP_CONDITIONS")
            edges.append(ConceptEdge(
                id=f"edge-{idx}-{src_code}-{tgt_code}",
                source=src_code,
                target=tgt_code,
                relationship_type=p.relationship_type,
                is_weak_prerequisite=is_weak
            ))

    return LearningPathGraph(nodes=nodes, edges=edges)

@router.get("/concept/{concept_code}")
def get_concept_detail(concept_code: str, db: Session = Depends(get_db)):
    concept = db.query(Concept).filter_by(code=concept_code).first()
    if not concept:
        return {"error": "Concept not found"}

    mastery = db.query(LearnerMastery).filter_by(user_id=1, concept_code=concept_code).first()
    prereqs = (
        db.query(Concept)
        .join(Prerequisite, Prerequisite.prerequisite_id == Concept.id)
        .filter(Prerequisite.concept_id == concept.id)
        .all()
    )

    return {
        "code": concept.code,
        "name": concept.name,
        "description": concept.description,
        "difficulty": concept.difficulty_level,
        "mastery_probability": mastery.mastery_probability if mastery else 0.0,
        "status": mastery.status if mastery else "NOT_ASSESSED",
        "attempts": mastery.attempts_count if mastery else 0,
        "prerequisites": [{"code": p.code, "name": p.name} for p in prereqs],
        "recommended_activity": (
            "Start Learning Recovery in Misconception Lab"
            if (mastery and mastery.status == "NEEDS_REVISION") else
            "Take Adaptive Assessment Quiz"
        )
    }
