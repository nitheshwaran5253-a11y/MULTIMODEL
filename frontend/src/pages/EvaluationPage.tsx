import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  FileCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { EvaluationBenchmark } from '../types';
import { Badge } from '../components/common/Badge';

export const EvaluationPage: React.FC = () => {
  const [benchmark, setBenchmark] = useState<EvaluationBenchmark | null>(null);
  const [running, setRunning] = useState(false);

  const runEvaluation = async () => {
    try {
      setRunning(true);
      const res = await api.runSystemEvaluation();
      setBenchmark(res);
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            System Evaluation & Benchmark Harness
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Empirical RAGAS/pedagogical evaluation harness measuring Faithfulness, Context Precision, Citation Accuracy, and Intervention Mastery Delta.
          </p>
        </div>

        <button
          onClick={runEvaluation}
          disabled={running}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          {running ? 'Executing Benchmark Suite...' : 'Run Benchmark Evaluation'}
        </button>
      </div>

      {running && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl text-center space-y-2 animate-pulse">
          <Activity className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <h3 className="font-bold text-blue-900 text-sm">Executing Empirical Evaluation Queries...</h3>
          <p className="text-xs text-blue-700">
            Evaluating multi-chunk synthesis, insufficient evidence handling, and citation fidelity against active course chunks.
          </p>
        </div>
      )}

      {benchmark && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faithfulness</span>
              <div className="text-3xl font-black text-emerald-700 mt-2">
                {benchmark.summary_metrics.faithfulness}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Absence of hallucinations outside context</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citation Correctness</span>
              <div className="text-3xl font-black text-blue-700 mt-2">
                {benchmark.summary_metrics.citation_correctness}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Exact match to verified source files & pages</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Context Precision</span>
              <div className="text-3xl font-black text-indigo-700 mt-2">
                {benchmark.summary_metrics.context_precision}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Relevant chunks in top-k retrieval</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mastery Intervention Gain</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                +{benchmark.summary_metrics.pre_post_mastery_delta}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Pre- vs Post-Misconception Lab score delta</div>
            </div>
          </div>

          {/* Additional Empirical Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Question Repetition Rate</span>
              <div className="text-xl font-bold text-slate-900">{benchmark.summary_metrics.question_repetition_rate}%</div>
              <p className="text-[11px] text-slate-500">Zero duplicates across sessions via question hash tracking.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Key Validation Accuracy</span>
              <div className="text-xl font-bold text-slate-900">{benchmark.summary_metrics.question_correctness}%</div>
              <p className="text-[11px] text-slate-500">All generated answer keys independently verified against source notes.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Benchmark Suite Pass Rate</span>
              <div className="text-xl font-bold text-slate-900">
                {benchmark.summary_metrics.tests_passed} / {benchmark.summary_metrics.total_benchmark_tests} Passed
              </div>
              <p className="text-[11px] text-slate-500">Empirical test set validating positive and negative queries.</p>
            </div>
          </div>

          {/* Test Set Execution Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Benchmark Test Queries Execution Log</h3>
              <Badge variant="blue">{benchmark.evaluation_engine_version}</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 font-bold">Test ID</th>
                    <th className="py-3 px-3 font-bold">Query</th>
                    <th className="py-3 px-3 font-bold">Test Category</th>
                    <th className="py-3 px-3 font-bold">Faithfulness</th>
                    <th className="py-3 px-3 font-bold">Precision</th>
                    <th className="py-3 px-3 font-bold">Citation Match</th>
                    <th className="py-3 px-3 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmark.test_cases.map((tc) => (
                    <tr key={tc.test_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">{tc.test_id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">{tc.query}</td>
                      <td className="py-3 px-3 text-slate-500 capitalize">{tc.type.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-3 font-mono">{(tc.faithfulness * 100).toFixed(0)}%</td>
                      <td className="py-3 px-3 font-mono">{(tc.precision * 100).toFixed(0)}%</td>
                      <td className="py-3 px-3 font-mono">{(tc.citation_correctness * 100).toFixed(0)}%</td>
                      <td className="py-3 px-3">
                        <Badge variant={tc.passed ? 'green' : 'amber'}>
                          {tc.passed ? 'PASSED' : 'REVIEW'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
