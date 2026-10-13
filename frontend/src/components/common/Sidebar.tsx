import React from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  GitFork,
  LineChart,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isDemoMode }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Study Materials', icon: FolderArchive },
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    {
      id: 'misconceptions',
      label: 'Misconception Lab',
      icon: BrainCircuit,
      badge: 'Core Feature',
      highlight: true
    },
    { id: 'assessments', label: 'Adaptive Assessments', icon: ClipboardCheck },
    { id: 'learning-path', label: 'Learning Path', icon: GitFork },
    { id: 'analytics', label: 'Progress Analytics', icon: LineChart },
    { id: 'evaluation', label: 'System Evaluation', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-base tracking-tight">MindMap</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Adaptive Tutor & Recovery</p>
          </div>
        </div>
      </div>

      {/* Mode Status Pill */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Mode:
          </span>
          {isDemoMode ? (
            <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              Realistic Demo
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live LLM
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              } ${item.highlight && !isActive ? 'border border-blue-200 bg-blue-50/50 text-blue-800' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Track info footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
        <div className="font-semibold text-slate-700">Multimodal AI 2026</div>
        <div className="text-[11px] text-slate-500 mt-0.5">Track D: Adaptive Learning</div>
      </div>
    </aside>
  );
};
