import React from 'react';
import { Flame, Bell, User, Search } from 'lucide-react';
import { UserProfile } from '../../types';

interface NavbarProps {
  user: UserProfile | null;
  onStartRecovery: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onStartRecovery }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search & Subject context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-lg border border-slate-200/80 text-xs font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Course: <strong className="text-slate-900">Java Programming (Control Flow & Loops)</strong></span>
        </div>
      </div>

      {/* Actions and Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <button
          onClick={onStartRecovery}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          1 Gap Identified
        </button>

        {/* Learning Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-xs font-semibold">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{user?.streak_days || 5} Day Streak</span>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            alt="Alex"
            className="w-8 h-8 rounded-full object-cover border border-slate-300"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || "Alex Johnson"}</div>
            <div className="text-[10px] text-slate-400">Student Learner</div>
          </div>
        </div>
      </div>
    </header>
  );
};
