import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/lib/flow-data";

type Props = NodeProps & {
  data: FlowNodeData;
  selected?: boolean;
};

export function CategoryNode({ data, selected }: Props) {
  const className = [
    "cat-node",
    data.isGroup ? "is-group" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} data-category={data.category}>
      {/* Handles on all four sides so connections can be dragged in any
          direction. ReactFlow's `connectionMode="loose"` (set on the canvas)
          lets either handle act as source or target. */}
      <Handle id="top" type="source" position={Position.Top} />
      <Handle id="left" type="source" position={Position.Left} />
      <div className="label">{data.label}</div>
      {data.acronym && data.acronym !== data.label && (
        <span className="acronym">{data.acronym}</span>
      )}
      <Handle id="right" type="source" position={Position.Right} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
    </div>
  );
}
