import { defineConfig, s } from "velite";

const NodeCategory = s.enum([
  "system-of-record",
  "mpsm",
  "data-warehouse",
  "dasg-ecosystem",
  "source-of-truth",
  "health-entity",
  "component",
]);

const EdgeKind = s.enum([
  "default",
  "claims-submission",
  "system-of-record",
  "warehouse-flow",
  "warehouse-feed",
  "source-of-truth",
  "fhir",
]);

const diagramFromPath = (path: string): string => {
  const m = path.match(/diagrams[/\\]([^/\\]+)[/\\]/);
  return m?.[1] ?? "unknown";
};

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    nodes: {
      name: "Node",
      pattern: "diagrams/*/nodes/*.{md,mdx}",
      schema: s
        .object({
          id: s.string(),
          label: s.string(),
          acronym: s.string().optional(),
          category: NodeCategory,
          parent: s.string().optional(),
          owner: s.string().optional(),
          glossaryRef: s.string().optional(),
          note: s.string().optional(),
          // Region tag — drives layout placement. Nodes in the same region
          // are laid out together inside that region's bounding box.
          region: s.string().optional(),
          // Optional manual pin (overrides region layout for this node).
          position: s
            .object({ x: s.number(), y: s.number() })
            .optional(),
          // Body of the file is compiled to HTML and exposed as `description`.
          description: s.markdown(),
        })
        .transform((data, { meta }) => ({
          ...data,
          diagram: diagramFromPath(meta.path),
        })),
    },
    edges: {
      name: "EdgeDoc",
      pattern: "diagrams/*/edges.json",
      schema: s
        .object({
          edges: s.array(
            s.object({
              id: s.string(),
              source: s.string(),
              target: s.string(),
              // Optional handle ids ("top" | "right" | "bottom" | "left")
              // — preserves the visual side an edge attaches to. Omit to
              // let React Flow pick a default.
              sourceHandle: s.string().optional(),
              targetHandle: s.string().optional(),
              label: s.string().optional(),
              kind: EdgeKind,
              cadence: s.string().optional(),
              format: s.string().optional(),
              notes: s.string().optional(),
              // True for two-way data flows. Renders an arrowhead on both
              // ends instead of two separate edges.
              bidirectional: s.boolean().optional(),
            }),
          ),
        })
        .transform((data, { meta }) => ({
          ...data,
          diagram: diagramFromPath(meta.path),
        })),
    },
    diagrams: {
      name: "DiagramMeta",
      pattern: "diagrams/*/meta.json",
      schema: s.object({
        id: s.string(),
        title: s.string(),
        description: s.string().optional(),
      }),
    },
    glossary: {
      name: "GlossaryEntry",
      pattern: "glossary/glossary.json",
      schema: s.object({
        key: s.string(),
        term: s.string(),
        definition: s.string(),
      }),
    },
    positions: {
      name: "PositionOverrides",
      pattern: "diagrams/*/positions.json",
      schema: s
        .object({
          positions: s.record(
            s.string(),
            s.object({ x: s.number(), y: s.number() }),
          ),
        })
        .transform((data, { meta }) => ({
          ...data,
          diagram: diagramFromPath(meta.path),
        })),
    },
  },
});
