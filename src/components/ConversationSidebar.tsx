'use client';

import React from 'react';
import type { SavedSession } from '@/types/chat';

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
  open: boolean;
  sessions: SavedSession[];
  onLoad: (session: SavedSession) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ConversationSidebar({ open, sessions, onLoad, onClear, onClose }: Props) {
  return (
    <>
      {/* Backdrop — click outside closes the sidebar */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-black/10">
          <h2 className="text-sm font-semibold text-black">Past Searches</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5 transition-colors"
            aria-label="Close history sidebar"
          >
            <svg className="w-4 h-4 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-black/40">
              No saved searches yet.
              <br />
              <span className="text-xs">Your conversations will appear here.</span>
            </div>
          ) : (
            sessions.map((session) => {
              const icon = DOMAIN_ICON[session.domain ?? ''] ?? '🔍';
              return (
                <button
                  key={session.sessionId}
                  onClick={() => onLoad(session)}
                  className="w-full text-left px-4 py-3 hover:bg-black/5 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5 shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black leading-snug truncate group-hover:text-[#8C1515] transition-colors">
                        {session.title}
                      </p>
                      <p className="text-xs text-black/40 mt-0.5">
                        {relativeTime(session.timestamp)}
                        {session.messages.filter(m => m.role === 'user').length > 0 && (
                          <span className="ml-1.5 text-black/30">
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

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="px-4 py-3 border-t border-black/10">
            <button
              onClick={onClear}
              className="w-full py-2 text-xs text-black/40 hover:text-red-600 transition-colors text-center"
            >
              Clear all history
            </button>
          </div>
        )}
      </div>
    </>
  );
}
