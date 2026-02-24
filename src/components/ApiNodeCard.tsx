import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ApiNode } from '../types';
import { memo } from 'react';
import { motion } from 'framer-motion';

const palette = {
  input: 'border-blue-500 bg-blue-950/90 text-blue-100',
  endpoint: 'border-violet-500 bg-violet-950/85 text-violet-100',
  output: 'border-emerald-500 bg-emerald-950/90 text-emerald-100',
  error: 'border-rose-500 bg-rose-950/90 text-rose-100',
};

function ApiNodeCard({ data, type, selected }: NodeProps<ApiNode>) {
  const t = (type ?? 'endpoint') as keyof typeof palette;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-64 rounded-xl border p-3 text-xs shadow-lg ${palette[t]} ${selected ? 'ring-2 ring-violet-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-slate-100" />
      <div className="font-semibold text-sm">{data.title}</div>
      {data.method && data.path && <div className="text-[11px] opacity-90">{data.method} {data.path}</div>}
      {data.statusCode && <div className="text-[11px] mt-1 opacity-90">Status: {data.statusCode}</div>}
      <div className="mt-2 space-y-1">
        {data.schema.slice(0, 3).map((f) => <div key={f.id} className="truncate">{f.required ? '●' : '○'} {f.name}: {f.type}</div>)}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-slate-100" />
    </motion.div>
  );
}

export default memo(ApiNodeCard);
