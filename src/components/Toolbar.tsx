import { memo } from 'react';
import { commonStatuses, download, exportOpenApi } from '../lib/project';
import { useApiDesignerStore } from '../store/useApiDesignerStore';

type Props = { exportSvg: () => void };

function Toolbar({ exportSvg }: Props) {
  const addNode = useApiDesignerStore((s) => s.addNode);
  const autoLayout = useApiDesignerStore((s) => s.autoLayout);
  const saveLocal = useApiDesignerStore((s) => s.saveLocal);
  const toggleStatus = useApiDesignerStore((s) => s.toggleStatus);
  const enabledStatuses = useApiDesignerStore((s) => s.enabledStatuses);
  const nodes = useApiDesignerStore((s) => s.nodes);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-300">
      <div className="mb-2 flex flex-wrap gap-2">
        <button className="rounded bg-violet-600 px-2 py-1" onClick={() => addNode('endpoint')}>+ Endpoint (N)</button>
        <button className="rounded bg-blue-600 px-2 py-1" onClick={() => addNode('input')}>+ Input (I)</button>
        <button className="rounded bg-emerald-600 px-2 py-1" onClick={() => addNode('output')}>+ Output (O)</button>
        <button className="rounded bg-rose-600 px-2 py-1" onClick={() => addNode('error')}>+ Error (E)</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={autoLayout}>Auto Layout</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={saveLocal}>Save (Ctrl+S)</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={() => download('openapi.json', JSON.stringify(exportOpenApi(nodes), null, 2), 'application/json')}>Export OpenAPI</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={exportSvg}>Export SVG</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400">Suggested HTTP:</span>
        {commonStatuses.map((status) => (
          <button key={status} className={`rounded px-2 py-0.5 ${enabledStatuses.includes(status) ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500'}`} onClick={() => toggleStatus(status)}>{status}</button>
        ))}
      </div>
    </header>
  );
}

export default memo(Toolbar);
