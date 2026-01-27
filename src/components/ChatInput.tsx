'use client';

import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import { currentDomainConfig } from '@/config/domain-config';

interface ChatInputProps {
  onSendMessage: (message: string, k: number) => void;
  isLoading: boolean;
  modeK: number;
  onModeKChange: (k: number) => void;
}

type ModeOption = {
  k: 0 | 1 | 2 | 3;
  name: string;
  label: string;
};

export default function ChatInput({
  onSendMessage,
  isLoading,
  modeK,
  onModeKChange,
}: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const config = currentDomainConfig;

  const modeOptions: ModeOption[] = useMemo(
    () => [
      { k: 0, name: 'suggester', label: 'Suggester' },
      { k: 1, name: 'nudger', label: 'Nudger' },
      { k: 2, name: 'explorer', label: 'Explorer' },
      { k: 3, name: 'interviewer', label: 'Interviewer' },
    ],
    []
  );

  const selectedMode = useMemo(() => {
    return modeOptions.find((m) => m.k === modeK) ?? modeOptions[2];
  }, [modeK, modeOptions]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!isModeMenuOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setIsModeMenuOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isModeMenuOpen) return;
      if (e.key === 'Escape') setIsModeMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isModeMenuOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim(), selectedMode.k);
      setInputMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Mode selector (k: number of questions before recommendations) */}
      <div ref={modeMenuRef} className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((v) => !v)}
            disabled={isLoading}
            className="h-9 px-3 rounded-full border border-black/20 bg-white hover:bg-black/5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-haspopup="menu"
            aria-expanded={isModeMenuOpen}
            aria-label="Mode"
          >
            {/* icon: chat bubble (clearer than sliders) */}
            <svg className="w-4 h-4 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h8M8 14h5m-5 5l-4 1 1-4a9 9 0 111 1z"
              />
            </svg>
            <span className="text-sm font-medium text-black/80">Mode</span>
          </button>

          {/* tooltip */}
          {!isModeMenuOpen && (
            <div className="pointer-events-none absolute right-10 bottom-full mb-2 hidden group-hover:block">
              <div className="w-80 rounded-lg border border-black/10 bg-white shadow-lg px-3 py-2 text-xs text-black/80">
                Choose how many questions IDA asks before recommendations.
              </div>
            </div>
          )}
        </div>

        {/* menu */}
        {isModeMenuOpen && (
          <div
            role="menu"
            className="absolute left-0 bottom-full mb-2 w-60 rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden"
          >
            <div className="py-1">
              {modeOptions.map((m) => {
                const isSelected = m.k === selectedMode.k;
                return (
                  <button
                    key={m.k}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onModeKChange(m.k);
                      setIsModeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-black/5 transition-colors ${
                      isSelected ? 'bg-black/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-black">{m.label}</div>
                      <div className="text-xs text-black/60">
                        {m.k} question{m.k === 1 ? '' : 's'}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-[#8C1515]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder={config.inputPlaceholder}
        className="w-full pl-28 pr-12 px-4 py-3 bg-white border border-black/20 rounded-full focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515] transition-all duration-200 placeholder-black/40 text-black text-base shadow-sm"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!inputMessage.trim() || isLoading}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#8C1515] text-white rounded-full hover:bg-[#750013] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
        aria-label="Send message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}
