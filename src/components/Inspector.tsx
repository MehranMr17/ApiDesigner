import { memo, useCallback } from 'react';
import { useApiDesignerStore } from '../store/useApiDesignerStore';
import type { FieldType } from '../types';

const fieldTypes: FieldType[] = ['string', 'number', 'boolean', 'object', 'array'];

function Inspector() {
  const selectedNodeId = useApiDesignerStore((s) => s.selectedNodeId);
  const node = useApiDesignerStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));
  const updateNode = useApiDesignerStore((s) => s.updateNode);
  const addField = useApiDesignerStore((s) => s.addField);
  const updateField = useApiDesignerStore((s) => s.updateField);
  const removeField = useApiDesignerStore((s) => s.removeField);

  const onText = useCallback((key: 'title' | 'method' | 'path', value: string) => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, { [key]: value });
  }, [selectedNodeId, updateNode]);

  if (!node) {
    return <aside className="w-80 border-l border-slate-800 p-4 text-slate-400 text-sm">Select a node to edit properties.</aside>;
  }

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950/80 p-4 text-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Properties</h2>
      <label className="mb-2 block text-xs text-slate-400">Title</label>
      <input className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" value={node.data.title} onChange={(e) => onText('title', e.target.value)} />
      {node.type === 'endpoint' && (
        <>
          <input className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" value={node.data.method ?? ''} onChange={(e) => onText('method', e.target.value)} />
          <input className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" value={node.data.path ?? ''} onChange={(e) => onText('path', e.target.value)} />
        </>
      )}
      {(node.type === 'output' || node.type === 'error') && (
        <input className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" type="number" value={node.data.statusCode ?? 200} onChange={(e) => updateNode(node.id, { statusCode: Number(e.target.value) })} />
      )}
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-slate-400">JSON Fields</h3>
        <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => addField(node.id)}>+ Field</button>
      </div>
      <div className="mt-2 space-y-2">
        {node.data.schema.map((field) => (
          <div key={field.id} className="grid grid-cols-[1fr_88px_30px_24px] gap-1">
            <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" value={field.name} onChange={(e) => updateField(node.id, field.id, { name: e.target.value })} />
            <select className="rounded border border-slate-700 bg-slate-900 px-1 py-1" value={field.type} onChange={(e) => updateField(node.id, field.id, { type: e.target.value as FieldType })}>
              {fieldTypes.map((f) => <option key={f}>{f}</option>)}
            </select>
            <input type="checkbox" checked={field.required} onChange={(e) => updateField(node.id, field.id, { required: e.target.checked })} />
            <button className="text-rose-400" onClick={() => removeField(node.id, field.id)}>×</button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default memo(Inspector);
