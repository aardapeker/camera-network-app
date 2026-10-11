interface HighlightMatchProps {
  text: string;
  /** Search query; when empty the text renders unchanged. */
  query: string;
}

/** Escapes regex metacharacters so queries like "192.168.3.1" match literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders text with every case-insensitive occurrence of the query highlighted.
 * Used by the viewer sidebar search so matched names, IPs, and notes stand out.
 */
export function HighlightMatch({ text, query }: HighlightMatchProps) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"));
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={i}
            className="bg-primary/30 text-foreground rounded-[2px] px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
