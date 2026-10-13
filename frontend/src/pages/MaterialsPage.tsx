import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Upload,
  FileText,
  Presentation,
  Video,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { StudyMaterial, MaterialDetail, Citation } from '../types';
import { Badge } from '../components/common/Badge';
import { SourceViewerModal } from '../components/common/SourceViewerModal';

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [isDropOver, setIsDropOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await api.getMaterials(search, filterType);
      setMaterials(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search, filterType]);

  const handleFileUpload = async (file: File) => {
    const validExtensions = ['.pdf', '.pptx', '.ppt', '.txt', '.vtt', '.srt', '.transcript'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported file format. Please upload PDF, PowerPoint (.pptx), or Video transcript (.txt, .vtt, .srt).`);
      return;
    }

    setErrorMessage(null);
    setUploading(true);
    setUploadProgress(`Uploading ${file.name} (preserving source page/slide/timestamp structures)...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', 'Java Programming');

    try {
      await api.uploadMaterial(formData);
      setUploadProgress('Processing completed successfully!');
      setTimeout(() => setUploadProgress(null), 2000);
      fetchMaterials();
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}" and its extracted chunks?`)) return;
    try {
      await api.deleteMaterial(id);
      fetchMaterials();
      if (selectedMaterial?.material.id === id) {
        setSelectedMaterial(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleInspectMaterial = async (id: number) => {
    try {
      const detail = await api.getMaterialDetail(id);
      setSelectedMaterial(detail);
    } catch (err: any) {
      alert(`Could not load chunks: ${err.message}`);
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return <Badge variant="red"><FileText className="w-3 h-3 mr-1" /> PDF (Page-Preserved)</Badge>;
      case 'pptx':
        return <Badge variant="amber"><Presentation className="w-3 h-3 mr-1" /> PPTX (Slide-Indexed)</Badge>;
      case 'video_transcript':
        return <Badge variant="blue"><Video className="w-3 h-3 mr-1" /> Transcript (Timestamped)</Badge>;
      default:
        return <Badge variant="gray">{type}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderArchive className="w-7 h-7 text-blue-600" />
            Study Material Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Multimodal course ingestion preserving page numbers, slide indexes, and video timestamps for verifiable RAG grounding.
          </p>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.pptx,.ppt,.txt,.vtt,.srt"
            onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
            disabled={uploading}
          />
          <div className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Processing File...' : 'Upload Course Notes'}
          </div>
        </label>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropOver(true);
        }}
        onDragLeave={() => setIsDropOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          isDropOver
            ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
            : 'border-slate-300/80 bg-white hover:border-blue-400/60 hover:bg-slate-50/50'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Drag & Drop Study Documents</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload PDF textbooks (with page mapping), PowerPoint slide decks (with speaker notes), or video lecture transcripts (with timestamp metadata).
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF Pages
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Presentation className="w-3.5 h-3.5 text-amber-500" /> PPTX Slides
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-blue-500" /> Video Timestamps
            </span>
          </div>
        </div>
      </div>

      {uploadProgress && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium flex items-center gap-2 animate-pulse">
          <Clock className="w-4 h-4 animate-spin text-blue-600" />
          {uploadProgress}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search materials or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Textbooks</option>
            <option value="pptx">PowerPoint Decks</option>
            <option value="video_transcript">Lecture Transcripts</option>
          </select>
        </div>
      </div>

      {/* Material Grid Listing */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading study materials...</div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No study materials found</p>
          <p className="text-xs text-slate-400">Upload your Java lecture materials or reset demo data to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {getFormatBadge(mat.file_type)}
                  <Badge variant={mat.status === 'PROCESSED' ? 'green' : 'amber'}>
                    {mat.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{mat.title}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{mat.filename}</p>
                </div>

                {/* Topics Tag List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Extracted Topics ({mat.chunk_count} Chunks)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mat.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {(mat.file_size_bytes / 1024).toFixed(1)} KB
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInspectMaterial(mat.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="View extracted chunks and locations"
                  >
                    <Eye className="w-4 h-4" /> Inspect
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id, mat.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Chunks Inspector Drawer */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedMaterial.material.title}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedMaterial.chunks.length} Extracted & Vector-Indexed Chunks
                </p>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chunks List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedMaterial.chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-2 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {chunk.source_location}
                    </span>
                    <span className="text-slate-500 font-medium">{chunk.topic}</span>
                  </div>
                  <p className="text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                    {chunk.content}
                  </p>
                  <div className="text-right">
                    <button
                      onClick={() =>
                        setActiveCitation({
                          material_name: selectedMaterial.material.filename,
                          location: chunk.source_location,
                          page_number: chunk.page_number,
                          slide_number: chunk.slide_number,
                          timestamp_seconds: chunk.timestamp_seconds,
                          excerpt: chunk.content
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> View in Source Modal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Source Viewer Modal */}
      <SourceViewerModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
};
