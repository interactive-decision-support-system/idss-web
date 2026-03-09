'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { SavedSession, ChatFolder } from '@/types/chat';
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
  open: boolean;
  sessions: SavedSession[];
  folders: ChatFolder[];
  onLoad: (session: SavedSession) => void;
  onClear: () => void;
  onClose: () => void;
  onNewChat: () => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onMoveToFolder: (sessionId: string, folderId: string | null) => void;
}

export default function ConversationSidebar({
  open,
  sessions,
  folders,
  onLoad,
  onClear,
  onClose,
  onNewChat,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onMoveToFolder,
}: Props) {
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<{ type: 'session' | 'folder'; id: string } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const newFolderRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // Focus input when shown
  useEffect(() => { if (creatingFolder) newFolderRef.current?.focus(); }, [creatingFolder]);
  useEffect(() => { if (renamingFolderId) renameRef.current?.focus(); }, [renamingFolderId]);

  // Close menus on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = () => setActiveMenu(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeMenu]);

  const toggleFolder = (id: string) =>
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (name) onCreateFolder(name);
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const startRename = (folder: ChatFolder) => {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
    setActiveMenu(null);
  };

  const commitRename = () => {
    if (renamingFolderId && renameValue.trim()) {
      onRenameFolder(renamingFolderId, renameValue.trim());
    }
    setRenamingFolderId(null);
    setRenameValue('');
  };

  // Sessions not in any folder
  const unfolderedSessions = sessions.filter(s => !s.folderId);

  const SessionRow = ({ session }: { session: SavedSession }) => {
    const icon = DOMAIN_ICON[session.domain ?? ''] ?? '🔍';
    const isMenuOpen = activeMenu?.type === 'session' && activeMenu.id === session.sessionId;

    return (
      <div className="relative group">
        <button
          onClick={() => { onLoad(session); onClose(); }}
          className="w-full text-left px-3 py-2.5 hover:bg-black/5 transition-colors"
        >
          <div className="flex items-start gap-2 pr-5">
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

        {/* 3-dot menu button — visible on hover */}
        <button
          onMouseDown={e => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : { type: 'session', id: session.sessionId }); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity"
          aria-label="Session options"
        >
          <svg className="w-3 h-3 text-black/50" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div
            onMouseDown={e => e.stopPropagation()}
            className="absolute right-1 top-full z-50 mt-0.5 w-44 bg-white rounded-lg shadow-lg border border-black/10 py-1 text-xs"
          >
            {folders.length > 0 && (
              <>
                <p className="px-3 py-1 text-[10px] font-semibold text-black/35 uppercase tracking-wide">Move to folder</p>
                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { onMoveToFolder(session.sessionId, session.folderId === f.id ? null : f.id); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                    <span className="truncate">{f.name}</span>
                    {session.folderId === f.id && <span className="ml-auto text-[#8C1515]">✓</span>}
                  </button>
                ))}
                <div className="border-t border-black/8 my-1" />
              </>
            )}
            {session.folderId && (
              <button
                onClick={() => { onMoveToFolder(session.sessionId, null); setActiveMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-black/5 text-black/60"
              >
                Remove from folder
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full w-60 bg-[#fafaf9] border-r border-black/8
          flex flex-col z-40
          transition-transform duration-300 ease-in-out
          -translate-x-full md:translate-x-0
          ${open ? 'translate-x-0' : ''}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-black/8">
          <IDSSLogo size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black leading-none">IDSS</p>
            <p className="text-[10px] text-black/40 leading-none mt-0.5">Stanford LDR Lab</p>
          </div>
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

        {/* New Chat + New Folder buttons */}
        <div className="px-3 pt-3 pb-2 flex gap-2">
          <button
            onClick={() => {
              onNewChat();
              window.open('/', '_blank');
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#8C1515] text-white text-sm font-medium hover:bg-[#750013] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
          <button
            onClick={() => setCreatingFolder(true)}
            title="New folder"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/15 hover:bg-black/5 transition-colors text-black/50 hover:text-black/70 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* New folder name input */}
        {creatingFolder && (
          <div className="px-3 pb-2">
            <input
              ref={newFolderRef}
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); } }}
              onBlur={handleCreateFolder}
              placeholder="Folder name…"
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[#8C1515]/40 bg-white outline-none focus:border-[#8C1515]"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Folders */}
          {folders.map(folder => {
            const folderSessions = sessions.filter(s => s.folderId === folder.id);
            const isCollapsed = collapsedFolders.has(folder.id);
            const isFolderMenuOpen = activeMenu?.type === 'folder' && activeMenu.id === folder.id;

            return (
              <div key={folder.id} className="mt-1">
                {/* Folder header */}
                <div className="relative group flex items-center px-3 py-1.5 hover:bg-black/5 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                  <svg
                    className={`w-3 h-3 text-black/40 mr-1 transition-transform shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                  <svg className="w-3.5 h-3.5 text-black/40 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>

                  {renamingFolderId === folder.id ? (
                    <input
                      ref={renameRef}
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenamingFolderId(null); } }}
                      onBlur={commitRename}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 text-xs bg-transparent border-b border-[#8C1515]/50 outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-xs font-semibold text-black/70 truncate">{folder.name}</span>
                  )}

                  <span className="text-[10px] text-black/30 mr-1">{folderSessions.length}</span>

                  {/* Folder menu button */}
                  <button
                    onMouseDown={e => { e.stopPropagation(); setActiveMenu(isFolderMenuOpen ? null : { type: 'folder', id: folder.id }); }}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity"
                    aria-label="Folder options"
                  >
                    <svg className="w-3 h-3 text-black/50" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                    </svg>
                  </button>

                  {isFolderMenuOpen && (
                    <div
                      onMouseDown={e => e.stopPropagation()}
                      className="absolute right-1 top-full z-50 mt-0.5 w-36 bg-white rounded-lg shadow-lg border border-black/10 py-1 text-xs"
                    >
                      <button onClick={() => startRename(folder)} className="w-full text-left px-3 py-1.5 hover:bg-black/5">Rename</button>
                      <button
                        onClick={() => { onDeleteFolder(folder.id); setActiveMenu(null); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600"
                      >Delete folder</button>
                    </div>
                  )}
                </div>

                {/* Folder sessions */}
                {!isCollapsed && (
                  <div className="pl-4 border-l border-black/8 ml-3">
                    {folderSessions.length === 0 ? (
                      <p className="px-3 py-2 text-[10px] text-black/30 italic">Empty folder</p>
                    ) : (
                      folderSessions.map(s => <SessionRow key={s.sessionId} session={s} />)
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unfoldered sessions under "Recent" */}
          {unfolderedSessions.length > 0 && (
            <>
              <div className="px-4 pb-1 pt-2">
                <p className="text-[10px] font-semibold text-black/35 uppercase tracking-widest">Recent</p>
              </div>
              {unfolderedSessions.map(s => <SessionRow key={s.sessionId} session={s} />)}
            </>
          )}

          {sessions.length === 0 && folders.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-black/35 leading-relaxed">
              No saved searches yet.
              <br />
              Start a chat to see history here.
            </div>
          )}
        </div>

        {/* Footer */}
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
