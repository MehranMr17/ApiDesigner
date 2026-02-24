import type { Edge, Node } from '@xyflow/react';

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type SchemaField = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
};

export type ApiNodeType = 'input' | 'endpoint' | 'output' | 'error';

export type ApiNodeData = {
  title: string;
  method?: string;
  path?: string;
  statusCode?: number;
  schema: SchemaField[];
};

export type ApiNode = Node<ApiNodeData, ApiNodeType>;
export type ApiEdge = Edge<{ label: string }>;

export type ApiProject = {
  nodes: ApiNode[];
  edges: ApiEdge[];
  selectedNodeId: string | null;
};
