import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

import { regions, type Region } from "@/lib/regions";

interface DiagramFields {
  region?: string;
  position?: { x: number; y: number };
}

const getDiagram = (n: Node): DiagramFields | undefined =>
  (n as unknown as { data?: { diagramNode?: DiagramFields } }).data
    ?.diagramNode;
const getParentId = (n: Node): string | undefined =>
  (n as unknown as { parentId?: string }).parentId;

/**
 * Region-aware layout. Each top-level node is bucketed by `region`; within a
 * region, dagre runs locally with that region's direction, then results are
 * translated to the region's bounding box. Cross-region edges don't influence
 * positioning — they're just drawn between whatever positions the regions
 * settle on. Nodes with an explicit `position:` override everything.
 *
 * Children of grouped parents (parentId set) keep the relative positions
 * assigned by buildFlowGraph().
 */
export function layoutGraph<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  _direction: "LR" | "TB" = "LR",
  nodeSize = { width: 208, height: 64 },
): N[] {
  const positions = new Map<string, { x: number; y: number }>();

  // Bucket nodes by region (skip child nodes — they're laid out by parent).
  const byRegion = new Map<string, N[]>();
  const unregioned: N[] = [];

  for (const node of nodes) {
    if (getParentId(node)) continue;
    const diagram = getDiagram(node);
    if (diagram?.position) {
      positions.set(node.id, diagram.position);
      continue;
    }
    const region = diagram?.region;
    if (region && regions[region]) {
      const bucket = byRegion.get(region) ?? [];
      bucket.push(node);
      byRegion.set(region, bucket);
    } else {
      unregioned.push(node);
    }
  }

  // Lay out each region locally, then translate into its bounding box.
  for (const [regionId, regionNodes] of byRegion) {
    const region = regions[regionId];
    const intraEdges = filterIntraRegion(edges, regionNodes);
    const localPos = layoutWithinBox(
      regionNodes,
      intraEdges,
      region,
      nodeSize,
    );
    for (const [id, pos] of localPos) positions.set(id, pos);
  }

  // Anything still unregioned (shouldn't happen for V3 today, but be safe):
  // run global dagre as a fallback.
  if (unregioned.length > 0) {
    const fallbackPos = runDagre(unregioned, edges, "LR", nodeSize, {
      nodesep: 50,
      ranksep: 70,
      marginx: 20,
      marginy: 20,
    });
    for (const [id, pos] of fallbackPos) {
      if (!positions.has(id)) positions.set(id, pos);
    }
  }

  return nodes.map((node) => {
    if (getParentId(node)) return node; // child of a group
    const pos = positions.get(node.id);
    return pos ? { ...node, position: pos } : node;
  });
}

function filterIntraRegion<N extends Node, E extends Edge>(
  edges: E[],
  regionNodes: N[],
): E[] {
  const ids = new Set(regionNodes.map((n) => n.id));
  return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

/**
 * Run dagre on `nodes` + `edges`, then translate the result so it sits
 * inside the region's bounding box (top-left aligned, with a small inset).
 */
function layoutWithinBox<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  region: Region,
  nodeSize: { width: number; height: number },
): Map<string, { x: number; y: number }> {
  const inset = 12;
  const raw = runDagre(nodes, edges, region.direction, nodeSize, {
    nodesep: 30,
    ranksep: 50,
    marginx: 0,
    marginy: 0,
  });

  // Compute bounding box of the raw layout so we can translate to the region.
  let minX = Infinity;
  let minY = Infinity;
  for (const { x, y } of raw.values()) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  if (!Number.isFinite(minX)) return raw;

  const translated = new Map<string, { x: number; y: number }>();
  for (const [id, { x, y }] of raw) {
    translated.set(id, {
      x: region.x + inset + (x - minX),
      y: region.y + inset + (y - minY),
    });
  }
  return translated;
}

function runDagre<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  direction: "LR" | "TB",
  nodeSize: { width: number; height: number },
  opts: { nodesep: number; ranksep: number; marginx: number; marginy: number },
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ...opts });

  const ids = new Set<string>();
  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.width ?? nodeSize.width,
      height: node.height ?? nodeSize.height,
    });
    ids.add(node.id);
  }
  for (const edge of edges) {
    if (ids.has(edge.source) && ids.has(edge.target)) {
      g.setEdge(edge.source, edge.target, {}, edge.id);
    }
  }
  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const laid = g.node(node.id);
    if (!laid) continue;
    positions.set(node.id, {
      x: laid.x - (node.width ?? nodeSize.width) / 2,
      y: laid.y - (node.height ?? nodeSize.height) / 2,
    });
  }
  return positions;
}
