import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import MisconceptionHypothesis, RecoveryPlan, LearnerMastery, Question
from ..schemas import (
    MisconceptionAnalysisRequest,
    MisconceptionAnalysisResponse,
    DiagnosticFollowupSubmit,
    DiagnosticFollowupResult,
    RecoveryPlanDetail,
    RecoveryActivitySubmit
)
from ..services.misconception_engine import MisconceptionEngine
from ..services.bkt_engine import BKTEngine

router = APIRouter(prefix="/misconceptions", tags=["Misconception Lab"])

@router.get("/latest")
def get_latest_misconception(db: Session = Depends(get_db)):
    """Retrieve highest-priority unresolved misconception for the student."""
    misc = db.query(MisconceptionHypothesis).filter_by(user_id=1).order_by(MisconceptionHypothesis.id.desc()).first()
    if not misc:
        raise HTTPException(status_code=404, detail="No active misconceptions found")

    # Generate or retrieve analysis structure
    analysis = MisconceptionEngine.analyze_error(
        question_text="How many times does this loop execute?\n\nfor (int i = 0; i <= 4; i++) { count++; }",
        student_answer="4 times",
        expected_answer="5 times"
    )

    plan = db.query(RecoveryPlan).filter_by(misconception_id=misc.id).first()

    return {
        "id": misc.id,
        "title": misc.title,
        "description": misc.description,
        "evidence_quote": misc.evidence_quote,
        "related_concept_code": misc.related_concept_code,
        "confidence": misc.confidence,
        "status": misc.status,
        "source_citation": json.loads(misc.source_citation_json or "{}"),
        "diagnostic_question": json.loads(misc.diagnostic_question_json or "{}"),
        "prerequisite_weakness": analysis["prerequisite_weakness"],
        "recovery_plan_id": plan.id if plan else None
    }

@router.post("/analyze", response_model=MisconceptionAnalysisResponse)
def analyze_student_error(req: MisconceptionAnalysisRequest, db: Session = Depends(get_db)):
    """
    Step A & Step B: Ingests an incorrect question response and performs root cause misconception analysis.
    """
    analysis = MisconceptionEngine.analyze_error(
        question_text=req.question_text,
        student_answer=req.student_answer,
        expected_answer=req.expected_answer,
        topic=req.question_topic or "Loops & Control Flow"
    )

    primary = analysis["primary_misconception"]

    # Persist in DB
    misc = MisconceptionHypothesis(
        user_id=1,
        title=primary["title"],
        description=primary["description"],
        evidence_quote=primary["evidence_quote"],
        related_concept_code=primary["related_concept_code"],
        confidence=primary["confidence"],
        status="DIAGNOSED",
        source_citation_json=json.dumps(primary.get("citation") or {}),
        diagnostic_question_json=json.dumps(analysis["diagnostic_question"])
    )
    db.add(misc)
    db.commit()
    db.refresh(misc)

    # Automatically initialize recovery plan for this hypothesis
    rec_detail = MisconceptionEngine.generate_recovery_plan(misc.id, primary["related_concept_code"])
    plan = RecoveryPlan(
        user_id=1,
        misconception_id=misc.id,
        weak_concept_code=primary["related_concept_code"],
        title=rec_detail.title,
        status="IN_PROGRESS",
        explanation_text=rec_detail.explanation_text,
        worked_example_json=json.dumps(rec_detail.worked_example.model_dump()),
        guided_question_json=json.dumps(rec_detail.guided_practice.model_dump()),
        independent_question_json=json.dumps(rec_detail.independent_practice.model_dump()),
        mastery_check_json=json.dumps(rec_detail.mastery_check.model_dump()),
        progress_percentage=20
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return MisconceptionAnalysisResponse(
        misconception_id=misc.id,
        question_text=req.question_text,
        student_answer=req.student_answer,
        expected_answer=req.expected_answer,
        error_summary=analysis["error_summary"],
        hypotheses=analysis["hypotheses"],
        primary_misconception=primary,
        diagnostic_question=analysis["diagnostic_question"],
        prerequisite_weakness=analysis["prerequisite_weakness"],
        recovery_plan_id=plan.id
    )

@router.post("/diagnostic-followup", response_model=DiagnosticFollowupResult)
def submit_diagnostic_followup(data: DiagnosticFollowupSubmit, db: Session = Depends(get_db)):
    """
    Step C: Evaluates diagnostic discriminator answer and updates hypothesis confidence & diagnosis.
    """
    misc = db.query(MisconceptionHypothesis).filter_by(id=data.misconception_id).first()
    if not misc:
        raise HTTPException(status_code=404, detail="Misconception not found")

    result = MisconceptionEngine.evaluate_diagnostic_followup(
        misconception_id=data.misconception_id,
        selected_option_index=data.selected_option_index,
        selected_option_text=data.selected_option_text
    )

    misc.student_followup_answer = data.selected_option_text
    misc.confidence = result["revised_confidence"]
    misc.final_diagnosis = result["diagnosis_verdict"]
    misc.status = "INVESTIGATING" if not result["more_evidence_needed"] else "NEEDS_EVIDENCE"
    db.commit()

    return DiagnosticFollowupResult(**result)

@router.get("/{misconception_id}/recovery-plan", response_model=RecoveryPlanDetail)
def get_recovery_plan(misconception_id: int, db: Session = Depends(get_db)):
    """
    Step E: Fetch 5-step recovery sequence for this misconception.
    """
    plan = db.query(RecoveryPlan).filter_by(misconception_id=misconception_id).first()
    if not plan:
        # Generate on the fly
        misc = db.query(MisconceptionHypothesis).filter_by(id=misconception_id).first()
        code = misc.related_concept_code if misc else "JAVA_LOOP_CONDITIONS"
        return MisconceptionEngine.generate_recovery_plan(misconception_id, code)

    w_ex = json.loads(plan.worked_example_json or "{}")
    g_q = json.loads(plan.guided_question_json or "{}")
    i_q = json.loads(plan.independent_question_json or "{}")
    m_c = json.loads(plan.mastery_check_json or "{}")

    # Cite weak concept source
    citation = None
    if plan.misconception and plan.misconception.source_citation_json:
        try:
            citation = json.loads(plan.misconception.source_citation_json)
        except Exception:
            pass

    return RecoveryPlanDetail(
        id=plan.id,
        misconception_id=plan.misconception_id,
        weak_concept_code=plan.weak_concept_code,
        weak_concept_name="Loop Conditions & Boundary Invariants",
        title=plan.title,
        status=plan.status,
        progress_percentage=plan.progress_percentage,
        explanation_text=plan.explanation_text,
        source_citation=citation,
        worked_example=w_ex,
        guided_practice=g_q,
        independent_practice=i_q,
        mastery_check=m_c
    )

@router.post("/recovery-activity/submit")
def submit_recovery_activity(req: RecoveryActivitySubmit, db: Session = Depends(get_db)):
    """
    Validates step submission in the recovery sequence and updates student mastery via BKT.
    """
    plan = db.query(RecoveryPlan).filter_by(id=req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    step = req.step
    ans = req.submitted_answer.strip().lower()
    is_correct = False
    feedback = ""

    if step == "guided":
        is_correct = "4 times" in ans or ans == "4 times"
        feedback = "Correct! The loop executes 4 times (k = 0, 1, 2, 3)." if is_correct else "Not quite. Remember that k starts at 0 and strictly stays less than 4."
        plan.progress_percentage = max(plan.progress_percentage, 50)
    elif step == "independent":
        is_correct = "14" in ans
        feedback = "Spot on! The variable increments until x becomes 14, at which point 14 <= 13 is false." if is_correct else "Check what x equals when the while condition finally terminates."
        plan.progress_percentage = max(plan.progress_percentage, 75)
    elif step == "mastery_check":
        is_correct = "arrayindexoutofboundsexception" in ans or "out of bounds" in ans
        feedback = "Excellent! You correctly identified that i reaches 3 (arr.length), causing an ArrayIndexOutOfBoundsException." if is_correct else "Recall that the last valid index is length - 1."
        if is_correct:
            plan.progress_percentage = 100
            plan.status = "COMPLETED"
            plan.completed_at = datetime.utcnow()

            # Update student BKT mastery for this weak concept!
            mastery = db.query(LearnerMastery).filter_by(user_id=1, concept_code=plan.weak_concept_code).first()
            if mastery:
                new_p_l, trace = BKTEngine.update_mastery(mastery.mastery_probability, is_correct=True)
                mastery.mastery_probability = new_p_l
                mastery.attempts_count += 1
                mastery.correct_count += 1
                mastery.status = BKTEngine.get_status(new_p_l)
                mastery.last_updated = datetime.utcnow()
                db.commit()

            # Mark misconception as resolved
            if plan.misconception:
                plan.misconception.status = "RESOLVED"
                db.commit()

    db.commit()

    return {
        "success": True,
        "is_correct": is_correct,
        "feedback": feedback,
        "plan_status": plan.status,
        "progress_percentage": plan.progress_percentage
    }
