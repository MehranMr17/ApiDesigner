import { memo, useEffect, useRef, type ChangeEventHandler } from 'react';
import { commonStatuses, download, exportOpenApi, isApiProject } from '../lib/project';
import { buildShareLink, decodeSharedProject } from '../lib/share';
import { useApiDesignerStore } from '../store/useApiDesignerStore';

type Props = { exportSvg: () => void };

const encodeProjectToShareLink = () => {
  const state = useApiDesignerStore.getState();
  const project = JSON.stringify(selectProject(state));
  const encoded = btoa(encodeURIComponent(project));
  const url = new URL(window.location.href);
  url.searchParams.set('share', encoded);
  return url.toString();
};

const decodeSharedProject = (encoded: string) => {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(decoded);
    return isApiProject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

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

  useEffect(() => {
    const shareParam = new URL(window.location.href).searchParams.get('share');
    if (!shareParam) return;

    void (async () => {
      const sharedProject = await decodeSharedProject(shareParam);
      if (!sharedProject) {
        alert('Shared link is invalid or corrupted.');
        return;
      }
      importProject(sharedProject);
    })();
  }, [importProject]);

  const exportProject = () => {
    const state = useApiDesignerStore.getState();
    download('api-designer-project.json', JSON.stringify(state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0], null, 2), 'application/json');
  };

  const shareProject = async () => {
    const shareUrl = await buildShareLink();
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Compressed share link copied to clipboard.');
    } catch {
      prompt('Copy this share link:', shareUrl);
    }
  };

  const shareProject = async () => {
    const shareUrl = encodeProjectToShareLink();
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard.');
    } catch {
      prompt('Copy this share link:', shareUrl);
    }
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
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="mr-2 flex items-center gap-2 rounded-md border border-cyan-600/40 bg-slate-900/90 px-2 py-1">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 text-[11px] font-bold text-slate-950">M</div>
          <div>
            <div className="text-[11px] font-semibold text-cyan-300">MeRoS Api Desiner</div>
            <div className="text-[10px] text-slate-500">Visual API workflow designer</div>
          </div>
        </div>

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
        <button className="rounded bg-indigo-700 px-2 py-1" onClick={shareProject}>Share Link</button>
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
