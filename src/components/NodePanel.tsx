import { Link } from "@tanstack/react-router";
import {
  edges,
  glossary,
  nodes,
  type DiagramEdge,
  type EdgeKind,
} from "@/lib/diagram";

const EDGE_KIND_LABEL: Record<EdgeKind, string> = {
  default: "Data",
  "claims-submission": "Claims submission",
  "system-of-record": "System of record",
  "warehouse-flow": "Warehouse flow",
  "warehouse-feed": "Warehouse feed",
  "source-of-truth": "Source of truth",
  fhir: "FHIR",
};

const sectionClass =
  "mt-4 pt-4 border-t border-border [&_h3]:mb-2 [&_h3]:text-[0.85rem] [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-text-muted [&_h3]:font-semibold";

function EdgeRow({
  edge,
  toNodeId,
  toNodeLabel,
}: {
  edge: DiagramEdge;
  toNodeId: string;
  toNodeLabel: string;
}) {
  return (
    <li className="grid grid-cols-[0.6rem_1fr] gap-x-2 items-baseline">
      <span
        className="edge-chip mt-1"
        data-edge-kind={edge.kind}
        title={EDGE_KIND_LABEL[edge.kind]}
        aria-label={EDGE_KIND_LABEL[edge.kind]}
      />
      <div>
        <Link
          to="/v3/node/$nodeId"
          params={{ nodeId: toNodeId }}
          className="text-[#1f4d80] hover:underline"
        >
          {toNodeLabel}
        </Link>
        {edge.label && (
          <span className="text-text-muted"> — {edge.label}</span>
        )}
        {(edge.format || edge.cadence) && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {edge.format && (
              <span className="font-mono text-[0.7rem] bg-bg border border-border rounded px-1">
                {edge.format}
              </span>
            )}
            {edge.cadence && (
              <span className="font-mono text-[0.7rem] bg-bg border border-border rounded px-1">
                {edge.cadence}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

const sidePanelShell =
  "absolute top-0 right-0 bottom-0 w-[360px] bg-panel-bg border-l border-border px-5 py-4 overflow-y-auto z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.04)]";
const closeButton =
  "absolute top-3 right-3 bg-transparent border-0 text-xl cursor-pointer text-text-muted no-underline";

export function NodePanel({ nodeId }: { nodeId: string }) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) {
    return (
      <div className={sidePanelShell}>
        <Link to="/v3" className={closeButton} aria-label="Close panel">
          ×
        </Link>
        <h2 className="m-0 mb-1 text-base font-semibold">Unknown node</h2>
        <p>No node found with id "{nodeId}".</p>
      </div>
    );
  }

  const glossaryKey = node.glossaryRef ?? node.acronym;
  const glossaryHit = glossaryKey
    ? glossary.find((g) => g.key === glossaryKey)
    : undefined;

  const incoming = edges.filter((e) => e.target === node.id);
  const outgoing = edges.filter((e) => e.source === node.id);

  return (
    <aside className={sidePanelShell}>
      <Link to="/v3" className={closeButton} aria-label="Close panel">
        ×
      </Link>
      <h2 className="m-0 mb-1 text-base font-semibold">{node.label}</h2>
      {node.acronym && (
        <span className="inline-block font-mono text-[0.8rem] text-text-muted mb-3">
          {node.acronym}
        </span>
      )}

      <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
        <dt className="font-semibold text-text-muted">Category</dt>
        <dd className="m-0">{node.category}</dd>
        {node.owner && (
          <>
            <dt className="font-semibold text-text-muted">Owner</dt>
            <dd className="m-0">{node.owner}</dd>
          </>
        )}
        {node.parent && (
          <>
            <dt className="font-semibold text-text-muted">Parent</dt>
            <dd className="m-0">{node.parent}</dd>
          </>
        )}
      </dl>

      {glossaryHit && (
        <section className={sectionClass}>
          <h3>Definition</h3>
          <p>{glossaryHit.definition}</p>
        </section>
      )}

      {node.description && (
        <section className={sectionClass}>
          <h3>Description</h3>
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: node.description }}
          />
        </section>
      )}

      {node.note && (
        <section className={sectionClass}>
          <h3>Notes</h3>
          <p>{node.note}</p>
        </section>
      )}

      {incoming.length > 0 && (
        <section className={sectionClass}>
          <h3>Incoming ({incoming.length})</h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {incoming.map((e) => (
              <EdgeRow
                key={e.id}
                edge={e}
                toNodeId={e.source}
                toNodeLabel={
                  nodes.find((n) => n.id === e.source)?.label ?? e.source
                }
              />
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className={sectionClass}>
          <h3>Outgoing ({outgoing.length})</h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {outgoing.map((e) => (
              <EdgeRow
                key={e.id}
                edge={e}
                toNodeId={e.target}
                toNodeLabel={
                  nodes.find((n) => n.id === e.target)?.label ?? e.target
                }
              />
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
