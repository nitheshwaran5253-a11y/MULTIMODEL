import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BrainCircuit,
  RotateCcw,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { Assessment, AssessmentResult, Citation } from '../types';
import { Badge } from '../components/common/Badge';
import { SourceViewerModal } from '../components/common/SourceViewerModal';

interface AssessmentsPageProps {
  onOpenRecoveryForError: (seedData: any) => void;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ onOpenRecoveryForError }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Generator form modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSubject, setGenSubject] = useState('Java Programming');
  const [genTopic, setGenTopic] = useState('Loops & Iteration');
  const [genNumQuestions, setGenNumQuestions] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState('Medium');
  const [genQuestionType, setGenQuestionType] = useState('MCQ');

  const fetchAssessments = async () => {
    try {
      const list = await api.getAssessments();
      setAssessments(list);
      if (list.length > 0 && !activeAssessment) {
        setActiveAssessment(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const newAssess = await api.generateAssessment({
        subject: genSubject,
        topic: genTopic,
        num_questions: genNumQuestions,
        difficulty: genDifficulty,
        question_type: genQuestionType
      });
      setShowGenModal(false);
      setAssessments((prev) => [newAssess, ...prev]);
      setActiveAssessment(newAssess);
      setActiveResult(null);
      setUserAnswers({});
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (qId: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeAssessment) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < activeAssessment.questions.length) {
      if (!window.confirm(`You answered ${answeredCount}/${activeAssessment.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const responses = activeAssessment.questions.map((q) => ({
        question_id: q.id,
        selected_answer: userAnswers[q.id] || 'No answer submitted'
      }));

      const res = await api.submitAssessment(activeAssessment.id, responses);
      setActiveResult(res);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-blue-600" />
            Adaptive Assessments
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Quizzes generated directly from verified course materials with anti-repetition tracking and misconception detection.
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Generate New Quiz
        </button>
      </div>

      {/* Quiz Selector bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {assessments.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setActiveAssessment(a);
              setActiveResult(null);
              setUserAnswers({});
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
              activeAssessment?.id === a.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {a.topic} ({a.difficulty})
          </button>
        ))}
      </div>

      {/* Active Quiz Player */}
      {activeAssessment && !activeResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{activeAssessment.subject}</span>
              <h2 className="text-xl font-black text-slate-900">{activeAssessment.topic}</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="blue">{activeAssessment.difficulty}</Badge>
              <span className="text-slate-400 font-medium">{activeAssessment.questions.length} Questions</span>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-8">
            {activeAssessment.questions.map((q, idx) => {
              const selected = userAnswers[q.id];
              return (
                <div key={q.id} className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Question {idx + 1} of {activeAssessment.questions.length}
                    </span>
                    <span className="text-slate-500 font-medium">{q.subtopic}</span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 leading-relaxed font-mono whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200">
                    {q.text}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selected === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`w-full p-3.5 rounded-xl text-left border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                            isChosen
                              ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <span>{opt}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isChosen ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isChosen && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Quiz Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Answered <strong>{Object.keys(userAnswers).length}</strong> of {activeAssessment.questions.length}
            </span>
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {submitting ? 'Grading & Diagnosing...' : 'Submit Assessment'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* POST-SUBMISSION RESULTS VIEW */}
      {activeResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8 animate-in fade-in">
          {/* Results Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Report</span>
              <h2 className="text-2xl font-black text-slate-900">Performance & Diagnosis</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Overall Score</div>
                <div className="text-3xl font-black text-blue-600">{activeResult.score_percentage}%</div>
              </div>
              <Badge variant={activeResult.score_percentage >= 75 ? 'green' : 'amber'} size="md">
                {activeResult.correct_count} / {activeResult.total_count} Correct
              </Badge>
            </div>
          </div>

          {/* Detected Misconceptions Banner */}
          {activeResult.detected_misconceptions.length > 0 && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 text-rose-600" />
                Possible Misconceptions Detected ({activeResult.detected_misconceptions.length})
              </div>
              <p className="text-xs text-rose-900">
                Your responses reveal systematic difficulty with boundary condition evaluation. We recommend investigating this immediately in the Misconception Lab.
              </p>
            </div>
          )}

          {/* Breakdown per question */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Item Review</h3>
            {activeResult.results.map((r, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${
                  r.is_correct ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/30'
                } space-y-4`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Question {idx + 1}</span>
                  <Badge variant={r.is_correct ? 'green' : 'red'}>
                    {r.is_correct ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>

                <div className="text-sm font-semibold text-slate-900 font-mono whitespace-pre-wrap">
                  {r.text}
                </div>

                {/* Response check */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${r.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <span className="font-bold block">Your Answer:</span>
                    <span>{r.selected_answer}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900">
                    <span className="font-bold block text-slate-500">Expected Answer:</span>
                    <span>{r.expected_answer}</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Explanation:</span>
                  {r.explanation}
                </div>

                {/* Action if wrong: Send to Misconception Lab */}
                {!r.is_correct && r.misconception_seed_data && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onOpenRecoveryForError(r.misconception_seed_data)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Diagnose in Misconception Lab
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setActiveResult(null);
                setUserAnswers({});
              }}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      )}

      {/* GENERATE ASSESSMENT MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Generate Adaptive Assessment
              </h3>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Topic</label>
                <select
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Loops & Iteration">Loops & Iteration</option>
                  <option value="Conditionals & Logic">Conditionals & Logic</option>
                  <option value="Arrays & Indexing">Arrays & Indexing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Questions</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={genNumQuestions}
                    onChange={(e) => setGenNumQuestions(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowGenModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {generating ? 'Generating Questions...' : 'Generate Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Viewer Modal */}
      <SourceViewerModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
};
