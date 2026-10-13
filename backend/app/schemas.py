from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Citation Model
class Citation(BaseModel):
    material_id: Optional[int] = None
    material_name: str
    location: str # e.g. "Page 3", "Slide 5", "03:45"
    page_number: Optional[int] = None
    slide_number: Optional[int] = None
    timestamp_seconds: Optional[float] = None
    excerpt: str

# Study Material
class MaterialChunkResponse(BaseModel):
    id: int
    chunk_index: int
    content: str
    source_location: str
    page_number: Optional[int]
    slide_number: Optional[int]
    timestamp_seconds: Optional[float]
    topic: str

class StudyMaterialResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    file_size_bytes: int
    subject: str
    status: str
    chunk_count: int
    topics: List[str]
    upload_date: datetime

class ExtractedContentDetail(BaseModel):
    material: StudyMaterialResponse
    chunks: List[MaterialChunkResponse]

# AI Tutor
class ChatMessageSchema(BaseModel):
    id: int
    sender: str
    content: str
    mode: str
    citations: List[Citation] = []
    is_simulated: bool = False
    created_at: datetime

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    question: str
    mode: str = "step_by_step" # 'simple', 'step_by_step', 'examples'
    material_id: Optional[int] = None

class ChatResponse(BaseModel):
    conversation_id: int
    answer: str
    citations: List[Citation]
    mode: str
    is_simulated: bool
    grounded_in_sources: bool
    suggested_followups: List[str]

# Misconception Lab
class MisconceptionHypothesisItem(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    evidence_quote: str
    related_concept: str
    related_concept_code: str
    confidence: float
    citation: Optional[Citation] = None
    category: str = "Conceptual Misunderstanding" # Conceptual, Careless Slip, Syntax Confusion, Incomplete Knowledge

class DiagnosticQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    target_distinction: str # e.g., "Distinguishes between off-by-one index vs condition termination"
    expected_answer_index: int

class MisconceptionAnalysisRequest(BaseModel):
    question_text: str
    student_answer: str
    expected_answer: str
    question_topic: Optional[str] = "Loops & Iteration"
    concept_code: Optional[str] = "JAVA_LOOP_CONDITIONS"

class MisconceptionAnalysisResponse(BaseModel):
    misconception_id: int
    question_text: str
    student_answer: str
    expected_answer: str
    error_summary: str
    hypotheses: List[MisconceptionHypothesisItem]
    primary_misconception: MisconceptionHypothesisItem
    diagnostic_question: DiagnosticQuestion
    prerequisite_weakness: Dict[str, Any]
    recovery_plan_id: Optional[int] = None

class DiagnosticFollowupSubmit(BaseModel):
    misconception_id: int
    selected_option_index: int
    selected_option_text: str

class DiagnosticFollowupResult(BaseModel):
    misconception_id: int
    is_confirmed: bool
    revised_confidence: float
    diagnosis_verdict: str
    diagnosis_explanation: str
    weak_prerequisite_confirmed: str
    more_evidence_needed: bool

class WorkedExample(BaseModel):
    title: str
    code_or_problem: str
    step_by_step: List[str]
    key_takeaway: str

class PracticeQuestion(BaseModel):
    id: str
    prompt: str
    options: Optional[List[str]] = None
    expected_answer: str
    hint: str
    explanation: str

class RecoveryPlanDetail(BaseModel):
    id: int
    misconception_id: Optional[int]
    weak_concept_code: str
    weak_concept_name: str
    title: str
    status: str
    progress_percentage: int
    explanation_text: str
    source_citation: Optional[Citation] = None
    worked_example: WorkedExample
    guided_practice: PracticeQuestion
    independent_practice: PracticeQuestion
    mastery_check: PracticeQuestion

class RecoveryActivitySubmit(BaseModel):
    plan_id: int
    step: str # 'guided', 'independent', 'mastery_check'
    submitted_answer: str

# Assessments
class QuestionDetail(BaseModel):
    id: int
    question_uid: str
    text: str
    topic: str
    subtopic: str
    difficulty: str
    question_type: str
    options: List[str]
    expected_answer: Optional[str] = None # hidden during quiz
    explanation: Optional[str] = None     # hidden during quiz
    source_reference: Optional[Dict[str, Any]] = None

class AssessmentCreateRequest(BaseModel):
    subject: str = "Java Programming"
    topic: str = "Loops & Control Flow"
    num_questions: int = 5
    difficulty: str = "Medium"
    question_type: str = "MCQ"

class AssessmentResponse(BaseModel):
    id: int
    subject: str
    topic: str
    difficulty: str
    total_questions: int
    questions: List[QuestionDetail]
    created_at: datetime

class QuestionSubmission(BaseModel):
    question_id: int
    selected_answer: str

class AssessmentSubmitRequest(BaseModel):
    assessment_id: int
    responses: List[QuestionSubmission]

class SubmittedQuestionResult(BaseModel):
    question_id: int
    text: str
    selected_answer: str
    expected_answer: str
    is_correct: bool
    explanation: str
    topic: str
    subtopic: str
    source_citation: Optional[Citation] = None
    potential_misconception: Optional[str] = None
    misconception_seed_data: Optional[Dict[str, Any]] = None

class AssessmentResultResponse(BaseModel):
    assessment_id: int
    score_percentage: float
    correct_count: int
    total_count: int
    results: List[SubmittedQuestionResult]
    topic_performance: Dict[str, float]
    detected_misconceptions: List[str]
    recommended_next_action: str

# Learning Path / Concept Graph
class ConceptNode(BaseModel):
    id: str # Concept code, e.g. "JAVA_LOOP_CONDITIONS"
    label: str
    subject: str
    description: str
    difficulty: str
    status: str # 'MASTERED', 'LEARNING', 'NEEDS_REVISION', 'NOT_ASSESSED'
    mastery_pct: int
    attempts: int
    sources: List[str]
    position: Dict[str, float]

class ConceptEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    is_weak_prerequisite: bool = False

class LearningPathGraph(BaseModel):
    nodes: List[ConceptNode]
    edges: List[ConceptEdge]

# Analytics & Dashboard
class DashboardSummary(BaseModel):
    student_name: str
    streak_days: int
    total_study_materials: int
    concepts_mastered: int
    concepts_needing_revision: int
    overall_mastery_pct: int
    recent_quiz_score: float
    recent_misconceptions: List[Dict[str, Any]]
    recommended_activity: Dict[str, Any]
    upcoming_tasks: List[Dict[str, Any]]
    weekly_performance: List[Dict[str, Any]]
    topic_mastery: List[Dict[str, Any]]

class ProgressAnalytics(BaseModel):
    bkt_mastery_by_concept: List[Dict[str, Any]]
    assessment_history: List[Dict[str, Any]]
    misconceptions_stats: Dict[str, int]
    error_patterns: List[Dict[str, Any]]
    improvement_trends: List[Dict[str, Any]]
    question_repetition_rate: float
    recovery_plan_completion_rate: float
