import { MarkerType } from '@xyflow/react';
import type { ApiEdge, ApiNode, ApiProject, SchemaField } from '../types';

const id = () => crypto.randomUUID();

export const commonStatuses = [200, 201, 400, 401, 403, 404, 409, 500];

export const makeField = (name: string, type: SchemaField['type'], required = true): SchemaField => ({
  id: id(),
  name,
  type,
  required,
});

const endpointId = id();
const outputId = id();
const inputId = id();

export const defaultProject = (): ApiProject => ({
  selectedNodeId: null,
  nodes: [
    {
      id: inputId,
      type: 'input',
      position: { x: 80, y: 220 },
      data: { title: 'Request Body', schema: [makeField('email', 'string')] },
    },
    {
      id: endpointId,
      type: 'endpoint',
      position: { x: 420, y: 200 },
      data: { title: 'Example Endpoint', method: 'POST', path: '/example', schema: [] },
    },
    {
      id: outputId,
      type: 'output',
      position: { x: 780, y: 200 },
      data: { title: 'Success Response', statusCode: 200, schema: [makeField('id', 'string'), makeField('createdAt', 'string')] },
    },
  ],
  edges: [
    {
      id: id(),
      source: inputId,
      target: endpointId,
      label: 'Input',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: 'Input' },
    },
    {
      id: id(),
      source: endpointId,
      target: outputId,
      label: 'Success 200',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: 'Success 200' },
    },
  ],
});

export const errorDefaultSchema = (): SchemaField[] => [
  makeField('errorCode', 'string'),
  makeField('message', 'string'),
  makeField('metadata', 'object', false),
];

export const saveProject = (project: ApiProject) => {
  localStorage.setItem('api-designer-project', JSON.stringify(project));
};

export const loadProject = (): ApiProject => {
  const raw = localStorage.getItem('api-designer-project');
  if (!raw) return defaultProject();
  try {
    return JSON.parse(raw) as ApiProject;
  } catch {
    return defaultProject();
  }
};

export const exportOpenApi = (nodes: ApiNode[]) => {
  const endpoint = nodes.find((n) => n.type === 'endpoint');
  if (!endpoint) return { openapi: '3.1.0', info: { title: 'API Designer', version: '1.0.0' }, paths: {} };

  const outputs = nodes.filter((n) => n.type === 'output' || n.type === 'error');
  const responses = Object.fromEntries(
    outputs.map((node) => [
      String(node.data.statusCode ?? 200),
      {
        description: node.data.title,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: Object.fromEntries(node.data.schema.map((f) => [f.name, { type: f.type }])),
              required: node.data.schema.filter((f) => f.required).map((f) => f.name),
            },
          },
        },
      },
    ]),
  );

  return {
    openapi: '3.1.0',
    info: { title: 'API Designer Export', version: '1.0.0' },
    paths: {
      [endpoint.data.path ?? '/example']: {
        [(endpoint.data.method ?? 'POST').toLowerCase()]: {
          summary: endpoint.data.title,
          responses,
        },
      },
    },
  };
};

export const download = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
