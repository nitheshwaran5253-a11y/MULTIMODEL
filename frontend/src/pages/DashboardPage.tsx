import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Compass,
  FileText,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from '../api/client';
import { DashboardSummary } from '../types';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenRecovery: (misconceptionId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenRecovery }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Synthesizing student learning state & mastery model...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm mb-4">
          {error || 'Unable to load dashboard data.'}
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-700/60 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" /> Track D: Adaptive Learning Model Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {data.student_name}!
          </h1>
          <p className="text-blue-100/90 text-sm leading-relaxed">
            MindMap AI analyzed your recent quiz attempt on <strong>Java Loops</strong>. We identified a potential conceptual gap in <em>Loop Boundary Invariants</em> and pre-computed an interactive recovery path.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenRecovery(data.recommended_activity.misconception_id)}
              className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4 text-blue-600" />
              Start My Learning Recovery
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('tutor')}
              className="px-4 py-2.5 bg-blue-700/60 hover:bg-blue-700 text-white font-medium text-sm rounded-xl border border-blue-400/20 transition cursor-pointer"
            >
              Ask AI Tutor
            </button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none hidden lg:block">
          <BrainCircuit className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Materials */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Materials</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{data.total_study_materials}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Multimodal</span> (PDF, PPTX, Video)
          </div>
        </div>

        {/* Concepts Mastered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mastered</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{data.concepts_mastered}</div>
          <div className="text-xs text-slate-500 mt-1">BKT P(L) ≥ 0.85</div>
        </div>

        {/* Needs Revision */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20 hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Needs Revision</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{data.concepts_needing_revision}</div>
          <div className="text-xs text-rose-600 font-semibold mt-1">Active Misconception</div>
        </div>

        {/* Learning Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Streak</span>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{data.streak_days} Days</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Active Learner</div>
        </div>

        {/* Recent Quiz Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Quiz</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{data.recent_quiz_score}%</div>
          <div className="text-xs text-slate-500 mt-1">Java Loops & Logic</div>
        </div>
      </div>

      {/* Recommended Next Action & Misconception Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Activity Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Highest-Priority Learning Gap</h3>
                  <p className="text-xs text-slate-500">Root-cause isolated via Diagnostic Engine</p>
                </div>
              </div>
              <Badge variant="red">{data.recommended_activity.priority} PRIORITY</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
              <h4 className="font-bold text-slate-900 text-sm mb-1">{data.recommended_activity.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data.recommended_activity.description}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Recovery Pipeline Outline:</h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium">1. Source Note</div>
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium">2. Worked Ex</div>
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium">3. Guided</div>
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium">4. Practice</div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold">5. Retest</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenRecovery(data.recommended_activity.misconception_id)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            Launch Misconception Lab
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recently Detected Misconceptions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Detected Misconceptions</h3>
              <button
                onClick={() => onNavigate('misconceptions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                View Lab
              </button>
            </div>

            <div className="space-y-3">
              {data.recent_misconceptions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onOpenRecovery(m.id)}
                  className="p-3 bg-slate-50 hover:bg-rose-50/40 rounded-xl border border-slate-200/80 hover:border-rose-200 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">{m.title}</span>
                    <Badge variant={m.status === 'RESOLVED' ? 'green' : 'red'}>
                      {m.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Target: {m.concept}</span>
                    <span className="font-medium text-slate-600">Confidence: {m.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Revision Tasks */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Upcoming Tasks
            </h4>
            <div className="space-y-2">
              {data.upcoming_tasks.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-700 truncate pr-2">• {task.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    task.status === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.due}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations: Weekly Performance Chart & Topic Mastery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Weekly Assessment Trajectory</h3>
              <p className="text-xs text-slate-500">Student quiz scores vs Mastery target threshold (75%)</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 bg-blue-600 rounded-sm"></span> Score %
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Progress Meter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Topic-Wise Bayesian Mastery</h3>
              <p className="text-xs text-slate-500">Derived from historical assessments & mistake frequency</p>
            </div>
            <button
              onClick={() => onNavigate('learning-path')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" /> Concept Map
            </button>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-64 pr-1">
            {data.topic_mastery.map((tm, idx) => {
              const barColor =
                tm.status === 'MASTERED'
                  ? 'bg-emerald-500'
                  : tm.status === 'NEEDS_REVISION'
                  ? 'bg-rose-500'
                  : 'bg-blue-500';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{tm.topic}</span>
                    <span className="font-mono text-slate-600 font-medium">{tm.mastery}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${tm.mastery}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
