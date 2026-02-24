import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ApiNode } from '../types';
import { memo } from 'react';
import { motion } from 'framer-motion';

const palette = {
  input: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
  endpoint: 'border-violet-500/50 bg-violet-500/10 text-violet-200',
  output: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
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
      {data.method && data.path && <div className="text-[11px] opacity-80">{data.method} {data.path}</div>}
      {data.statusCode && <div className="text-[11px] mt-1">Status: {data.statusCode}</div>}
      <div className="mt-2 space-y-1">
        {data.schema.slice(0, 3).map((f) => <div key={f.id} className="truncate">{f.required ? '●' : '○'} {f.name}: {f.type}</div>)}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-slate-100" />
    </motion.div>
  );
}

export default memo(ApiNodeCard);
