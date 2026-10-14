'use client';
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  // Coordinates with the AI assistant so the two floating buttons stack cleanly
  const [aiOpen, setAiOpen] = useState(false);
  const [hasLauncher, setHasLauncher] = useState(true);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);

    const onAiUi = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setAiOpen(!!detail.open);
      setHasLauncher(!!detail.launcherVisible);
    };
    window.addEventListener('zarpit-ai-ui', onAiUi);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      window.removeEventListener('zarpit-ai-ui', onAiUi);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Hidden while the AI chat panel is open — it would overlap the panel
  if (!isVisible || aiOpen) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        // Sits directly above the "Ask Zarpit" launcher (56px tall + 12px gap);
        // drops into the corner on pages without the launcher
        bottom: hasLauncher ? '92px' : '24px',
        right: '24px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--accent)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
        zIndex: 9997,
        transition: 'transform 0.2s ease, opacity 0.2s ease, bottom 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      aria-label="Scroll to top"
    >
      <ArrowUp size={24} />
    </button>
  );
}
