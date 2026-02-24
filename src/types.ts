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

export type ApiEdgeData = {
  label: string;
  statusCode?: number;
};

export type ApiNode = Node<ApiNodeData, ApiNodeType>;
export type ApiEdge = Edge<ApiEdgeData>;

export type ApiProject = {
  nodes: ApiNode[];
  edges: ApiEdge[];
  selectedNodeId: string | null;
};

export type ProjectEntry = {
  id: string;
  name: string;
  nodes: ApiNode[];
  edges: ApiEdge[];
  updatedAt: number;
};
