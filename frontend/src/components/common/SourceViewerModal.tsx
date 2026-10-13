import React from 'react';
import { X, BookOpen, FileText, Presentation, Video, ExternalLink, CheckCircle } from 'lucide-react';
import { Citation } from '../../types';
import { Badge } from './Badge';

interface SourceViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  const getSourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('.pdf')) return <FileText className="w-5 h-5 text-rose-600" />;
    if (lower.includes('.pptx') || lower.includes('.ppt')) return <Presentation className="w-5 h-5 text-amber-600" />;
    if (lower.includes('transcript') || lower.includes('.mp4')) return <Video className="w-5 h-5 text-indigo-600" />;
    return <BookOpen className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
              {getSourceIcon(citation.material_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-base">{citation.material_name}</h3>
                <Badge variant="blue">{citation.location}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Verified Ground Truth Source Material</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Location details card */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Source Document</span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">{citation.material_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Exact Location</span>
              <span className="font-semibold text-blue-700 block mt-0.5">{citation.location}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Verification Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> Source Grounded
              </span>
            </div>
          </div>

          {/* Highlighted Supporting Excerpt */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Supporting Excerpt from Material
            </h4>
            <div className="bg-blue-50/60 border-l-4 border-blue-600 p-4 rounded-r-xl">
              <p className="text-slate-800 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                "{citation.excerpt}"
              </p>
            </div>
          </div>

          {/* Grounding Explanation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-700">How MindMap AI utilizes this source:</p>
            <p>
              This text chunk was extracted directly from your course files using page-accurate document parsing. 
              The AI Tutor and Misconception Engine strictly constrain diagnostic reasoning to this verifiable excerpt to eliminate hallucinations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Multimodal Document Evidence Inspector
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            Close Source Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
