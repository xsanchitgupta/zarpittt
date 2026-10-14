'use client';

/**
 * Renders admin-authored plain text with lightweight formatting:
 *   "## Heading"  → section heading
 *   "- item"      → bullet list item
 *   "> note"      → highlighted callout
 *   blank line    → paragraph break
 */
export default function CmsText({ text }: { text: string }) {
  const blocks: { type: 'h2' | 'p' | 'ul' | 'quote'; lines: string[] }[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) { blocks.push({ type: 'p', lines: [] }); continue; }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', lines: [line.slice(3)] }); continue; }
    if (line.startsWith('> ')) { blocks.push({ type: 'quote', lines: [line.slice(2)] }); continue; }
    if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'ul') last.lines.push(line.slice(2));
      else blocks.push({ type: 'ul', lines: [line.slice(2)] });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last && last.type === 'p' && last.lines.length > 0) last.lines.push(line);
    else if (last && last.type === 'p' && last.lines.length === 0) last.lines.push(line);
    else blocks.push({ type: 'p', lines: [line] });
  }

  return (
    <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {blocks.map((b, i) => {
        if (b.lines.length === 0) return null;
        if (b.type === 'h2') return (
          <h2 key={i} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>{b.lines[0]}</h2>
        );
        if (b.type === 'ul') return (
          <ul key={i} style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, margin: 0 }}>
            {b.lines.map((l, j) => <li key={j}>{l}</li>)}
          </ul>
        );
        if (b.type === 'quote') return (
          <div key={i} style={{ padding: 20, background: 'var(--accent-light)', borderLeft: '4px solid var(--accent)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', color: 'var(--accent)' }}>
            {b.lines[0]}
          </div>
        );
        return <p key={i}>{b.lines.join(' ')}</p>;
      })}
    </div>
  );
}
