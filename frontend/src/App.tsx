import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { TutorPage } from './pages/TutorPage';
import { MisconceptionLabPage } from './pages/MisconceptionLabPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';
import { UserProfile, AppSettings } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [recoveryMisconceptionId, setRecoveryMisconceptionId] = useState<number | undefined>(undefined);

  const fetchInitialState = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
    } catch (err) {
      console.warn('Using fallback user:', err);
      setUser({
        id: 1,
        name: 'Alex Johnson',
        email: 'alex.johnson@student.edu',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        streak_days: 5,
        created_at: new Date().toISOString()
      });
    }

    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (err) {
      console.warn('Using default settings:', err);
      setSettings({
        demo_mode: true,
        has_gemini_key: false,
        has_openai_key: false,
        llm_model: 'gemini-1.5-flash',
        database_url: 'mindmap.db',
        version: '1.0.0',
        is_live_ai_active: false
      });
    }
  };

  useEffect(() => {
    fetchInitialState();
  }, []);

  const handleStartRecovery = (misconceptionId?: number) => {
    setRecoveryMisconceptionId(misconceptionId || 1);
    setActiveTab('misconceptions');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={settings?.demo_mode ?? true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          user={user}
          onStartRecovery={() => handleStartRecovery()}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onOpenRecovery={handleStartRecovery}
            />
          )}

          {activeTab === 'materials' && <MaterialsPage />}

          {activeTab === 'tutor' && <TutorPage />}

          {activeTab === 'misconceptions' && (
            <MisconceptionLabPage
              initialMisconceptionId={recoveryMisconceptionId}
              onNavigateToPath={() => setActiveTab('learning-path')}
              onNavigateToAssessments={() => setActiveTab('assessments')}
            />
          )}

          {activeTab === 'assessments' && (
            <AssessmentsPage
              onOpenRecoveryForError={(seedData) => {
                setRecoveryMisconceptionId(1);
                setActiveTab('misconceptions');
              }}
            />
          )}

          {activeTab === 'learning-path' && (
            <LearningPathPage onOpenRecovery={() => handleStartRecovery()} />
          )}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'evaluation' && <EvaluationPage />}

          {activeTab === 'settings' && (
            <SettingsPage onSettingsChange={fetchInitialState} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
