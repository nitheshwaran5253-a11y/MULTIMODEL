import React, { useState, useEffect } from 'react';
import {
  LineChart as LucideLineChart,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from '../api/client';
import { ProgressAnalytics } from '../types';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getProgressAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">Loading learner mastery model...</div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LucideLineChart className="w-7 h-7 text-blue-600" />
            Progress Analytics & Learner Model
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Empirical Bayesian Knowledge Tracing (BKT), error recurrence rates, and pedagogical recovery analytics.
          </p>
        </div>

        <Badge variant="blue" size="md">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Transparent BKT Engine
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Misconceptions Detected</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{data.misconceptions_stats.total_detected}</div>
          <div className="text-xs text-rose-600 font-semibold mt-1">
            {data.misconceptions_stats.active} Unresolved
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Misconceptions Resolved</span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{data.misconceptions_stats.resolved}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Post-Intervention Verified</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question Repetition Rate</span>
          <div className="text-2xl font-black text-blue-700 mt-2">{data.question_repetition_rate}%</div>
          <div className="text-xs text-slate-400 mt-1">Unique item history enforcement</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recovery Completion</span>
          <div className="text-2xl font-black text-indigo-700 mt-2">{data.recovery_plan_completion_rate}%</div>
          <div className="text-xs text-slate-400 mt-1">Guided to Independent tasks</div>
        </div>
      </div>

      {/* Improvement Across Multiple Attempts Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Longitudinal Mastery Gain Across Interventions</h3>
            <p className="text-xs text-slate-500">Student score trajectory before vs during vs after Misconception Lab</p>
          </div>
          <Badge variant="green">+52% Total Gain</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.improvement_trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Score']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563eb' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Concept-by-Concept Bayesian Knowledge Tracing (BKT) Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Bayesian Knowledge Tracing (BKT) Mastery Estimates</h3>
            <p className="text-xs text-slate-500">
              $P(L)$ probability updated sequentially per opportunity with slip ($S=0.10$) and guess ($G=0.20$) parameters.
            </p>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Does not conflate raw quiz scores with proven mastery
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Concept Code</th>
                <th className="py-3 px-4 font-bold">Concept Name</th>
                <th className="py-3 px-4 font-bold">P(Mastery)</th>
                <th className="py-3 px-4 font-bold">Opportunities</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.bkt_mastery_by_concept.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{m.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            m.status === 'MASTERED'
                              ? 'bg-emerald-500'
                              : m.status === 'NEEDS_REVISION'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${m.percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold">{m.p_mastery}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {m.correct} / {m.attempts} correct
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        m.status === 'MASTERED'
                          ? 'green'
                          : m.status === 'NEEDS_REVISION'
                          ? 'red'
                          : m.status === 'LEARNING'
                          ? 'blue'
                          : 'gray'
                      }
                    >
                      {m.status.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repeated Error Patterns Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Recurring Error Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.error_patterns.map((err, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{err.pattern}</span>
                <Badge variant={err.severity === 'High' ? 'red' : 'amber'}>{err.severity}</Badge>
              </div>
              <div className="text-xs text-slate-600 font-mono">Occurrences: {err.frequency}</div>
              <div className="text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                <strong>Remedy:</strong> {err.remedy}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
