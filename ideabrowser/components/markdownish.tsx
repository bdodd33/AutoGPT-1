import { Fragment, type ReactNode } from "react";

// A tiny dependency-free renderer for the lightweight markdown our ideas use:
// ### headings, - bullets, **bold**, and | pipe tables |. Good enough for the
// curated/AI-generated content without pulling in a full markdown parser.

function renderInline(text: string): ReactNode {
  // Split on **bold** while keeping the delimiters' contents.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function Table({ rows }: { rows: string[] }) {
  const cells = rows.map((r) =>
    r
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim()),
  );
  // Drop a separator row like |---|---|
  const body = cells.filter((row) => !row.every((c) => /^:?-+:?$/.test(c) || c === ""));
  const [head, ...rest] = body;
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head?.map((c, i) => (
              <th key={i} className="border-b border-zinc-300 px-3 py-2 text-left font-semibold">
                {renderInline(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rest.map((row, ri) => (
            <tr key={ri} className="odd:bg-zinc-50">
              {row.map((c, ci) => (
                <td key={ci} className="border-b border-zinc-200 px-3 py-2 align-top">
                  {renderInline(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdownish({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let table: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="my-2 list-disc space-y-1 pl-5">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item.replace(/^[-*]\s+/, ""))}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushTable = (key: string) => {
    if (table.length === 0) return;
    blocks.push(<Table key={key} rows={table} />);
    table = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.trim().startsWith("|")) {
      flushList(`l${i}`);
      table.push(line);
      return;
    }
    flushTable(`t${i}`);
    if (/^#{1,6}\s/.test(line)) {
      flushList(`l${i}`);
      blocks.push(
        <h4 key={`h${i}`} className="mt-4 mb-1 font-semibold text-zinc-900">
          {renderInline(line.replace(/^#{1,6}\s/, ""))}
        </h4>,
      );
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line);
    } else if (line.trim() === "") {
      flushList(`l${i}`);
    } else {
      flushList(`l${i}`);
      blocks.push(
        <p key={`p${i}`} className="my-2 leading-relaxed text-zinc-700">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList("l-end");
  flushTable("t-end");

  return <div className="text-[15px]">{blocks}</div>;
}
