import { createFileRoute } from "@tanstack/react-router";
import { glossary } from "@/lib/diagram";

export const Route = createFileRoute("/glossary")({
  component: GlossaryPage,
});

function GlossaryPage() {
  return (
    <div className="px-8 py-6 max-w-[900px] mx-auto h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-1">Glossary</h2>
      <p className="text-text-muted mb-4">
        {glossary.length} acronyms, transcribed from the diagram source.
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-[0.9rem]">
        {glossary.map((entry) => (
          <div key={entry.key} className="contents">
            <dt className="font-mono font-semibold">{entry.term}</dt>
            <dd className="m-0">{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
