import {
  UserProfile,
  StudyMaterial,
  MaterialDetail,
  ChatMessage,
  ConversationItem,
  MisconceptionAnalysis,
  DiagnosticFollowupResult,
  RecoveryPlan,
  Assessment,
  AssessmentResult,
  ConceptGraph,
  DashboardSummary,
  ProgressAnalytics,
  EvaluationBenchmark,
  AppSettings
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errData = await res.json();
      errorDetail = errData.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Auth
  getCurrentUser: () => fetchJson<UserProfile>('/auth/me'),

  // Study Materials
  getMaterials: (search?: string, fileType?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (fileType) params.append('file_type', fileType);
    return fetchJson<StudyMaterial[]>(`/materials?${params.toString()}`);
  },
  getMaterialDetail: (id: number) => fetchJson<MaterialDetail>(`/materials/${id}`),
  uploadMaterial: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/materials/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  deleteMaterial: (id: number) =>
    fetchJson<{ success: boolean; message: string }>(`/materials/${id}`, { method: 'DELETE' }),

  // AI Tutor
  getConversations: () => fetchJson<ConversationItem[]>('/tutor/conversations'),
  getMessages: (conversationId: number) => fetchJson<ChatMessage[]>(`/tutor/messages/${conversationId}`),
  askTutor: (question: string, mode = 'step_by_step', conversationId?: number, materialId?: number) =>
    fetchJson<{
      conversation_id: number;
      answer: string;
      citations: any[];
      mode: string;
      is_simulated: boolean;
      grounded_in_sources: boolean;
      suggested_followups: string[];
    }>('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify({ question, mode, conversation_id: conversationId, material_id: materialId })
    }),
  getSuggestedQuestions: () =>
    fetchJson<Array<{ category: string; question: string; source: string }>>('/tutor/suggested-questions'),

  // Misconception Lab
  getLatestMisconception: () => fetchJson<any>('/misconceptions/latest'),
  analyzeError: (questionText: string, studentAnswer: string, expectedAnswer: string, topic?: string) =>
    fetchJson<MisconceptionAnalysis>('/misconceptions/analyze', {
      method: 'POST',
      body: JSON.stringify({
        question_text: questionText,
        student_answer: studentAnswer,
        expected_answer: expectedAnswer,
        question_topic: topic
      })
    }),
  submitDiagnosticFollowup: (misconceptionId: number, selectedIndex: number, selectedText: string) =>
    fetchJson<DiagnosticFollowupResult>('/misconceptions/diagnostic-followup', {
      method: 'POST',
      body: JSON.stringify({
        misconception_id: misconceptionId,
        selected_option_index: selectedIndex,
        selected_option_text: selectedText
      })
    }),
  getRecoveryPlan: (misconceptionId: number) =>
    fetchJson<RecoveryPlan>(`/misconceptions/${misconceptionId}/recovery-plan`),
  submitRecoveryActivity: (planId: number, step: string, submittedAnswer: string) =>
    fetchJson<{
      success: boolean;
      is_correct: boolean;
      feedback: string;
      plan_status: string;
      progress_percentage: number;
    }>('/misconceptions/recovery-activity/submit', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        step,
        submitted_answer: submittedAnswer
      })
    }),

  // Adaptive Assessments
  getAssessments: () => fetchJson<Assessment[]>('/assessments'),
  getAssessment: (id: number) => fetchJson<Assessment>(`/assessments/${id}`),
  generateAssessment: (params: {
    subject: string;
    topic: string;
    num_questions: number;
    difficulty: string;
    question_type: string;
  }) =>
    fetchJson<Assessment>('/assessments/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  submitAssessment: (assessmentId: number, responses: Array<{ question_id: number; selected_answer: string }>) =>
    fetchJson<AssessmentResult>('/assessments/submit', {
      method: 'POST',
      body: JSON.stringify({
        assessment_id: assessmentId,
        responses
      })
    }),

  // Learning Path
  getConceptGraph: () => fetchJson<ConceptGraph>('/learning-path/graph'),
  getConceptDetail: (code: string) => fetchJson<any>(`/learning-path/concept/${code}`),

  // Dashboard & Analytics
  getDashboardSummary: () => fetchJson<DashboardSummary>('/analytics/dashboard'),
  getProgressAnalytics: () => fetchJson<ProgressAnalytics>('/analytics/progress'),

  // Evaluation
  runSystemEvaluation: () => fetchJson<EvaluationBenchmark>('/evaluation/run'),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/settings'),
  updateSettings: (params: Partial<AppSettings>) =>
    fetchJson<any>('/settings/update', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  resetDemoData: () => fetchJson<{ success: boolean; message: string }>('/settings/reset-demo-data', { method: 'POST' })
};
