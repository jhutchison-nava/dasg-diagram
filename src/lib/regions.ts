// Regions for the V3 diagram. Each region has a bounding box on the canvas
// and an intra-region layout direction. Nodes tagged with a region are laid
// out inside that region's bounding box; cross-region edges are drawn between
// nodes wherever they end up.
//
// Bounding boxes are tuned to mirror the spatial layout of v1v2.png as a
// reference: consumers top-center, BFD left-center, APIs center, claims
// pipeline middle-right, warehouses right edge.
//
// Coordinates are in React Flow space. Origin is top-left, x grows right,
// y grows down.

export interface Region {
  id: string;
  label: string;
  /** Top-left corner in React Flow coordinates. */
  x: number;
  y: number;
  /** Bounding box. Intra-region layout fits within this. */
  width: number;
  height: number;
  /** Intra-region dagre direction. */
  direction: "LR" | "TB";
}

export const regions: Record<string, Region> = {
  "beneficiaries-row": {
    id: "beneficiaries-row",
    label: "Beneficiaries",
    x: 60,
    y: 40,
    width: 380,
    height: 120,
    direction: "LR",
  },
  consumers: {
    id: "consumers",
    label: "Consumers / Health entities",
    x: 500,
    y: 40,
    width: 720,
    height: 110,
    direction: "LR",
  },
  apis: {
    id: "apis",
    label: "DASG APIs",
    x: 500,
    y: 230,
    width: 720,
    height: 110,
    direction: "LR",
  },
  bfd: {
    id: "bfd",
    label: "BFD",
    x: 60,
    y: 410,
    width: 400,
    height: 220,
    direction: "LR",
  },
  "claims-pipeline": {
    id: "claims-pipeline",
    label: "Claims pipeline",
    x: 500,
    y: 410,
    width: 740,
    height: 220,
    direction: "LR",
  },
  warehouses: {
    id: "warehouses",
    label: "Data warehouses",
    x: 1300,
    y: 40,
    width: 220,
    height: 590,
    direction: "TB",
  },
  "support-services": {
    id: "support-services",
    label: "Support services",
    x: 60,
    y: 700,
    width: 820,
    height: 140,
    direction: "LR",
  },
  innovation: {
    id: "innovation",
    label: "Innovation chain",
    x: 60,
    y: 890,
    width: 1460,
    height: 140,
    direction: "LR",
  },
};
