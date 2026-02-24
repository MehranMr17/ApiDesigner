import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ApiNode } from '../types';
import { memo } from 'react';
import { motion } from 'framer-motion';

const palette = {
  input: {
    shell: 'border-blue-500 text-blue-100',
    handle: '!bg-blue-400 !border-blue-200',
  },
  endpoint: {
    shell: 'border-violet-500 text-violet-100',
    handle: '!bg-violet-400 !border-violet-200',
  },
  output: {
    shell: 'border-emerald-500 text-emerald-100',
    handle: '!bg-emerald-400 !border-emerald-200',
  },
  error: {
    shell: 'border-rose-500 text-rose-100',
    handle: '!bg-rose-400 !border-rose-200',
  },
};

function ApiNodeCard({ data, type, selected }: NodeProps<ApiNode>) {
  const t = (type ?? 'endpoint') as keyof typeof palette;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`min-w-[260px] max-w-[420px] rounded-xl border bg-slate-900/95 p-3 text-xs shadow-lg ${palette[t].shell} ${selected ? 'ring-2 ring-violet-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} className={`!h-3 !w-3 !border ${palette[t].handle}`} />
      <div className="font-semibold text-sm">{data.title}</div>
      {data.method && data.path && <div className="text-[11px] opacity-90">{data.method} {data.path}</div>}
      {data.statusCode && <div className="text-[11px] mt-1 opacity-90">Status: {data.statusCode}</div>}
      <div className="mt-2 space-y-1">
        {data.schema.map((f) => (
          <div key={f.id} className="whitespace-nowrap">{f.required ? '●' : '○'} {f.name}: {f.type}</div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className={`!h-3 !w-3 !border ${palette[t].handle}`} />
    </motion.div>
  );
}

export default memo(ApiNodeCard);
