export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  streak_days: number;
  created_at: string;
}

export interface Citation {
  material_id?: number;
  material_name: string;
  location: string;
  page_number?: number;
  slide_number?: number;
  timestamp_seconds?: number;
  excerpt: string;
}

export interface MaterialChunk {
  id: number;
  chunk_index: number;
  content: string;
  source_location: string;
  page_number?: number;
  slide_number?: number;
  timestamp_seconds?: number;
  topic: string;
}

export interface StudyMaterial {
  id: number;
  title: string;
  filename: string;
  file_type: 'pdf' | 'pptx' | 'video_transcript';
  file_size_bytes: number;
  subject: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  chunk_count: number;
  topics: string[];
  upload_date: string;
}

export interface MaterialDetail {
  material: StudyMaterial;
  chunks: MaterialChunk[];
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'tutor';
  content: string;
  mode: 'simple' | 'step_by_step' | 'examples';
  citations: Citation[];
  is_simulated: boolean;
  created_at: string;
}

export interface ConversationItem {
  id: number;
  title: string;
  created_at: string;
  message_count: number;
}

export interface MisconceptionHypothesis {
  id?: number;
  title: string;
  description: string;
  evidence_quote: string;
  related_concept: string;
  related_concept_code: string;
  confidence: number;
  citation?: Citation;
  category: string;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  target_distinction: string;
  expected_answer_index: number;
}

export interface PrerequisiteNode {
  code: string;
  name: string;
  status: 'MASTERED' | 'LEARNING' | 'NEEDS_REVISION' | 'NOT_ASSESSED';
  is_weak?: boolean;
  reason?: string;
}

export interface PrerequisiteWeaknessMap {
  target_concept: {
    code: string;
    name: string;
    status: string;
  };
  prerequisites: PrerequisiteNode[];
  suspected_weak_node: string;
}

export interface MisconceptionAnalysis {
  misconception_id: number;
  question_text: string;
  student_answer: string;
  expected_answer: string;
  error_summary: string;
  hypotheses: MisconceptionHypothesis[];
  primary_misconception: MisconceptionHypothesis;
  diagnostic_question: DiagnosticQuestion;
  prerequisite_weakness: PrerequisiteWeaknessMap;
  recovery_plan_id?: number;
}

export interface DiagnosticFollowupResult {
  misconception_id: number;
  is_confirmed: boolean;
  revised_confidence: number;
  diagnosis_verdict: string;
  diagnosis_explanation: string;
  weak_prerequisite_confirmed: string;
  more_evidence_needed: boolean;
}

export interface WorkedExample {
  title: string;
  code_or_problem: string;
  step_by_step: string[];
  key_takeaway: string;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  options?: string[];
  expected_answer: string;
  hint: string;
  explanation: string;
}

export interface RecoveryPlan {
  id: number;
  misconception_id?: number;
  weak_concept_code: string;
  weak_concept_name: string;
  title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress_percentage: number;
  explanation_text: string;
  source_citation?: Citation;
  worked_example: WorkedExample;
  guided_practice: PracticeQuestion;
  independent_practice: PracticeQuestion;
  mastery_check: PracticeQuestion;
}

export interface QuestionDetail {
  id: number;
  question_uid: string;
  text: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  question_type: string;
  options: string[];
  expected_answer?: string;
  explanation?: string;
  source_reference?: any;
}

export interface Assessment {
  id: number;
  subject: string;
  topic: string;
  difficulty: string;
  total_questions: number;
  questions: QuestionDetail[];
  created_at: string;
}

export interface SubmittedQuestionResult {
  question_id: number;
  text: string;
  selected_answer: string;
  expected_answer: string;
  is_correct: boolean;
  explanation: string;
  topic: string;
  subtopic: string;
  source_citation?: Citation;
  potential_misconception?: string;
  misconception_seed_data?: {
    question_text: string;
    student_answer: string;
    expected_answer: string;
    topic: string;
    subtopic: string;
  };
}

export interface AssessmentResult {
  assessment_id: number;
  score_percentage: number;
  correct_count: number;
  total_count: number;
  results: SubmittedQuestionResult[];
  topic_performance: Record<string, number>;
  detected_misconceptions: string[];
  recommended_next_action: string;
}

export interface ConceptGraphNode {
  id: string;
  label: string;
  subject: string;
  description: string;
  difficulty: string;
  status: 'MASTERED' | 'LEARNING' | 'NEEDS_REVISION' | 'NOT_ASSESSED';
  mastery_pct: number;
  attempts: number;
  sources: string[];
  position: { x: number; y: number };
  [key: string]: any;
}

export interface ConceptGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  is_weak_prerequisite: boolean;
}

export interface ConceptGraph {
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
}

export interface DashboardSummary {
  student_name: string;
  streak_days: number;
  total_study_materials: number;
  concepts_mastered: number;
  concepts_needing_revision: number;
  overall_mastery_pct: number;
  recent_quiz_score: number;
  recent_misconceptions: Array<{
    id: number;
    title: string;
    concept: string;
    status: string;
    confidence: number;
  }>;
  recommended_activity: {
    title: string;
    type: string;
    description: string;
    action_route: string;
    misconception_id: number;
    priority: string;
  };
  upcoming_tasks: Array<{
    title: string;
    due: string;
    status: string;
  }>;
  weekly_performance: Array<{
    day: string;
    score: number;
    target: number;
    assessments: number;
  }>;
  topic_mastery: Array<{
    topic: string;
    mastery: number;
    status: string;
  }>;
}

export interface ProgressAnalytics {
  bkt_mastery_by_concept: Array<{
    code: string;
    name: string;
    p_mastery: number;
    percentage: number;
    attempts: number;
    correct: number;
    status: string;
  }>;
  assessment_history: Array<{
    id: number;
    topic: string;
    difficulty: string;
    score: number;
    total_questions: number;
    date: string;
  }>;
  misconceptions_stats: {
    total_detected: number;
    resolved: number;
    active: number;
  };
  error_patterns: Array<{
    pattern: string;
    frequency: number;
    severity: string;
    remedy: string;
  }>;
  improvement_trends: Array<{
    attempt: string;
    score: number;
  }>;
  question_repetition_rate: number;
  recovery_plan_completion_rate: number;
}

export interface EvaluationBenchmark {
  summary_metrics: {
    faithfulness: number;
    answer_relevancy: number;
    context_precision: number;
    context_recall: number;
    citation_correctness: number;
    question_correctness: number;
    question_repetition_rate: number;
    pre_post_mastery_delta: number;
    total_benchmark_tests: number;
    tests_passed: number;
  };
  test_cases: Array<{
    test_id: string;
    query: string;
    type: string;
    faithfulness: number;
    relevancy: number;
    precision: number;
    recall: number;
    citation_correctness: number;
    retrieved_count: number;
    passed: boolean;
  }>;
  evaluation_engine_version: string;
  is_measured_empirical: boolean;
}

export interface AppSettings {
  demo_mode: boolean;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  gemini_api_key?: string;
  openai_api_key?: string;
  llm_model: string;
  database_url: string;
  version: string;
  is_live_ai_active: boolean;
}
