import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

const navLinkBase =
  "px-3 py-1 border border-border rounded-md text-[0.85rem] no-underline text-text";
const navLinkActive = "bg-text text-white border-text";

function RootLayout() {
  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-panel-bg">
        <h1 className="text-base font-semibold m-0">
          Population Health APIs — Data Flow
        </h1>
        <nav className="flex gap-2 ml-auto">
          <Link
            to="/v3"
            className={navLinkBase}
            activeProps={{ className: `${navLinkBase} ${navLinkActive}` }}
          >
            V3 Diagram
          </Link>
          <Link
            to="/glossary"
            className={navLinkBase}
            activeProps={{ className: `${navLinkBase} ${navLinkActive}` }}
          >
            Glossary
          </Link>
        </nav>
      </header>
      <main className="relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
