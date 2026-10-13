import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { ChatMessage, Citation } from '../types';
import { Badge } from '../components/common/Badge';
import { SourceViewerModal } from '../components/common/SourceViewerModal';

export const TutorPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [mode, setMode] = useState<'step_by_step' | 'simple' | 'examples'>('step_by_step');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [suggestedQuestions, setSuggestedQuestions] = useState<Array<{ category: string; question: string; source: string }>>([]);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initial fetch of conversation & suggested questions
    const initTutor = async () => {
      try {
        const convs = await api.getConversations();
        if (convs.length > 0) {
          setConversationId(convs[0].id);
          const history = await api.getMessages(convs[0].id);
          setMessages(history);
        }
        const suggestions = await api.getSuggestedQuestions();
        setSuggestedQuestions(suggestions);
      } catch (err) {
        console.error('Failed to init tutor:', err);
      }
    };
    initTutor();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const q = customPrompt || inputQuestion.trim();
    if (!q || loading) return;

    setInputQuestion('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      content: q,
      mode,
      citations: [],
      is_simulated: false,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.askTutor(q, mode, conversationId);
      setConversationId(res.conversation_id);

      const tutorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'tutor',
        content: res.answer,
        mode: res.mode as any,
        citations: res.citations,
        is_simulated: res.is_simulated,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      alert(`Tutoring error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header & Mode Switcher */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-600" />
            Source-Grounded AI Tutor
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Strict Retrieval-Augmented Generation (RAG) referencing your uploaded Java notes, slides, and transcripts.
          </p>
        </div>

        {/* Explanation Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setMode('simple')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'simple' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setMode('step_by_step')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'step_by_step' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Step-by-Step
          </button>
          <button
            onClick={() => setMode('examples')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'examples' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Examples & Questions
          </button>
        </div>
      </div>

      {/* Suggested Prompts Banner */}
      {messages.length === 0 && (
        <div className="my-6 p-5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Suggested Study Questions Grounded in Your Uploaded Materials
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {suggestedQuestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.question)}
                className="text-left p-3 bg-white rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-xs transition text-xs text-slate-800 space-y-1 cursor-pointer"
              >
                <div className="font-semibold line-clamp-1">{s.question}</div>
                <div className="text-[11px] text-blue-600 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Grounded in {s.source}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => {
          const isTutor = msg.sender === 'tutor';
          const isInsufficient = msg.content.includes("couldn't find enough information");

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isTutor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                  isTutor
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isTutor ? <Bot className="w-5 h-5" /> : <MessageSquare className="w-4 h-4" />}
              </div>

              {/* Message Body */}
              <div className="space-y-2.5">
                <div
                  className={`p-5 rounded-2xl text-sm leading-relaxed ${
                    isTutor
                      ? isInsufficient
                        ? 'bg-amber-50/80 border border-amber-200 text-amber-900'
                        : 'bg-white border border-slate-200 shadow-xs text-slate-800'
                      : 'bg-blue-600 text-white shadow-xs'
                  }`}
                >
                  {/* Tutor header metadata */}
                  {isTutor && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Grounded Tutor
                      </span>
                      {msg.is_simulated && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          Simulated Demo AI
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content}
                  </div>
                </div>

                {/* Grounding Citations beneath answer */}
                {isTutor && msg.citations && msg.citations.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Grounding Citations ({msg.citations.length} Verified Sources)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cite, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setActiveCitation(cite)}
                          className="text-left p-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-lg transition hover:shadow-xs cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-700 text-xs truncate max-w-[150px]">
                              {cite.material_name}
                            </span>
                            <Badge variant="blue" size="sm">
                              {cite.location}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-1 line-clamp-2">
                            "{cite.excerpt}"
                          </p>
                          <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 mt-1 group-hover:underline">
                            <ExternalLink className="w-3 h-3" /> View in Document
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs font-medium">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <span>Retrieving matching course chunks and verifying citations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-4 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Ask a question about your uploaded Java materials (e.g., 'Explain while loops from Page 1')..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={loading}
            className="w-full pl-5 pr-14 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || loading}
            className="absolute right-2.5 p-2.5 bg-blue-600 disabled:bg-slate-300 text-white rounded-xl transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>Responses strictly cite your uploaded documents. Outside knowledge is explicitly flagged.</span>
          <span className="font-medium text-slate-600">Mode: {mode.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Source Viewer Modal */}
      <SourceViewerModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
};
