import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApiDesignerStore } from './store/useApiDesignerStore';
import ApiNodeCard from './components/ApiNodeCard';
import Inspector from './components/Inspector';
import Toolbar from './components/Toolbar';

function Canvas() {
  const flowRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const nodes = useApiDesignerStore((s) => s.nodes);
  const edges = useApiDesignerStore((s) => s.edges);
  const onConnect = useApiDesignerStore((s) => s.onConnect);
  const onNodesChange = useApiDesignerStore((s) => s.onNodesChange);
  const onEdgesChange = useApiDesignerStore((s) => s.onEdgesChange);
  const setSelectedNode = useApiDesignerStore((s) => s.setSelectedNode);
  const setSelectedEdge = useApiDesignerStore((s) => s.setSelectedEdge);
  const addNode = useApiDesignerStore((s) => s.addNode);
  const deleteSelected = useApiDesignerStore((s) => s.deleteSelected);
  const selectedNodeId = useApiDesignerStore((s) => s.selectedNodeId);
  const copySelectedNode = useApiDesignerStore((s) => s.copySelectedNode);
  const pasteCopiedNode = useApiDesignerStore((s) => s.pasteCopiedNode);
  const undo = useApiDesignerStore((s) => s.undo);
  const redo = useApiDesignerStore((s) => s.redo);

  const nodeTypes = useMemo(
    () => ({ input: ApiNodeCard, endpoint: ApiNodeCard, output: ApiNodeCard, error: ApiNodeCard }),
    [],
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      if (params.nodes[0]?.id) {
        setSelectedNode(params.nodes[0].id);
      } else if (params.edges[0]?.id) {
        setSelectedEdge(params.edges[0].id);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedEdge, setSelectedNode],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isEditableTarget =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        return;
      }
      if (isEditableTarget) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        if (selectedNodeId) {
          event.preventDefault();
          copySelectedNode();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteCopiedNode();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'n') addNode('endpoint');
      if (key === 'i') addNode('input');
      if (key === 'o') addNode('output');
      if (key === 'e') addNode('error');
      if (event.key === 'Delete') deleteSelected();
    },
    [addNode, copySelectedNode, deleteSelected, pasteCopiedNode, redo, selectedNodeId, undo],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const exportSvg = useCallback(() => {
    const container = flowRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const content = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Toolbar exportSvg={exportSvg} />
      <div className="relative flex min-h-0 flex-1">
        <div ref={flowRef} className="h-full flex-1 bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onSelectionChange={onSelectionChange}
            fitView
            minZoom={0.01}
            snapToGrid
            snapGrid={[20, 20]}
          >
            <MiniMap
              pannable
              zoomable
              nodeBorderRadius={8}
              nodeStrokeWidth={2}
              className="!border !border-slate-600 !bg-slate-900/90 !shadow-xl"
            />
            <Controls position="top-left" className="!bg-slate-900/90 !border !border-slate-700 !rounded-md !text-slate-200" />
            <Background gap={20} color="#1e293b" />
          </ReactFlow>
        </div>
        <Inspector />

        <div className="absolute left-3 top-3 flex items-start gap-3">
          <div className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-[11px] text-slate-200 shadow-lg">
            <div className="font-medium">Helper</div>
            <div>N / I / O / E: add nodes</div>
            <div>Delete: remove selected node/edge</div>
            <div>Ctrl/Cmd + C/V: copy & paste node</div>
            <div>Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z: undo / redo</div>
          </div>

          <button
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            onClick={() => fitView()}
          >
            Fit View
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <main className="h-screen bg-slate-950 text-slate-100">
        <Canvas />
      </main>
    </ReactFlowProvider>
  );
}
