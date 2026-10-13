import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  GitFork,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  Zap,
  RotateCcw
} from 'lucide-react';
import { api } from '../api/client';
import {
  MisconceptionAnalysis,
  DiagnosticFollowupResult,
  RecoveryPlan,
  Citation
} from '../types';
import { Badge } from '../components/common/Badge';
import { SourceViewerModal } from '../components/common/SourceViewerModal';

interface MisconceptionLabPageProps {
  initialMisconceptionId?: number;
  onNavigateToPath?: () => void;
  onNavigateToAssessments?: () => void;
}

export const MisconceptionLabPage: React.FC<MisconceptionLabPageProps> = ({
  initialMisconceptionId,
  onNavigateToPath,
  onNavigateToAssessments
}) => {
  const [currentStep, setCurrentStep] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [analysis, setAnalysis] = useState<MisconceptionAnalysis | null>(null);
  const [followupResult, setFollowupResult] = useState<DiagnosticFollowupResult | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Diagnostic question option state
  const [selectedDiagnosticOption, setSelectedDiagnosticOption] = useState<number | null>(null);
  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);

  // Recovery interactive activity states
  const [guidedAnswer, setGuidedAnswer] = useState('');
  const [guidedFeedback, setGuidedFeedback] = useState<string | null>(null);
  const [guidedCorrect, setGuidedCorrect] = useState<boolean | null>(null);

  const [indepAnswer, setIndepAnswer] = useState('');
  const [indepFeedback, setIndepFeedback] = useState<string | null>(null);
  const [indepCorrect, setIndepCorrect] = useState<boolean | null>(null);

  const [masteryAnswer, setMasteryAnswer] = useState('');
  const [masteryFeedback, setMasteryFeedback] = useState<string | null>(null);
  const [masteryCorrect, setMasteryCorrect] = useState<boolean | null>(null);

  const [recoveryProgress, setRecoveryProgress] = useState(25);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load or generate error analysis for loop boundary misstep
      const res = await api.analyzeError(
        "How many times does this loop execute?\n\nint count = 0;\nfor (int i = 0; i <= 4; i++) {\n    count++;\n}",
        "4 times",
        "5 times",
        "Loops & Control Flow"
      );
      setAnalysis(res);

      if (res.recovery_plan_id) {
        const plan = await api.getRecoveryPlan(res.misconception_id);
        setRecoveryPlan(plan);
        setRecoveryProgress(plan.progress_percentage || 25);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [initialMisconceptionId]);

  const handleDiagnosticSubmit = async () => {
    if (selectedDiagnosticOption === null || !analysis) return;
    setSubmittingDiagnostic(true);
    try {
      const optText = analysis.diagnostic_question.options[selectedDiagnosticOption];
      const res = await api.submitDiagnosticFollowup(
        analysis.misconception_id,
        selectedDiagnosticOption,
        optText
      );
      setFollowupResult(res);
      // Advance to Step D
      setCurrentStep('D');
    } catch (err: any) {
      alert(`Follow-up submit failed: ${err.message}`);
    } finally {
      setSubmittingDiagnostic(false);
    }
  };

  const handleGuidedSubmit = async () => {
    if (!guidedAnswer.trim() || !recoveryPlan) return;
    try {
      const res = await api.submitRecoveryActivity(recoveryPlan.id, 'guided', guidedAnswer);
      setGuidedCorrect(res.is_correct);
      setGuidedFeedback(res.feedback);
      setRecoveryProgress(res.progress_percentage);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIndependentSubmit = async () => {
    if (!indepAnswer.trim() || !recoveryPlan) return;
    try {
      const res = await api.submitRecoveryActivity(recoveryPlan.id, 'independent', indepAnswer);
      setIndepCorrect(res.is_correct);
      setIndepFeedback(res.feedback);
      setRecoveryProgress(res.progress_percentage);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMasteryCheckSubmit = async () => {
    if (!masteryAnswer.trim() || !recoveryPlan) return;
    try {
      const res = await api.submitRecoveryActivity(recoveryPlan.id, 'mastery_check', masteryAnswer);
      setMasteryCorrect(res.is_correct);
      setMasteryFeedback(res.feedback);
      setRecoveryProgress(res.progress_percentage);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[60vh]">
        <BrainCircuit className="w-10 h-10 text-blue-600 animate-pulse mb-3" />
        <p className="text-sm font-semibold">Running multi-hypothesis misconception diagnostics...</p>
      </div>
    );
  }

  const stepsList = [
    { id: 'A', label: 'Step A: Identify Error', desc: 'Answer mismatch' },
    { id: 'B', label: 'Step B: Investigate', desc: 'Hypotheses' },
    { id: 'C', label: 'Step C: Diagnostic Question', desc: 'Discriminator' },
    { id: 'D', label: 'Step D: Prerequisite Trace', desc: 'Weak root' },
    { id: 'E', label: 'Step E: Recovery Plan', desc: 'Targeted practice' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Title & Signature Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-400/30 rounded-full text-xs font-bold text-rose-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Signature Feature • Track D
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Misconception Lab: "Why Am I Getting This Wrong?"
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Rather than simply revealing the correct answer, MindMap AI investigates <em>why</em> your mental model diverged, isolates the underlying prerequisite concept, and builds a verified recovery path.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center shrink-0">
          <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">Recovery Progress</div>
          <div className="text-2xl font-black text-white mt-0.5">{recoveryProgress}%</div>
          <div className="w-32 h-2 bg-white/20 rounded-full mt-2 overflow-hidden mx-auto">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${recoveryProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* 5-Step Process Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200">
        {stepsList.map((s) => {
          const isActive = currentStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id as any)}
              className={`p-3 rounded-xl text-left transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'hover:bg-slate-100/80 text-slate-600'
              }`}
            >
              <div className="text-xs font-bold truncate">{s.label}</div>
              <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP A: IDENTIFY THE INCORRECT ANSWER */}
      {currentStep === 'A' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Step A</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Identify The Question Discrepancy</h2>
            </div>
            <Badge variant="red">Answer Divergence Detected</Badge>
          </div>

          {/* Original Problem & Code */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Problem</h3>
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-sm leading-relaxed overflow-x-auto">
              <pre>{analysis.question_text}</pre>
            </div>
          </div>

          {/* Answers Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" /> Student Submitted Answer
              </div>
              <div className="text-xl font-black text-rose-900">{analysis.student_answer}</div>
              <p className="text-xs text-rose-700">
                Premature termination prior to evaluating inclusive upper bound.
              </p>
            </div>

            <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Expected Correct Answer
              </div>
              <div className="text-xl font-black text-emerald-900">{analysis.expected_answer}</div>
              <p className="text-xs text-emerald-700">
                5 iterations total for counter values i = 0, 1, 2, 3, 4.
              </p>
            </div>
          </div>

          {/* Error Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900">Diagnostic Summary:</span>
            <p>{analysis.error_summary}</p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep('B')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              Proceed to Step B: Investigate Misconception
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP B: INVESTIGATE THE MISCONCEPTION */}
      {currentStep === 'B' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step B</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Investigate Competing Misconception Hypotheses</h2>
            </div>
            <Badge variant="blue">Multi-Hypothesis Evaluation</Badge>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            MindMap AI evaluated multiple explanations for why you selected "{analysis.student_answer}". Not all incorrect answers stem from conceptual misunderstandings; we distinguish between conceptual errors, syntax slips, and arithmetic calculation errors.
          </p>

          {/* Hypotheses Cards Grid */}
          <div className="space-y-4">
            {analysis.hypotheses.map((hyp, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition ${
                    isPrimary
                      ? 'border-2 border-rose-400 bg-rose-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{hyp.title}</span>
                      <Badge variant={isPrimary ? 'red' : 'gray'}>{hyp.category}</Badge>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <span>Model Confidence:</span>
                      <span className="font-bold text-rose-700 font-mono">{(hyp.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {hyp.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs mb-3">
                    <div>
                      <span className="text-slate-400 font-medium block">Evidence Quote:</span>
                      <span className="font-semibold text-slate-800">{hyp.evidence_quote}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Related Prerequisite Concept:</span>
                      <span className="font-semibold text-blue-700">{hyp.related_concept}</span>
                    </div>
                  </div>

                  {hyp.citation && (
                    <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200/80 p-3 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-blue-900">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold">{hyp.citation.material_name} ({hyp.citation.location}):</span>
                        <span className="italic truncate max-w-md font-mono">"{hyp.citation.excerpt}"</span>
                      </div>
                      <button
                        onClick={() => setActiveCitation(hyp.citation!)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Source
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep('A')}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Back to Step A
            </button>
            <button
              onClick={() => setCurrentStep('C')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              Step C: Take Diagnostic Follow-up Question
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP C: DIAGNOSTIC FOLLOW-UP QUESTION */}
      {currentStep === 'C' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step C</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Interactive Diagnostic Discriminator</h2>
            </div>
            <Badge variant="blue">Isolates Competing Hypotheses</Badge>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            This short diagnostic probe isolates whether your error was caused by a fundamental misunderstanding of the inclusive boundary operator (<code>&lt;=</code>) or a calculation oversight.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" /> Diagnostic Question:
            </div>
            <div className="font-mono text-base font-bold text-slate-900">
              {analysis.diagnostic_question.question}
            </div>
            <div className="text-xs text-indigo-700 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
              <strong>Objective:</strong> {analysis.diagnostic_question.target_distinction}
            </div>

            {/* Selectable Options */}
            <div className="space-y-2.5 pt-2">
              {analysis.diagnostic_question.options.map((opt, idx) => {
                const isSelected = selectedDiagnosticOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDiagnosticOption(idx)}
                    className={`w-full p-4 rounded-xl text-left border text-sm transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 bg-white rounded-full"></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {followupResult && (
            <div
              className={`p-5 rounded-2xl border space-y-2 animate-in fade-in ${
                followupResult.more_evidence_needed
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>{followupResult.diagnosis_verdict}</span>
              </div>
              <p className="text-xs leading-relaxed">{followupResult.diagnosis_explanation}</p>
              <div className="text-xs font-semibold pt-1">
                Revised Diagnostic Confidence: <strong>{(followupResult.revised_confidence * 100).toFixed(0)}%</strong>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep('B')}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Back to Step B
            </button>
            <button
              onClick={handleDiagnosticSubmit}
              disabled={selectedDiagnosticOption === null || submittingDiagnostic}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {submittingDiagnostic ? 'Evaluating Verdict...' : 'Submit Diagnostic Answer'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP D: TRACE PREREQUISITE CONCEPTS */}
      {currentStep === 'D' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Step D</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Trace Prerequisite Concept Hierarchy</h2>
            </div>
            <button
              onClick={onNavigateToPath}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <GitFork className="w-3.5 h-3.5" /> Open Full Concept Graph
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            By analyzing the dependency graph of Java programming concepts, MindMap AI traces your struggle with <strong>Loop Execution</strong> back to its prerequisite foundation: <strong>Loop Termination & Boundary Invariants</strong>.
          </p>

          {/* Mini Concept Trace Representation */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Isolated Prerequisite Chain:
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Prereq 1: Comparison Operators (Mastered) */}
              <div className="w-full md:w-1/3 bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="green">Mastered (88%)</Badge>
                  <span className="text-[10px] text-slate-400">Foundational</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Relational Operators</h4>
                <p className="text-[11px] text-slate-500">Syntax and evaluation of &lt;, &lt;=, and == primitives.</p>
              </div>

              <ChevronRight className="w-6 h-6 text-slate-400 shrink-0 hidden md:block" />

              {/* Prereq 2: Loop Conditions (WEAK PREREQUISITE - RED) */}
              <div className="w-full md:w-1/3 bg-rose-50/50 p-4 rounded-xl border-2 border-rose-400 shadow-md space-y-1 relative">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="red">Needs Revision (38%)</Badge>
                  <span className="text-[10px] font-bold text-rose-700">WEAK NODE</span>
                </div>
                <h4 className="font-bold text-rose-950 text-sm">Loop Conditions & Boundaries</h4>
                <p className="text-[11px] text-rose-800">
                  Off-by-one boundary invariants. Terminating state when condition becomes false.
                </p>
                <div className="pt-1 text-[10px] font-mono text-rose-600">
                  Java_Control_Flow_Loops.pdf (Page 3)
                </div>
              </div>

              <ChevronRight className="w-6 h-6 text-slate-400 shrink-0 hidden md:block" />

              {/* Target Concept: Loop Execution */}
              <div className="w-full md:w-1/3 bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="amber">Impacted Target</Badge>
                  <span className="text-[10px] text-slate-400">Target Skill</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Loop Execution & Iterations</h4>
                <p className="text-[11px] text-slate-500">Predicting iteration counts and variable state mutation.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep('C')}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Back to Step C
            </button>
            <button
              onClick={() => setCurrentStep('E')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              Step E: Start Personalized Recovery Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP E: GENERATE PERSONALIZED RECOVERY PLAN */}
      {currentStep === 'E' && recoveryPlan && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step E</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">{recoveryPlan.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting Weak Prerequisite: <strong>{recoveryPlan.weak_concept_name}</strong>
              </p>
            </div>
            <Badge variant={recoveryPlan.status === 'COMPLETED' ? 'green' : 'amber'}>
              {recoveryPlan.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* 1. Source-Cited Concept Explanation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> 1. Source-Grounded Invariant Explanation
              </h3>
              {recoveryPlan.source_citation && (
                <button
                  onClick={() => setActiveCitation(recoveryPlan.source_citation!)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View in PDF (Page 3)
                </button>
              )}
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 p-5 rounded-2xl text-xs text-blue-950 font-sans leading-relaxed whitespace-pre-wrap">
              {recoveryPlan.explanation_text}
            </div>
          </div>

          {/* 2. Simple Worked Example */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> 2. Step-by-Step Worked Example: {recoveryPlan.worked_example.title}
            </h3>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs">
              <pre>{recoveryPlan.worked_example.code_or_problem}</pre>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Execution Trace:</span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {recoveryPlan.worked_example.step_by_step.map((st, sIdx) => (
                  <li key={sIdx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-xs font-bold text-blue-900 border-t border-slate-200">
                Key Invariant: {recoveryPlan.worked_example.key_takeaway}
              </div>
            </div>
          </div>

          {/* 3. Guided Practice Question */}
          <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Guided Practice Question
              </h3>
              {guidedCorrect === true && <Badge variant="green">Passed</Badge>}
            </div>

            <p className="text-sm font-semibold text-slate-900">{recoveryPlan.guided_practice.prompt}</p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter answer (e.g., '4 times')..."
                value={guidedAnswer}
                onChange={(e) => setGuidedAnswer(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleGuidedSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Check
              </button>
            </div>

            <p className="text-[11px] text-slate-400 italic">Hint: {recoveryPlan.guided_practice.hint}</p>

            {guidedFeedback && (
              <div className={`p-3 rounded-xl text-xs font-medium ${guidedCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                {guidedFeedback}
              </div>
            )}
          </div>

          {/* 4. Independent Practice Question */}
          <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Independent Practice Question
              </h3>
              {indepCorrect === true && <Badge variant="green">Passed</Badge>}
            </div>

            <p className="text-sm font-semibold text-slate-900">{recoveryPlan.independent_practice.prompt}</p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter printed value of x (e.g., '14')..."
                value={indepAnswer}
                onChange={(e) => setIndepAnswer(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleIndependentSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Check
              </button>
            </div>

            {indepFeedback && (
              <div className={`p-3 rounded-xl text-xs font-medium ${indepCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                {indepFeedback}
              </div>
            )}
          </div>

          {/* 5. Final Mastery Retest Check */}
          <div className="space-y-3 p-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">5. Mastery Verification Check (Updates BKT Profile)</h3>
              </div>
              {masteryCorrect === true && <Badge variant="green">Mastery Upgraded!</Badge>}
            </div>

            <p className="text-sm font-semibold text-slate-900">{recoveryPlan.mastery_check.prompt}</p>

            <div className="space-y-2">
              {recoveryPlan.mastery_check.options?.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setMasteryAnswer(opt)}
                  className={`w-full p-3 rounded-xl text-left border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                    masteryAnswer === opt
                      ? 'border-indigo-600 bg-indigo-100/60 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleMasteryCheckSubmit}
              disabled={!masteryAnswer}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Verify Mastery & Complete Recovery
            </button>

            {masteryFeedback && (
              <div className={`p-4 rounded-xl text-xs font-medium space-y-1 ${masteryCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                <div className="font-bold">{masteryFeedback}</div>
                {masteryCorrect && (
                  <p className="text-[11px] text-emerald-700">
                    Your Bayesian Knowledge Tracing (BKT) probability for <code>JAVA_LOOP_CONDITIONS</code> was updated from <strong>0.38</strong> to <strong>0.79</strong>!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep('D')}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Back to Prerequisite Trace
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToAssessments}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Retest Me on Adaptive Assessment
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
