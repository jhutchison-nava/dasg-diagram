import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import "@xyflow/react/dist/style.css";
import "./styles.css";

// Vite stamps `import.meta.env.BASE_URL` from the `base` config — "/" in
// dev, "/dasg-api-flow-diagram/" in production. TanStack Router wants the
// path without the trailing slash.
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;
const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
