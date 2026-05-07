import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { CategoryNode } from "./CategoryNode";
import {
  buildFlowGraph,
  type FlowEdgeData,
  type FlowNodeData,
} from "@/lib/flow-data";
import { layoutGraph } from "@/lib/layout";
import type { DiagramEdge } from "@/lib/diagram";

const nodeTypes = { category: CategoryNode };

function useClipboardCopy() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy(text: string, fallbackLog: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      console.error(`${fallbackLog} (copy failed — paste manually):\n${text}`);
      setTimeout(() => setStatus("idle"), 2000);
    }
  }
  return { status, copy };
}

function CopyLayoutButton() {
  const { getNodes } = useReactFlow();
  const { status, copy } = useClipboardCopy();

  function handleClick() {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of getNodes()) {
      if (node.parentId) continue;
      positions[node.id] = {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      };
    }
    void copy(
      JSON.stringify({ positions }, null, 2) + "\n",
      "Layout JSON",
    );
  }

  const label =
    status === "copied"
      ? "Copied"
      : status === "error"
        ? "Copy failed (see console)"
        : "Copy layout";
  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute top-3 left-3 z-10 px-3 py-1 bg-panel-bg border border-border rounded-md text-[0.8rem] shadow-sm hover:bg-bg cursor-pointer"
      title="Copy current node positions as JSON — paste into content/diagrams/v3/positions.json"
    >
      {label}
    </button>
  );
}

function edgeToJson(
  edge: DiagramEdge,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  bidirectional: boolean,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
  if (sourceHandle) out.sourceHandle = sourceHandle;
  if (targetHandle) out.targetHandle = targetHandle;
  if (edge.label) out.label = edge.label;
  out.kind = edge.kind;
  if (edge.cadence) out.cadence = edge.cadence;
  if (edge.format) out.format = edge.format;
  if (edge.notes) out.notes = edge.notes;
  if (bidirectional) out.bidirectional = true;
  return out;
}

/**
 * Collapse mirror pairs (A→B and B→A with the same `kind`) into a single
 * bidirectional edge. The retained edge is whichever has the lexicographically
 * smaller id, so the dedupe is deterministic across runs.
 */
function dedupeBidirectional(
  edges: Edge<FlowEdgeData>[],
): Array<{ edge: Edge<FlowEdgeData>; bidirectional: boolean }> {
  const byPair = new Map<string, Edge<FlowEdgeData>[]>();
  for (const e of edges) {
    const kind = e.data?.diagramEdge?.kind ?? "default";
    const key = [e.source, e.target].sort().join("|") + "|" + kind;
    const arr = byPair.get(key) ?? [];
    arr.push(e);
    byPair.set(key, arr);
  }

  const out: Array<{ edge: Edge<FlowEdgeData>; bidirectional: boolean }> = [];
  const seen = new Set<string>();
  for (const e of edges) {
    if (seen.has(e.id)) continue;
    const kind = e.data?.diagramEdge?.kind ?? "default";
    const key = [e.source, e.target].sort().join("|") + "|" + kind;
    const group = byPair.get(key) ?? [];
    // A mirror pair is exactly two edges whose source/target are swapped.
    const mirror = group.find(
      (other) =>
        other.id !== e.id &&
        other.source === e.target &&
        other.target === e.source,
    );
    if (mirror) {
      const winner = e.id < mirror.id ? e : mirror;
      out.push({ edge: winner, bidirectional: true });
      seen.add(e.id);
      seen.add(mirror.id);
    } else {
      out.push({ edge: e, bidirectional: false });
      seen.add(e.id);
    }
  }
  return out;
}

function CopyEdgesButton() {
  const { getEdges } = useReactFlow();
  const { status, copy } = useClipboardCopy();

  function handleClick() {
    const all = getEdges() as Edge<FlowEdgeData>[];
    const collapsed = dedupeBidirectional(all);
    const edges: Record<string, unknown>[] = [];
    for (const { edge: e, bidirectional } of collapsed) {
      const diagramEdge = e.data?.diagramEdge;
      if (!diagramEdge) continue;
      edges.push(
        edgeToJson(
          diagramEdge,
          e.sourceHandle,
          e.targetHandle,
          bidirectional || diagramEdge.bidirectional === true,
        ),
      );
    }
    void copy(JSON.stringify({ edges }, null, 2) + "\n", "Edges JSON");
  }

  const label =
    status === "copied"
      ? "Copied"
      : status === "error"
        ? "Copy failed (see console)"
        : "Copy edges";
  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute top-3 left-32 z-10 px-3 py-1 bg-panel-bg border border-border rounded-md text-[0.8rem] shadow-sm hover:bg-bg cursor-pointer"
      title="Copy current edges as JSON — paste into content/diagrams/v3/edges.json"
    >
      {label}
    </button>
  );
}

function buildNewEdge(
  connection: Connection,
  existingIds: Set<string>,
): Edge<FlowEdgeData> {
  let id = `${connection.source}-${connection.target}`;
  if (existingIds.has(id)) {
    let n = 2;
    while (existingIds.has(`${id}-${n}`)) n++;
    id = `${id}-${n}`;
  }
  const diagramEdge: DiagramEdge = {
    id,
    source: connection.source,
    target: connection.target,
    kind: "default",
  };
  const color = "var(--color-edge-default)";
  return {
    id,
    type: "smoothstep",
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? undefined,
    targetHandle: connection.targetHandle ?? undefined,
    style: { stroke: color, strokeWidth: 1.6 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
      width: 16,
      height: 16,
    },
    data: { diagramEdge },
  };
}

function DiagramInner() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { nodeId?: string };
  const selectedId = params.nodeId;

  const initial = useMemo(() => {
    const graph = buildFlowGraph();
    const positioned = layoutGraph(graph.nodes, graph.edges, "LR");
    return { nodes: positioned, edges: graph.edges };
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Undo/redo: snapshot pre-mutation state on commit events (drag start,
  // connect, delete). The latest state lives in refs so handlers see it
  // without having to be in any specific render's closure.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  type Snapshot = {
    nodes: Node<FlowNodeData>[];
    edges: Edge<FlowEdgeData>[];
  };
  const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({
    past: [],
    future: [],
  });

  const commit = useCallback(() => {
    historyRef.current.past.push({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    });
    if (historyRef.current.past.length > 100) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.past.length === 0) return;
    const prev = h.past.pop() as Snapshot;
    h.future.unshift({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future.shift() as Snapshot;
    h.past.push({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [setNodes, setEdges]);

  // Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z (or Cmd+Y) to redo.
  // Skips when focus is in a text input so native text-undo still works.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Snapshot before applying removals (delete edge, delete node).
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<FlowNodeData>>[]) => {
      if (changes.some((c) => c.type === "remove")) commit();
      onNodesChange(changes);
    },
    [onNodesChange, commit],
  );
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge<FlowEdgeData>>[]) => {
      if (changes.some((c) => c.type === "remove")) commit();
      onEdgesChange(changes);
    },
    [onEdgesChange, commit],
  );

  // Keep edge styling in sync with the URL-selected node.
  useEffect(() => {
    setEdges((current) =>
      current.map((e) => {
        const isOnPath =
          !selectedId || e.source === selectedId || e.target === selectedId;
        return {
          ...e,
          style: {
            ...e.style,
            opacity: selectedId ? (isOnPath ? 1 : 0.15) : 1,
            strokeWidth: selectedId && isOnPath ? 2.4 : 1.6,
          },
        };
      }),
    );
  }, [selectedId, setEdges]);

  // Stamp `selected: true` on the URL-targeted node so CategoryNode
  // renders the focus ring without us round-tripping React Flow's
  // selection state on click.
  const renderNodes = useMemo(
    () =>
      selectedId
        ? nodes.map((n) =>
            n.id === selectedId ? { ...n, selected: true } : n,
          )
        : nodes,
    [nodes, selectedId],
  );

  function handleConnect(connection: Connection) {
    commit();
    setEdges((current) => {
      const ids = new Set(current.map((e) => e.id));
      return addEdge(buildNewEdge(connection, ids), current);
    });
  }

  return (
    <>
      <CopyLayoutButton />
      <CopyEdgesButton />
      <ReactFlow
        nodes={renderNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={() => commit()}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[8, 8]}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        onNodeClick={(_, node) => {
          navigate({ to: "/v3/node/$nodeId", params: { nodeId: node.id } });
        }}
        onPaneClick={() => {
          if (selectedId) navigate({ to: "/v3" });
        }}
      >
        <Background gap={8} size={1} color="#e5e7eb" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </>
  );
}

export function DiagramFlow() {
  return (
    <ReactFlowProvider>
      <DiagramInner />
    </ReactFlowProvider>
  );
}
