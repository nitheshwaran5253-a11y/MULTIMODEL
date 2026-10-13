import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitFork,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { ConceptGraph, ConceptGraphNode } from '../types';
import { Badge } from '../components/common/Badge';

// Custom Node Component color-coded by state
const ConceptNodeComponent = ({ data }: { data: any }) => {
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-emerald-500/10';
      case 'NEEDS_REVISION':
        return 'border-rose-500 bg-rose-50 text-rose-950 shadow-rose-500/20 ring-2 ring-rose-400';
      case 'LEARNING':
        return 'border-blue-500 bg-blue-50 text-blue-950 shadow-blue-500/10';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-2xl border-2 shadow-md w-56 text-left transition-all ${getStatusColors(
        data.status
      )}`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-400" />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 truncate">
          {data.difficulty}
        </span>
        <span className="text-xs font-black font-mono">{data.mastery_pct}%</span>
      </div>
      <div className="text-xs font-bold leading-snug line-clamp-2">{data.label}</div>
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="font-semibold">{data.status.replace('_', ' ')}</span>
        <span className="opacity-60">{data.attempts} attempts</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-400" />
    </div>
  );
};

export const LearningPathPage: React.FC<{ onOpenRecovery: () => void }> = ({ onOpenRecovery }) => {
  const [graphData, setGraphData] = useState<ConceptGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptGraphNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const nodeTypes = useMemo(() => ({ conceptNode: ConceptNodeComponent }), []);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getConceptGraph();
      setGraphData(data);
      if (data.nodes.length > 0) {
        // Default select the weak node for instant demonstrability
        const weak = data.nodes.find((n) => n.status === 'NEEDS_REVISION') || data.nodes[0];
        handleSelectNode(weak);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleSelectNode = async (node: ConceptGraphNode) => {
    setSelectedNode(node);
    try {
      const detail = await api.getConceptDetail(node.id);
      setNodeDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert graph data to React Flow nodes and edges
  const flowNodes: Node[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.map((n) => ({
      id: n.id,
      type: 'conceptNode',
      position: n.position,
      data: n as any
    }));
  }, [graphData]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.is_weak_prerequisite,
      style: {
        stroke: e.is_weak_prerequisite ? '#e11d48' : '#64748b',
        strokeWidth: e.is_weak_prerequisite ? 3 : 1.5
      }
    }));
  }, [graphData]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GitFork className="w-7 h-7 text-blue-600" />
            Prerequisite Learning Path
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Directed Acyclic Graph (DAG) of Java concepts. Red edges highlight suspected weak prerequisites.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Learning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Needs Revision
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Not Assessed
          </span>
        </div>
      </div>

      {/* Main Graph Area & Inspection Drawer */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden relative shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading concept graph...</div>
        ) : (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => handleSelectNode(node.data as any)}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        )}

        {/* Node Inspection Drawer */}
        {selectedNode && (
          <div className="absolute right-6 top-6 bottom-6 w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <Badge
                  variant={
                    selectedNode.status === 'MASTERED'
                      ? 'green'
                      : selectedNode.status === 'NEEDS_REVISION'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {selectedNode.status.replace('_', ' ')}
                </Badge>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Concept Node</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedNode.label}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Mastery Stats */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">BKT Mastery</span>
                  <span className="text-base font-black text-slate-900 mt-0.5">{selectedNode.mastery_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Attempts</span>
                  <span className="text-base font-black text-slate-900 mt-0.5">{selectedNode.attempts}</span>
                </div>
              </div>

              {/* Relevant Course Sources */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Grounding Study Materials
                </span>
                <div className="space-y-1.5">
                  {selectedNode.sources.map((src, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-200/60 truncate">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Prerequisites */}
              {nodeDetail?.prerequisites && nodeDetail.prerequisites.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Immediate Prerequisites
                  </span>
                  <div className="space-y-1">
                    {nodeDetail.prerequisites.map((p: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Foundational</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="pt-4 border-t border-slate-100">
              {selectedNode.status === 'NEEDS_REVISION' ? (
                <button
                  onClick={onOpenRecovery}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BrainCircuit className="w-4 h-4" /> Start Misconception Recovery
                </button>
              ) : (
                <button
                  onClick={onOpenRecovery}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Practice Topic Concepts
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
