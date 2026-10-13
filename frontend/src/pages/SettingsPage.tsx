import React, { useState, useEffect } from 'react';
import {
  Settings as LucideSettings,
  Key,
  Shield,
  RotateCcw,
  CheckCircle,
  Database,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { AppSettings } from '../types';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC<{ onSettingsChange: () => void }> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gemini-1.5-flash');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setDemoMode(data.demo_mode);
      setLlmModel(data.llm_model);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.updateSettings({
        demo_mode: demoMode,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        llm_model: llmModel
      });
      setSaveStatus('Settings updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
      fetchSettings();
      onSettingsChange();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo study materials, misconceptions, and student mastery to initial state?')) {
      return;
    }
    try {
      setResetting(true);
      const res = await api.resetDemoData();
      alert(res.message);
      onSettingsChange();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <LucideSettings className="w-7 h-7 text-blue-600" />
          Settings & AI Configuration
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure AI LLM model keys, toggle transparent demonstration mode, and manage database state.
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {saveStatus}
        </div>
      )}

      {/* Demo Mode Toggle Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Demonstration Mode</h3>
              <Badge variant={demoMode ? 'amber' : 'green'}>
                {demoMode ? 'Realistic Demo Mode Active' : 'Live LLM Active'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              When Demo Mode is enabled, the platform executes with realistic, pre-verified pedagogical responses without requiring external API keys. Every simulated response is clearly labeled to ensure full academic honesty.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* AI Credentials Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">AI Model & API Keys</h3>
          </div>
          <span className="text-[11px] text-slate-400">Environment keys automatically detected</span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Active LLM Model</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Fast Multimodal)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              {settings?.has_gemini_key && (
                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Key Detected
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder={settings?.has_gemini_key ? '••••••••••••••••••••••••' : 'Enter GEMINI_API_KEY...'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>OpenAI API Key (Optional)</span>
              {settings?.has_openai_key && (
                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Key Detected
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder={settings?.has_openai_key ? '••••••••••••••••••••••••' : 'Enter OPENAI_API_KEY...'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Database & System Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">Database & Storage Engine</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Database Connection</span>
            <div className="font-mono text-slate-800 font-bold">{settings?.database_url || 'mindmap.db'}</div>
            <p className="text-[11px] text-slate-500">SQLAlchemy ORM with zero-config portability</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Application Version</span>
            <div className="font-mono text-slate-800 font-bold">v{settings?.version || '1.0.0'}</div>
            <p className="text-[11px] text-slate-500">Multimodal AI Hackathon 2026</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Resetting demo data re-seeds sample Java notes, PDFs, slide decks, and misconception traces.
          </div>
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
