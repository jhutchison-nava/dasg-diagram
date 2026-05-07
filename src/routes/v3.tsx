import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DiagramFlow } from "@/components/DiagramFlow";

export const Route = createFileRoute("/v3")({
  component: V3Layout,
});

function V3Layout() {
  return (
    <>
      <DiagramFlow />
      <Outlet />
    </>
  );
}
