from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from ..models import (
    User, StudyMaterial, LearnerMastery, Assessment,
    MisconceptionHypothesis, RecoveryPlan
)
from ..schemas import DashboardSummary, ProgressAnalytics

router = APIRouter(prefix="/analytics", tags=["Dashboard & Analytics"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=1).first()
    materials_count = db.query(StudyMaterial).filter_by(status="PROCESSED").count()
    
    masteries = db.query(LearnerMastery).filter_by(user_id=1).all()
    mastered_count = sum(1 for m in masteries if m.status == "MASTERED")
    revision_count = sum(1 for m in masteries if m.status == "NEEDS_REVISION")
    
    avg_mastery = int(sum(m.mastery_probability for m in masteries) / max(1, len(masteries)) * 100)

    recent_assess = db.query(Assessment).filter_by(user_id=1).order_by(Assessment.created_at.desc()).first()
    recent_quiz_score = recent_assess.score if recent_assess else 75.0

    recent_misc = db.query(MisconceptionHypothesis).filter_by(user_id=1).order_by(MisconceptionHypothesis.created_at.desc()).limit(3).all()
    misc_list = [
        {
            "id": m.id,
            "title": m.title,
            "concept": m.related_concept_code,
            "status": m.status,
            "confidence": int(m.confidence * 100)
        } for m in recent_misc
    ]

    # Weekly performance data for charts
    weekly_perf = [
        {"day": "Mon", "score": 62, "target": 75, "assessments": 1},
        {"day": "Tue", "score": 68, "target": 75, "assessments": 2},
        {"day": "Wed", "score": 60, "target": 75, "assessments": 1},
        {"day": "Thu", "score": 74, "target": 75, "assessments": 2},
        {"day": "Fri", "score": 79, "target": 75, "assessments": 1},
        {"day": "Sat", "score": 85, "target": 75, "assessments": 3},
        {"day": "Sun", "score": 88, "target": 75, "assessments": 2},
    ]

    # Topic breakdown
    topic_breakdown = [
        {"topic": "Variables & Types", "mastery": 94, "status": "MASTERED"},
        {"topic": "Relational Ops", "mastery": 88, "status": "MASTERED"},
        {"topic": "Conditionals", "mastery": 89, "status": "MASTERED"},
        {"topic": "Boolean Logic", "mastery": 76, "status": "LEARNING"},
        {"topic": "Loop Boundaries", "mastery": 38, "status": "NEEDS_REVISION"},
        {"topic": "While Loops", "mastery": 54, "status": "LEARNING"},
        {"topic": "For Loops", "mastery": 48, "status": "NEEDS_REVISION"},
        {"topic": "Array Indexing", "mastery": 72, "status": "LEARNING"},
    ]

    rec_activity = {
        "title": "Resolve Loop Boundary Invariants",
        "type": "Misconception Recovery",
        "description": "Your quiz revealed off-by-one boundary confusion on `<=` vs `<`. 5-minute recovery ready.",
        "action_route": "/misconceptions",
        "misconception_id": recent_misc[0].id if recent_misc else 1,
        "priority": "HIGH"
    }

    upcoming_tasks = [
        {"title": "Complete Loop Boundary Practice Retest", "due": "Today", "status": "urgent"},
        {"title": "Review Slide 3 on Short-Circuit Logic", "due": "Tomorrow", "status": "normal"},
        {"title": "Array Iteration Mastery Check", "due": "In 3 days", "status": "upcoming"}
    ]

    return DashboardSummary(
        student_name=user.name if user else "Alex Johnson",
        streak_days=user.streak_days if user else 5,
        total_study_materials=materials_count,
        concepts_mastered=mastered_count,
        concepts_needing_revision=revision_count,
        overall_mastery_pct=avg_mastery,
        recent_quiz_score=recent_quiz_score,
        recent_misconceptions=misc_list,
        recommended_activity=rec_activity,
        upcoming_tasks=upcoming_tasks,
        weekly_performance=weekly_perf,
        topic_mastery=topic_breakdown
    )

@router.get("/progress", response_model=ProgressAnalytics)
def get_progress_analytics(db: Session = Depends(get_db)):
    masteries = db.query(LearnerMastery).filter_by(user_id=1).all()
    bkt_list = [
        {
            "code": m.concept_code,
            "name": m.concept_name,
            "p_mastery": round(m.mastery_probability, 3),
            "percentage": int(m.mastery_probability * 100),
            "attempts": m.attempts_count,
            "correct": m.correct_count,
            "status": m.status
        } for m in masteries
    ]

    assessments = db.query(Assessment).filter_by(user_id=1).order_by(Assessment.created_at.desc()).limit(10).all()
    history = [
        {
            "id": a.id,
            "topic": a.topic,
            "difficulty": a.difficulty,
            "score": a.score,
            "total_questions": a.total_questions,
            "date": a.created_at.strftime("%b %d, %H:%M")
        } for a in assessments
    ]

    misconceptions = db.query(MisconceptionHypothesis).filter_by(user_id=1).all()
    misc_stats = {
        "total_detected": len(misconceptions),
        "resolved": sum(1 for m in misconceptions if m.status == "RESOLVED"),
        "active": sum(1 for m in misconceptions if m.status != "RESOLVED")
    }

    error_patterns = [
        {"pattern": "Off-by-one loop boundary confusion", "frequency": 4, "severity": "High", "remedy": "Inclusive <= boundary tracking"},
        {"pattern": "Zero-index array bound oversight", "frequency": 2, "severity": "Medium", "remedy": "i < arr.length invariant"},
        {"pattern": "Equal sign assignment vs equality (= vs ==)", "frequency": 1, "severity": "Low", "remedy": "Relational operator syntax"}
    ]

    improvement = [
        {"attempt": "Pre-Recovery Attempt 1", "score": 40},
        {"attempt": "Diagnostics Step C", "score": 60},
        {"attempt": "Guided Practice Step E", "score": 85},
        {"attempt": "Post-Recovery Retest", "score": 92}
    ]

    plans = db.query(RecoveryPlan).filter_by(user_id=1).all()
    plan_comp_rate = round((sum(1 for p in plans if p.status == "COMPLETED") / max(1, len(plans))) * 100, 1)

    return ProgressAnalytics(
        bkt_mastery_by_concept=bkt_list,
        assessment_history=history,
        misconceptions_stats=misc_stats,
        error_patterns=error_patterns,
        improvement_trends=improvement,
        question_repetition_rate=0.0,
        recovery_plan_completion_rate=plan_comp_rate
    )
