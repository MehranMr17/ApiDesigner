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
import type { ApiEdge, ApiNode, ApiNodeType, ApiProject, ProjectEntry, SchemaField } from '../types';

const id = () => crypto.randomUUID();

const initialProject = defaultProject();
const initialProjectEntry: ProjectEntry = {
  id: id(),
  name: 'Project 1',
  nodes: initialProject.nodes,
  edges: initialProject.edges,
  updatedAt: Date.now(),
};

type State = {
  nodes: ApiNode[];
  edges: ApiEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  enabledStatuses: number[];
  projects: ProjectEntry[];
  activeProjectId: string;
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedEdge: (edgeId: string | null) => void;
  onNodesChange: (changes: NodeChange<ApiNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ApiEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  updateNode: (nodeId: string, patch: Partial<ApiNode['data']>) => void;
  updateEdge: (edgeId: string, patch: Partial<ApiEdge>) => void;
  addNode: (type: ApiNodeType) => void;
  deleteSelected: () => void;
  addField: (nodeId: string) => void;
  updateField: (nodeId: string, fieldId: string, patch: Partial<SchemaField>) => void;
  removeField: (nodeId: string, fieldId: string) => void;
  toggleStatus: (status: number) => void;
  autoLayout: () => void;
  importProject: (project: ApiProject) => void;
  resetDefault: () => void;
  createProject: () => void;
  switchProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
};

const syncProjects = (state: State, nodes: ApiNode[], edges: ApiEdge[]): ProjectEntry[] =>
  state.projects.map((p) =>
    p.id === state.activeProjectId ? { ...p, nodes, edges, updatedAt: Date.now() } : p,
  );

export const useApiDesignerStore = create<State>()(
  persist(
    (set, get) => ({
      nodes: initialProjectEntry.nodes,
      edges: initialProjectEntry.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      enabledStatuses: [200, 201, 400, 401, 403, 404, 409, 500],
      projects: [initialProjectEntry],
      activeProjectId: initialProjectEntry.id,
      setSelectedNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null }),
      setSelectedEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: null }),
      onNodesChange: (changes) =>
        set((s) => {
          const nodes = applyNodeChanges(changes, s.nodes).map((n) => ({
            ...n,
            position: { x: Math.round(n.position.x / 20) * 20, y: Math.round(n.position.y / 20) * 20 },
          }));
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      onEdgesChange: (changes) =>
        set((s) => {
          const edges = applyEdgeChanges(changes, s.edges);
          return { edges, projects: syncProjects(s, s.nodes, edges) };
        }),
      onConnect: (connection) =>
        set((s) => {
          const edges = addEdge(
            {
              ...connection,
              id: id(),
              data: { label: 'Flow' },
              label: 'Flow',
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            s.edges,
          ) as ApiEdge[];
          return { edges, projects: syncProjects(s, s.nodes, edges) };
        }),
      updateNode: (nodeId, patch) =>
        set((s) => {
          const nodes = s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n));
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      updateEdge: (edgeId, patch) =>
        set((s) => {
          const edges = s.edges.map((e) =>
            e.id === edgeId
              ? {
                  ...e,
                  ...patch,
                  label: patch.label ?? e.label,
                  data: { ...e.data, ...patch.data },
                }
              : e,
          );
          return { edges, projects: syncProjects(s, s.nodes, edges) };
        }),
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
          let edges = [...s.edges];
          if (endpoint && (type === 'input' || type === 'output' || type === 'error')) {
            const statusCode = type === 'output' ? 200 : type === 'error' ? 400 : undefined;
            const label = type === 'output' ? 'Success 200' : type === 'error' ? 'Validation Error 400' : 'Input';
            edges.push({
              id: id(),
              source: type === 'input' ? nodeId : endpoint.id,
              target: type === 'input' ? endpoint.id : nodeId,
              label,
              data: { label, statusCode },
              markerEnd: { type: MarkerType.ArrowClosed },
            });
          }
          const nodes = [...s.nodes, base];
          return { nodes, edges, projects: syncProjects(s, nodes, edges) };
        }),
      deleteSelected: () =>
        set((s) => {
          if (s.selectedNodeId) {
            const nodes = s.nodes.filter((n) => n.id !== s.selectedNodeId);
            const edges = s.edges.filter((e) => e.source !== s.selectedNodeId && e.target !== s.selectedNodeId);
            return { nodes, edges, selectedNodeId: null, projects: syncProjects(s, nodes, edges) };
          }
          if (s.selectedEdgeId) {
            const edges = s.edges.filter((e) => e.id !== s.selectedEdgeId);
            return { edges, selectedEdgeId: null, projects: syncProjects(s, s.nodes, edges) };
          }
          return s;
        }),
      addField: (nodeId) =>
        set((s) => {
          const nodes = s.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, schema: [...n.data.schema, makeField('field', 'string', false)] } }
              : n,
          );
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      updateField: (nodeId, fieldId, patch) =>
        set((s) => {
          const nodes = s.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: { ...n.data, schema: n.data.schema.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) },
                }
              : n,
          );
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      removeField: (nodeId, fieldId) =>
        set((s) => {
          const nodes = s.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, schema: n.data.schema.filter((f) => f.id !== fieldId) } } : n,
          );
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      toggleStatus: (status) =>
        set((s) => ({
          enabledStatuses: s.enabledStatuses.includes(status)
            ? s.enabledStatuses.filter((x) => x !== status)
            : [...s.enabledStatuses, status].sort((a, b) => a - b),
        })),
      autoLayout: () =>
        set((s) => {
          const nodes = s.nodes.map((n, i) => ({ ...n, position: { x: 120 + (i % 3) * 340, y: 100 + Math.floor(i / 3) * 220 } }));
          return { nodes, projects: syncProjects(s, nodes, s.edges) };
        }),
      importProject: (project) =>
        set((s) => {
          const projects = s.projects.map((p) =>
            p.id === s.activeProjectId ? { ...p, nodes: project.nodes, edges: project.edges, updatedAt: Date.now() } : p,
          );
          return { nodes: project.nodes, edges: project.edges, selectedNodeId: null, selectedEdgeId: null, projects };
        }),
      resetDefault: () =>
        set((s) => {
          const p = defaultProject();
          const projects = s.projects.map((x) => (x.id === s.activeProjectId ? { ...x, nodes: p.nodes, edges: p.edges, updatedAt: Date.now() } : x));
          return { nodes: p.nodes, edges: p.edges, selectedNodeId: null, selectedEdgeId: null, projects };
        }),
      createProject: () =>
        set((s) => {
          const p = defaultProject();
          const entry: ProjectEntry = {
            id: id(),
            name: `Project ${s.projects.length + 1}`,
            nodes: p.nodes,
            edges: p.edges,
            updatedAt: Date.now(),
          };
          return {
            projects: [...s.projects, entry],
            activeProjectId: entry.id,
            nodes: entry.nodes,
            edges: entry.edges,
            selectedNodeId: null,
            selectedEdgeId: null,
          };
        }),
      switchProject: (projectId) =>
        set((s) => {
          const target = s.projects.find((p) => p.id === projectId);
          if (!target) return s;
          return {
            activeProjectId: projectId,
            nodes: target.nodes,
            edges: target.edges,
            selectedNodeId: null,
            selectedEdgeId: null,
          };
        }),
      renameProject: (projectId, name) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, name } : p)),
        })),
    }),
    {
      name: 'api-designer-project',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        selectedNodeId: state.selectedNodeId,
        selectedEdgeId: state.selectedEdgeId,
        enabledStatuses: state.enabledStatuses,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);

export const selectProject = (state: State): ApiProject => ({
  nodes: state.nodes,
  edges: state.edges,
  selectedNodeId: state.selectedNodeId,
});
