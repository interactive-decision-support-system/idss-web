'use client';

import React from 'react';
import type { SavedSession } from '@/types/chat';
import IDSSLogo from './IDSSLogo';

// Domain → emoji for quick visual identification
const DOMAIN_ICON: Record<string, string> = {
  vehicles: '🚗',
  laptops: '💻',
  books: '📚',
  phones: '📱',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  /** Mobile: controls slide-in. Desktop: sidebar is always visible. */
  open: boolean;
  sessions: SavedSession[];
  onLoad: (session: SavedSession) => void;
  onClear: () => void;
  onClose: () => void;
  onNewChat: () => void;
}

export default function ConversationSidebar({
  open,
  sessions,
  onLoad,
  onClear,
  onClose,
  onNewChat,
}: Props) {
  return (
    <>
      {/* Mobile backdrop — click outside closes the sidebar */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel
          - Mobile: hidden by default (-translate-x-full), slides in when `open`
          - Desktop (md+): always visible (translate-x-0 via md:translate-x-0)
      */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-60 bg-[#fafaf9] border-r border-black/8
          flex flex-col z-40
          transition-transform duration-300 ease-in-out
          -translate-x-full md:translate-x-0
          ${open ? 'translate-x-0' : ''}
        `}
      >
        {/* Logo + app name */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-black/8">
          <IDSSLogo size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black leading-none">IDSS</p>
            <p className="text-[10px] text-black/40 leading-none mt-0.5">Stanford LDR Lab</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-3.5 h-3.5 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#8C1515] text-white text-sm font-medium hover:bg-[#750013] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* "Recent" label */}
        {sessions.length > 0 && (
          <div className="px-4 pb-1 pt-1">
            <p className="text-[10px] font-semibold text-black/35 uppercase tracking-widest">Recent</p>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-black/35 leading-relaxed">
              No saved searches yet.
              <br />
              Start a chat to see history here.
            </div>
          ) : (
            sessions.map((session) => {
              const icon = DOMAIN_ICON[session.domain ?? ''] ?? '🔍';
              return (
                <button
                  key={session.sessionId}
                  onClick={() => { onLoad(session); onClose(); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-black/5 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-black leading-snug truncate group-hover:text-[#8C1515] transition-colors font-medium">
                        {session.title}
                      </p>
                      <p className="text-[10px] text-black/35 mt-0.5">
                        {relativeTime(session.timestamp)}
                        {session.messages.filter(m => m.role === 'user').length > 0 && (
                          <span className="ml-1.5 text-black/25">
                            · {session.messages.filter(m => m.role === 'user').length} msg
                            {session.messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer — clear history */}
        {sessions.length > 0 && (
          <div className="px-4 py-3 border-t border-black/8">
            <button
              onClick={onClear}
              className="w-full py-1.5 text-xs text-black/35 hover:text-red-600 transition-colors text-center"
            >
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
