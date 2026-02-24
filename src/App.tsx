import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
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
  const addNode = useApiDesignerStore((s) => s.addNode);
  const deleteSelected = useApiDesignerStore((s) => s.deleteSelected);
  const saveLocal = useApiDesignerStore((s) => s.saveLocal);

  const nodeTypes = useMemo(() => ({ input: ApiNodeCard, endpoint: ApiNodeCard, output: ApiNodeCard, error: ApiNodeCard }), []);

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNode(params.nodes[0]?.id ?? null);
  }, [setSelectedNode]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveLocal();
      return;
    }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    const key = event.key.toLowerCase();
    if (key === 'n') addNode('endpoint');
    if (key === 'i') addNode('input');
    if (key === 'o') addNode('output');
    if (key === 'e') addNode('error');
    if (event.key === 'Delete') deleteSelected();
  }, [addNode, deleteSelected, saveLocal]);

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
      <div className="flex min-h-0 flex-1">
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
            snapToGrid
            snapGrid={[20, 20]}
          >
            <MiniMap pannable zoomable className="!bg-slate-900" />
            <Controls />
            <Background gap={20} color="#1e293b" />
          </ReactFlow>
        </div>
        <Inspector />
      </div>
      <button className="absolute bottom-3 left-3 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300" onClick={() => fitView()}>Fit View</button>
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
