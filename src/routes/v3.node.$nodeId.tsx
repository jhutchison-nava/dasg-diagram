import { createFileRoute } from "@tanstack/react-router";
import { NodePanel } from "@/components/NodePanel";

export const Route = createFileRoute("/v3/node/$nodeId")({
  component: NodeRoute,
});

function NodeRoute() {
  const { nodeId } = Route.useParams();
  return <NodePanel nodeId={nodeId} />;
}
