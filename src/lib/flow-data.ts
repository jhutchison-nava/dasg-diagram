import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

import {
  edges as sourceEdges,
  nodes as sourceNodes,
  type DiagramEdge,
  type DiagramNode,
  type EdgeKind,
} from "@/lib/diagram";

export type FlowNodeData = {
  label: string;
  acronym?: string;
  category: DiagramNode["category"];
  diagramNode: DiagramNode;
  /** True when this node is rendered as a container around child nodes. */
  isGroup?: boolean;
  /** True when the node has an explicit `position` from content frontmatter. */
  isPinned?: boolean;
};

export type FlowEdgeData = {
  diagramEdge: DiagramEdge;
};

/** CSS variable names defined in styles.css @theme for each edge kind. */
const EDGE_COLOR_VAR: Record<EdgeKind, string> = {
  default: "--color-edge-default",
  "claims-submission": "--color-edge-claims-submission",
  "system-of-record": "--color-edge-system-of-record",
  "warehouse-flow": "--color-edge-warehouse-flow",
  "warehouse-feed": "--color-edge-warehouse-feed",
  "source-of-truth": "--color-edge-source-of-truth",
  fhir: "--color-edge-fhir",
};

function edgeColor(kind: EdgeKind): string {
  return `var(${EDGE_COLOR_VAR[kind]})`;
}

/** All node dimensions are multiples of 16 to align with the canvas grid. */
const NODE_WIDTH = 208;
const NODE_HEIGHT = 64;

/** Layout box for a parent group (must fit its children + label). */
const GROUP_PADDING_X = 16;
const GROUP_PADDING_TOP = 64; // room for the parent's title row
const GROUP_PADDING_BOTTOM = 16;
const CHILD_WIDTH = 176;
const CHILD_HEIGHT = 64;
const CHILD_GAP = 16;

export function buildFlowGraph(): {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
} {
  const childrenByParent = new Map<string, DiagramNode[]>();
  for (const n of sourceNodes) {
    if (n.parent) {
      const arr = childrenByParent.get(n.parent) ?? [];
      arr.push(n);
      childrenByParent.set(n.parent, arr);
    }
  }

  const nodes: Node<FlowNodeData>[] = [];

  // Emit parents first so React Flow can resolve parentId references.
  for (const n of sourceNodes) {
    if (n.parent) continue;
    const children = childrenByParent.get(n.id);
    if (children && children.length > 0) {
      const width =
        GROUP_PADDING_X * 2 +
        children.length * CHILD_WIDTH +
        (children.length - 1) * CHILD_GAP;
      const height = GROUP_PADDING_TOP + CHILD_HEIGHT + GROUP_PADDING_BOTTOM;
      nodes.push({
        id: n.id,
        type: "category",
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          acronym: n.acronym,
          category: n.category,
          diagramNode: n,
          isGroup: true,
        },
        width,
        height,
      });
    } else {
      const pinned = n.position;
      nodes.push({
        id: n.id,
        type: "category",
        position: pinned ?? { x: 0, y: 0 },
        data: {
          label: n.label,
          acronym: n.acronym,
          category: n.category,
          diagramNode: n,
          isPinned: pinned ? true : undefined,
        },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  }

  // Emit children with relative positions inside their parent.
  for (const [parentId, children] of childrenByParent) {
    children.forEach((child, i) => {
      nodes.push({
        id: child.id,
        type: "category",
        parentId,
        extent: "parent",
        position: {
          x: GROUP_PADDING_X + i * (CHILD_WIDTH + CHILD_GAP),
          y: GROUP_PADDING_TOP,
        },
        data: {
          label: child.label,
          acronym: child.acronym,
          category: child.category,
          diagramNode: child,
        },
        width: CHILD_WIDTH,
        height: CHILD_HEIGHT,
      });
    });
  }

  const edges: Edge<FlowEdgeData>[] = sourceEdges.map((e) => {
    const color = edgeColor(e.kind);
    const arrow = {
      type: MarkerType.ArrowClosed,
      color,
      width: 16,
      height: 16,
    };
    return {
      id: e.id,
      type: "smoothstep",
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      animated: false,
      style: {
        stroke: color,
        strokeWidth: 1.6,
        strokeDasharray: e.kind === "warehouse-feed" ? "6 4" : undefined,
      },
      labelStyle: { fontSize: 11 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 3,
      labelBgStyle: { fill: "white", fillOpacity: 0.85 },
      markerEnd: arrow,
      markerStart: e.bidirectional ? arrow : undefined,
      data: { diagramEdge: e },
    };
  });

  return { nodes, edges };
}
