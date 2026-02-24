import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultProject, errorDefaultSchema, makeField } from '../lib/project';
import type { ApiEdge, ApiNode, ApiNodeType, ApiProject, SchemaField } from '../types';

const id = () => crypto.randomUUID();

const initial = defaultProject();

type State = {
  nodes: ApiNode[];
  edges: ApiEdge[];
  selectedNodeId: string | null;
  enabledStatuses: number[];
  setSelectedNode: (nodeId: string | null) => void;
  onNodesChange: (changes: NodeChange<ApiNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ApiEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  updateNode: (nodeId: string, patch: Partial<ApiNode['data']>) => void;
  addNode: (type: ApiNodeType) => void;
  deleteSelected: () => void;
  addField: (nodeId: string) => void;
  updateField: (nodeId: string, fieldId: string, patch: Partial<SchemaField>) => void;
  removeField: (nodeId: string, fieldId: string) => void;
  toggleStatus: (status: number) => void;
  autoLayout: () => void;
  importProject: (project: ApiProject) => void;
  resetDefault: () => void;
};

export const useApiDesignerStore = create<State>()(
  persist(
    (set, get) => ({
      nodes: initial.nodes,
      edges: initial.edges,
      selectedNodeId: null,
      enabledStatuses: [200, 201, 400, 401, 403, 404, 409, 500],
      setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
      onNodesChange: (changes) =>
        set((s) => ({
          nodes: applyNodeChanges(changes, s.nodes).map((n) => ({
            ...n,
            position: { x: Math.round(n.position.x / 20) * 20, y: Math.round(n.position.y / 20) * 20 },
          })),
        })),
      onEdgesChange: (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
      onConnect: (connection) =>
        set((s) => ({
          edges: addEdge({ ...connection, id: id(), data: { label: 'Flow' }, label: 'Flow', markerEnd: { type: MarkerType.ArrowClosed } }, s.edges) as ApiEdge[],
        })),
      updateNode: (nodeId, patch) =>
        set((s) => ({ nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)) })),
      addNode: (type) =>
        set((s) => {
          const nodeId = id();
          const endpoint = s.nodes.find((n) => n.type === 'endpoint');
          const base = {
            id: nodeId,
            type,
            position: { x: 420 + Math.random() * 150, y: 150 + Math.random() * 220 },
            data: {
              title: type === 'input' ? 'New Input' : type === 'output' ? 'New Output' : type === 'error' ? 'New Error' : 'New Endpoint',
              method: type === 'endpoint' ? 'POST' : undefined,
              path: type === 'endpoint' ? '/new-endpoint' : undefined,
              statusCode: type === 'output' ? 200 : type === 'error' ? 400 : undefined,
              schema: type === 'endpoint' ? [] : type === 'error' ? errorDefaultSchema() : [makeField('field', 'string')],
            },
          } as ApiNode;
          const edges = [...s.edges];
          if (endpoint && (type === 'input' || type === 'output' || type === 'error')) {
            edges.push({
              id: id(),
              source: type === 'input' ? nodeId : endpoint.id,
              target: type === 'input' ? endpoint.id : nodeId,
              label: type === 'output' ? 'Success 200' : type === 'error' ? 'Validation Error 400' : 'Input',
              data: { label: type === 'output' ? 'Success 200' : type === 'error' ? 'Validation Error 400' : 'Input' },
              markerEnd: { type: MarkerType.ArrowClosed },
            });
          }
          return { nodes: [...s.nodes, base], edges };
        }),
      deleteSelected: () =>
        set((s) => {
          if (!s.selectedNodeId) return s;
          return {
            nodes: s.nodes.filter((n) => n.id !== s.selectedNodeId),
            edges: s.edges.filter((e) => e.source !== s.selectedNodeId && e.target !== s.selectedNodeId),
            selectedNodeId: null,
          };
        }),
      addField: (nodeId) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, schema: [...n.data.schema, makeField('field', 'string', false)] } }
              : n,
          ),
        })),
      updateField: (nodeId, fieldId, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: { ...n.data, schema: n.data.schema.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) },
                }
              : n,
          ),
        })),
      removeField: (nodeId, fieldId) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, schema: n.data.schema.filter((f) => f.id !== fieldId) } } : n,
          ),
        })),
      toggleStatus: (status) =>
        set((s) => ({
          enabledStatuses: s.enabledStatuses.includes(status)
            ? s.enabledStatuses.filter((x) => x !== status)
            : [...s.enabledStatuses, status].sort((a, b) => a - b),
        })),
      autoLayout: () =>
        set((s) => ({
          nodes: s.nodes.map((n, i) => ({ ...n, position: { x: 120 + (i % 3) * 340, y: 100 + Math.floor(i / 3) * 220 } })),
        })),
      importProject: (project) => set({ nodes: project.nodes, edges: project.edges, selectedNodeId: null }),
      resetDefault: () => {
        const p = defaultProject();
        set({ nodes: p.nodes, edges: p.edges, selectedNodeId: null });
      },
    }),
    {
      name: 'api-designer-project',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        selectedNodeId: state.selectedNodeId,
        enabledStatuses: state.enabledStatuses,
      }),
    },
  ),
);

export const selectProject = (state: State): ApiProject => ({
  nodes: state.nodes,
  edges: state.edges,
  selectedNodeId: state.selectedNodeId,
});
