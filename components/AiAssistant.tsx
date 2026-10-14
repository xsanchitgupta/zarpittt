'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Send, Mic, Square, Bot, ArrowRight, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useSpeech } from '@/lib/use-speech';
import ChatMarkdown from './ChatMarkdown';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: { id: string; name: string; price: number; duration: string }[];
  actions?: { href: string; label: string }[];
}

const STORAGE_KEY = 'zarpit_ai_chat';
const GREETING: ChatMsg = {
  role: 'assistant',
  content: 'Hi! I\'m Zarpit Buddy 👋 Ask me anything — booking a companion or helping buddy, prices, cancellations, offers, or where to find something on the site. I\'ll answer and take you right there. Hinglish bhi chalega!',
};

const QUICK_PROMPTS = [
  'Mummy ko hospital le jana hai, kaun sa service lu?',
  'I need help shifting my hostel room',
  'Meri booking kahan dikhegi? Cancel kaise karu?',
  'Any offers or coupon codes right now?',
];

// Hidden on app-management and focused-flow routes
const HIDDEN_PREFIXES = ['/admin', '/provider', '/auth', '/checkout', '/banned', '/maintenance', '/signout'];

export default function AiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const speech = useSpeech((finalText) => {
    setInput(prev => (prev ? prev.trimEnd() + ' ' : '') + finalText);
  });

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, thinking]);

  const hidden = !mounted || HIDDEN_PREFIXES.some(p => pathname?.startsWith(p));

  // Tell other floating UI (scroll-to-top) where we are so the stack stays tidy
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('zarpit-ai-ui', {
      detail: { open: open && !hidden, launcherVisible: !hidden },
    }));
  }, [open, hidden]);

  if (hidden) return null;

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput('');
    const nextMessages: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setThinking(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-12).map(m => ({ role: m.role, content: m.content })),
          page: pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, suggestions: data.suggestions, actions: data.actions }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err?.message?.includes('wait a minute')
          ? 'You\'re sending messages a bit fast — give me a minute and try again 🙏'
          : 'Sorry, I couldn\'t reach the server. Please check your connection and try again.',
      }]);
    }
    setThinking(false);
  };

  return (
    <>
      {/* Floating launcher — full pill on desktop, compact round bot on mobile */}
      {!open && (
        <button
          className="zai-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Zarpit Buddy AI assistant"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
            height: 56, borderRadius: 999,
            background: 'linear-gradient(135deg, var(--accent), #ff9a56)', color: '#fff',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 28px rgba(255,107,0,0.4)', fontWeight: 800, fontSize: 14,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          <Bot size={26} className="zai-launcher-bot" />
          <span className="zai-launcher-text">Ask Zarpit</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
          width: 390, maxWidth: 'calc(100vw - 32px)', height: 'min(600px, calc(100vh - 100px))',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'chatModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(255,107,0,0.08), transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), #ff9a56)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>Zarpit Buddy</div>
                <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>● AI Assistant</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 16,
                  borderTopRightRadius: m.role === 'user' ? 4 : 16,
                  borderTopLeftRadius: m.role === 'assistant' ? 4 : 16,
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--glass-bg)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
                  whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
                }}>
                  {m.role === 'assistant'
                    ? <ChatMarkdown text={m.content} onNavigate={() => setOpen(false)} />
                    : m.content}
                </div>
                {/* Navigation buttons the AI attached ("take me to my bookings" etc.) */}
                {m.actions && m.actions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '85%' }}>
                    {m.actions.map((a, ai) => (
                      <Link key={ai} href={a.href} onClick={() => setOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999,
                        textDecoration: 'none', fontSize: 12.5, fontWeight: 800,
                        background: 'transparent', border: '1.5px solid var(--accent-border)', color: 'var(--accent)',
                        transition: 'all 0.15s ease',
                      }}>
                        {a.label} <ArrowRight size={13} />
                      </Link>
                    ))}
                  </div>
                )}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '85%' }}>
                    {m.suggestions.map(s => (
                      <Link key={s.id} href={`/services/${s.id}`} onClick={() => setOpen(false)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                        background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
                        transition: 'transform 0.15s ease',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatPrice(s.price)}{/hour/i.test(s.duration) ? ' / hour' : ''}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>Book <ArrowRight size={13} /></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div style={{ display: 'flex', gap: 5, padding: '12px 16px', alignSelf: 'flex-start', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, borderTopLeftRadius: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `aiDot 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                ))}
              </div>
            )}

            {/* Quick prompts — only while conversation is fresh */}
            {messages.length <= 1 && !thinking && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 12, fontSize: 12.5, fontWeight: 600,
                    background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >💬 {q}</button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 16px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {speech.listening && (
              <div style={{ fontSize: 12, color: 'var(--accent)', fontStyle: 'italic', padding: '0 4px', minHeight: 16 }}>
                {speech.interim || 'Listening… speak now'}
              </div>
            )}
            {speech.error && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={13} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11.5, color: 'var(--error)', lineHeight: 1.5, fontWeight: 600 }}>{speech.error}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type or speak your need…"
                style={{
                  flex: 1, height: 46, borderRadius: 14, fontSize: 13.5, padding: '0 14px',
                  background: 'var(--bg-input)', border: `1px solid ${speech.listening ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s ease',
                }}
              />
              {speech.supported && (
                <button onClick={speech.toggle} aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'} style={{
                  width: 46, height: 46, borderRadius: 14, cursor: 'pointer',
                  border: `1.5px solid ${speech.listening ? 'var(--error)' : 'var(--accent-border)'}`,
                  background: speech.listening ? 'rgba(239,68,68,0.1)' : 'var(--accent-light)',
                  color: speech.listening ? 'var(--error)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: speech.listening ? 'pulse 1.4s infinite' : 'none',
                }}>
                  {speech.listening ? <Square size={16} fill="currentColor" /> : <Mic size={19} />}
                </button>
              )}
              <button onClick={() => send()} disabled={thinking || !input.trim()} aria-label="Send message" style={{
                width: 46, height: 46, borderRadius: 14, border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                background: input.trim() ? 'var(--accent)' : 'var(--glass-bg)',
                color: input.trim() ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                <Send size={19} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes aiDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes chatModalIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        /* Desktop: pill with robot logo + text */
        .zai-launcher { padding: 0 20px 0 16px; }
        /* Mobile: compact 56px round bot icon */
        @media (max-width: 640px) {
          .zai-launcher { width: 56px; padding: 0; }
          .zai-launcher-text { display: none; }
        }
      `}} />
    </>
  );
}
