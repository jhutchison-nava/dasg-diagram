// Thin re-export layer over the Velite-generated content. Consumers import
// from "@/lib/diagram" rather than reaching into "#site/content" directly,
// so we can reshape the storage format without rippling through the app.

import {
  nodes as veliteNodes,
  edges as veliteEdges,
  diagrams as veliteDiagrams,
  glossary as veliteGlossary,
  positions as velitePositions,
  type Node as VeliteNode,
  type EdgeDoc,
  type DiagramMeta,
  type GlossaryEntry,
} from "#site/content";

export type DiagramId = string;

export type DiagramNode = VeliteNode;
export type DiagramEdge = EdgeDoc["edges"][number];
export type NodeCategory = DiagramNode["category"];
export type EdgeKind = DiagramEdge["kind"];
export type { DiagramMeta, GlossaryEntry };

export const glossary: readonly GlossaryEntry[] = veliteGlossary;

export const diagrams: readonly DiagramMeta[] = veliteDiagrams;

function positionOverridesFor(
  diagramId: DiagramId,
): Record<string, { x: number; y: number }> {
  const doc = velitePositions.find((d) => d.diagram === diagramId);
  return doc?.positions ?? {};
}

/** All nodes for a given diagram, with positions.yaml overrides merged onto
 * each node's `position` field. */
export function nodesFor(diagramId: DiagramId): DiagramNode[] {
  const overrides = positionOverridesFor(diagramId);
  return veliteNodes
    .filter((n) => n.diagram === diagramId)
    .map((n) => {
      const override = overrides[n.id];
      return override ? { ...n, position: override } : n;
    });
}

/** All edges for a given diagram, in source order. */
export function edgesFor(diagramId: DiagramId): DiagramEdge[] {
  const doc = veliteEdges.find((d) => d.diagram === diagramId);
  return doc?.edges ?? [];
}

/** Default-export bundles for the V3 diagram (matches the prior diagram.ts API). */
export const nodes: DiagramNode[] = nodesFor("v3");
export const edges: DiagramEdge[] = edgesFor("v3");
