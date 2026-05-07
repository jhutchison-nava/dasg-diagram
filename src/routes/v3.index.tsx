import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v3/")({
  component: () => null, // diagram is rendered by parent layout
});
