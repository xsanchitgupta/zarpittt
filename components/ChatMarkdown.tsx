'use client';
import React from 'react';
import Link from 'next/link';

/**
 * Tiny markdown renderer for chatbot replies — no dependencies, no raw HTML.
 * Supports: **bold**, *italic*, `code`, [links](/path), headings, - bullets, 1. numbered lists.
 * Internal links navigate in-app (and close the chat via onNavigate).
 */

function renderInline(text: string, keyPrefix: string, onNavigate?: () => void): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2] !== undefined) {
      nodes.push(<strong key={key} style={{ fontWeight: 800 }}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={key}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(<code key={key} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 5, padding: '1px 5px', fontSize: '0.9em' }}>{m[4]}</code>);
    } else if (m[5] !== undefined && m[6] !== undefined) {
      const href = m[6];
      if (href.startsWith('/')) {
        nodes.push(<Link key={key} href={href} onClick={onNavigate} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline' }}>{m[5]}</Link>);
      } else if (/^https?:\/\//i.test(href)) {
        nodes.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline' }}>{m[5]}</a>);
      } else {
        nodes.push(m[5]);
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ChatMarkdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let bi = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, j) => (
      <li key={j} style={{ marginBottom: 3 }}>{renderInline(item, `li-${bi}-${j}`, onNavigate)}</li>
    ));
    const style: React.CSSProperties = { margin: '2px 0 6px', paddingLeft: 20, display: 'flex', flexDirection: 'column' as const };
    blocks.push(list.ordered
      ? <ol key={`b-${bi++}`} style={style}>{items}</ol>
      : <ul key={`b-${bi++}`} style={style}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    if (numbered) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(numbered[1]);
      continue;
    }
    flushList();

    if (!line.trim()) continue;

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push(<div key={`b-${bi++}`} style={{ fontWeight: 800, margin: '4px 0 4px' }}>{renderInline(heading[1], `h-${bi}`, onNavigate)}</div>);
      continue;
    }
    blocks.push(<p key={`b-${bi++}`} style={{ margin: '0 0 6px' }}>{renderInline(line, `p-${bi}`, onNavigate)}</p>);
  }
  flushList();

  // Trim the bottom margin of the final block via a wrapper
  return <div style={{ display: 'flex', flexDirection: 'column', marginBottom: -6 }}>{blocks}</div>;
}
