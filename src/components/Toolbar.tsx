import { memo, useRef, type ChangeEventHandler } from 'react';
import { commonStatuses, download, exportOpenApi, isApiProject } from '../lib/project';
import { selectProject, useApiDesignerStore } from '../store/useApiDesignerStore';

type Props = { exportSvg: () => void };

function Toolbar({ exportSvg }: Props) {
  const addNode = useApiDesignerStore((s) => s.addNode);
  const autoLayout = useApiDesignerStore((s) => s.autoLayout);
  const toggleStatus = useApiDesignerStore((s) => s.toggleStatus);
  const enabledStatuses = useApiDesignerStore((s) => s.enabledStatuses);
  const nodes = useApiDesignerStore((s) => s.nodes);
  const importProject = useApiDesignerStore((s) => s.importProject);
  const resetDefault = useApiDesignerStore((s) => s.resetDefault);
  const projects = useApiDesignerStore((s) => s.projects);
  const activeProjectId = useApiDesignerStore((s) => s.activeProjectId);
  const switchProject = useApiDesignerStore((s) => s.switchProject);
  const createProject = useApiDesignerStore((s) => s.createProject);
  const renameProject = useApiDesignerStore((s) => s.renameProject);

  const fileRef = useRef<HTMLInputElement>(null);

  const exportProject = () => {
    const state = useApiDesignerStore.getState();
    download('api-designer-project.json', JSON.stringify(selectProject(state), null, 2), 'application/json');
  };

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (!isApiProject(json)) throw new Error('Invalid format');
      importProject(json);
    } catch {
      alert('Invalid project JSON file.');
    }
    event.target.value = '';
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-300">
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
      <div className="mb-2 flex flex-wrap gap-2">
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          value={activeProjectId}
          onChange={(e) => switchProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={createProject}>+ Project</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={() => {
          const current = projects.find((p) => p.id === activeProjectId);
          const name = prompt('Project name', current?.name ?? 'Project');
          if (name) renameProject(activeProjectId, name.trim());
        }}>Rename</button>

        <button className="rounded bg-violet-600 px-2 py-1" onClick={() => addNode('endpoint')}>+ Endpoint (N)</button>
        <button className="rounded bg-blue-700 px-2 py-1 text-blue-100" onClick={() => addNode('input')}>+ Input (I)</button>
        <button className="rounded bg-emerald-700 px-2 py-1 text-emerald-100" onClick={() => addNode('output')}>+ Output (O)</button>
        <button className="rounded bg-rose-700 px-2 py-1 text-rose-100" onClick={() => addNode('error')}>+ Error (E)</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={autoLayout}>Auto Layout</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={() => download('openapi.json', JSON.stringify(exportOpenApi(nodes), null, 2), 'application/json')}>Export OpenAPI</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={exportProject}>Export Project</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={() => fileRef.current?.click()}>Import Project</button>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={exportSvg}>Export SVG</button>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={resetDefault}>Reset Default</button>
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
