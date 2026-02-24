import { Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useApiDesignerStore } from '../store/useApiDesignerStore';
import type { FieldType } from '../types';

const fieldTypes: FieldType[] = ['string', 'number', 'boolean', 'object', 'array'];

function Inspector() {
  const selectedNodeId = useApiDesignerStore((s) => s.selectedNodeId);
  const selectedEdgeId = useApiDesignerStore((s) => s.selectedEdgeId);
  const node = useApiDesignerStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));
  const edge = useApiDesignerStore((s) => s.edges.find((e) => e.id === s.selectedEdgeId));
  const updateNode = useApiDesignerStore((s) => s.updateNode);
  const updateEdge = useApiDesignerStore((s) => s.updateEdge);
  const addField = useApiDesignerStore((s) => s.addField);
  const updateField = useApiDesignerStore((s) => s.updateField);
  const removeField = useApiDesignerStore((s) => s.removeField);

  const onText = useCallback(
    (key: 'title' | 'method' | 'path', value: string) => {
      if (!selectedNodeId) return;
      updateNode(selectedNodeId, { [key]: value });
    },
    [selectedNodeId, updateNode],
  );

  if (edge) {
    const baseLabel = edge.data?.label ?? String(edge.label ?? 'Flow');
    const keyword = baseLabel.split(' ')[0] || 'Flow';

    return (
      <aside className="w-80 border-l border-slate-800 bg-slate-950/80 p-4 text-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-100">Connection Properties</h2>
        <label className="mb-2 block text-xs text-slate-400">Label</label>
        <input
          className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
          value={baseLabel}
          onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
        />
        <label className="mb-2 block text-xs text-slate-400">Status Code</label>
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
          type="number"
          value={edge.data?.statusCode ?? ''}
          onChange={(e) => {
            const statusCode = e.target.value ? Number(e.target.value) : undefined;
            updateEdge(edge.id, {
              statusCode,
              label: statusCode ? `${keyword} ${statusCode}` : baseLabel,
            });
          }}
        />
      </aside>
    );
  }

  if (!node) {
    return <aside className="w-80 border-l border-slate-800 p-4 text-sm text-slate-400">Select a node or connection to edit properties.</aside>;
  }

  const canEditSchema = node.type === 'output' || node.type === 'error' || node.type === 'input' || node.type === 'endpoint';

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

      {canEditSchema && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-slate-400">JSON Fields</h3>
            <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => addField(node.id)}>+ Field</button>
          </div>
          <div className="mt-2 flex max-h-[62vh] flex-col gap-2 overflow-auto pr-1">
            {node.data.schema.map((field) => (
              <div key={field.id} className="grid grid-cols-[1fr_88px_30px_34px] gap-1">
                <input className="rounded border border-slate-700 bg-slate-900 px-2 py-1" value={field.name} onChange={(e) => updateField(node.id, field.id, { name: e.target.value })} />
                <select className="rounded border border-slate-700 bg-slate-900 px-1 py-1" value={field.type} onChange={(e) => updateField(node.id, field.id, { type: e.target.value as FieldType })}>
                  {fieldTypes.map((f) => <option key={f}>{f}</option>)}
                </select>
                <input type="checkbox" checked={field.required} onChange={(e) => updateField(node.id, field.id, { required: e.target.checked })} />
                <button
                  className="flex items-center justify-center rounded bg-rose-900/70 text-rose-300 hover:bg-rose-800"
                  onClick={() => removeField(node.id, field.id)}
                  title="Delete field"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

export default memo(Inspector);
