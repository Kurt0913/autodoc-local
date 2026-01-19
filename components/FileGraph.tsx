"use client";

import { useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState,
  MarkerType, 
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FileNode } from '../lib/file-system';
import { FileCode, Folder, ChevronDown, FileJson, FileType, Code2 } from 'lucide-react';
import dagre from 'dagre'; 

// --- 1. Helper: Choose Icon based on extension ---
const getFileIcon = (name: string) => {
  if (name.endsWith('.json')) return <FileJson className="w-5 h-5 text-yellow-400" />;
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <Code2 className="w-5 h-5 text-blue-400" />;
  if (name.endsWith('.css')) return <FileType className="w-5 h-5 text-pink-400" />;
  return <FileCode className="w-5 h-5 text-emerald-400" />;
};

// --- 2. Custom Node Design with Tooltip & Glow ---
const FileNodeComponent = ({ data }: { data: { label: string, kind: string } }) => {
    const isDir = data.kind === 'directory';
    
    return (
    <div className={`group px-4 py-3 shadow-xl rounded-lg border min-w-[180px] flex items-center gap-3 transition-all duration-300 relative cursor-pointer
      /* Default State */
      ${isDir ? 'bg-slate-800/90 border-blue-500/50' : 'bg-slate-900/90 border-emerald-500/30'}
      backdrop-blur-md
      
      /* Hover State (Glow Effect) */
      hover:scale-105 
      hover:border-opacity-100
      hover:shadow-[0_0_30px_-5px_rgba(var(--glow-color),0.4)]
      hover:ring-1 hover:ring-white/20
      `}
      // Dynamic CSS variable for glow color
      style={{ '--glow-color': isDir ? '59, 130, 246' : '16, 185, 129' } as React.CSSProperties}
    >
      
      {/* TOOLTIP: Pops up on Hover */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl flex flex-col items-center">
        <span className="font-semibold text-white">{isDir ? 'Directory' : 'File'}</span>
        <span className="text-[10px] text-slate-400 opacity-80">{data.label}</span>
        
        {/* Tooltip Arrow */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45"></div>
      </div>

      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2 !border-none" />
      
      {/* Icon */}
      {isDir ? <Folder className="w-5 h-5 text-blue-400" /> : getFileIcon(data.label)}
      
      {/* Label */}
      <span className="text-slate-100 font-medium truncate flex-grow text-left text-sm">{data.label}</span>
      
      {isDir && <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />}

      {/* Output Handle */}
      {isDir && (
        <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2 !border-none" />
      )}
    </div>
  );
}

const nodeTypes = { custom: FileNodeComponent };

// --- 3. Layout Engine Setup ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 60 }); 

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

// --- 4. Main Component ---
export default function FileGraph({ 
  files, 
  onNodeClick 
}: { 
  files: FileNode[], 
  onNodeClick: (file: FileNode) => void 
}) {
  
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    if (!files || files.length === 0) return { layoutedNodes: [], layoutedEdges: [] };

    function traverse(items: FileNode[], parentId: string | null = null) {
      items.forEach((item) => {
        const id = item.path;
        
        rawNodes.push({
          id,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { label: item.name, kind: item.kind },
        });

        if (parentId) {
            rawEdges.push({
            id: `${parentId}-${id}`,
            source: parentId,
            target: id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#475569', strokeWidth: 1.5 }, // Lighter grey line
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#475569',
            },
          });
        }

        if (item.children) {
          traverse(item.children, id);
        }
      });
    }

    traverse(files);

    const layouted = getLayoutedElements(rawNodes, rawEdges);
    return { layoutedNodes: layouted.nodes, layoutedEdges: layouted.edges };
  }, [files]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Sync state when files change
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const findFile = (nodes: FileNode[]): FileNode | undefined => {
      for (const f of nodes) {
        if (f.path === node.id) return f;
        if (f.children) {
          const found = findFile(f.children);
          if (found) return found;
        }
      }
    };
    const file = findFile(files);
    if (file) onNodeClick(file);
  };

  return (
    <div className="w-full h-[700px] border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-2xl relative group">
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-slate-900/80 rounded-full text-xs text-slate-400 border border-slate-800 pointer-events-none backdrop-blur-sm">
        Scroll to Zoom • Drag to Move • Click Nodes
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        className="bg-slate-950"
      >
        <Background gap={24} size={1} color="#1e293b" />
        <Controls 
          className="bg-slate-800 border-slate-700 shadow-xl [&>button]:border-b-slate-700 [&>button]:fill-slate-300 [&>button:hover]:fill-white [&>button:hover]:bg-slate-700" 
        />
      </ReactFlow>
    </div>
  );
}