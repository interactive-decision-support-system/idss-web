'use client';

import React, { useEffect, useState } from 'react';

/**
 * Dev-only readout showing which shopping-agent backend the chat proxy is
 * currently routing to — `legacy` (/chat) or `llm` (/chat/llm, the
 * experimental prototype on exp/llm-shopping-agent). Clicking toggles and
 * reloads. Relies on `sa_agent_path` cookie set by `/api/agent-switch`.
 *
 * Intentionally minimal. Not a product feature — a mid-conversation "which
 * backend am I talking to right now?" indicator while A/B testing.
 */

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function AgentBadge() {
  const [agent, setAgent] = useState<'llm' | 'legacy'>('legacy');

  useEffect(() => {
    const cookie = readCookie('sa_agent_path');
    setAgent(cookie === '/chat/llm' ? 'llm' : 'legacy');
  }, []);

  const handleToggle = async () => {
    const next = agent === 'llm' ? 'legacy' : 'llm';
    try {
      await fetch(`/api/agent-switch?to=${next}`, { method: 'GET' });
    } catch {
      // Non-fatal; worst case the cookie isn't set and we stay on the current side.
    }
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title="Click to switch shopping-agent backend (legacy /chat ↔ experimental /chat/llm)"
      className="fixed bottom-2 right-2 z-50 rounded-full border border-black/10 bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-mono text-black/60 hover:text-black/90 hover:border-black/30 shadow-sm transition-colors"
    >
      agent: {agent} · switch
    </button>
  );
}
