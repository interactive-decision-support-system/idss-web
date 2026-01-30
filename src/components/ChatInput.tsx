'use client';

import { useMemo, useState, useEffect, useRef, FormEvent } from 'react';
import { currentDomainConfig } from '@/config/domain-config';

interface ChatInputProps {
  onSendMessage: (message: string, k: number) => void;
  isLoading: boolean;
  modeK: number;
  onModeKChange: (k: number) => void;
  /** When true, followup-question buttons are disabled until recommendations are given. */
  modeButtonsLocked?: boolean;
}

type ModeOption = {
  k: 0 | 1 | 2;
  name: string;
  label: string;
};

export default function ChatInput({
  onSendMessage,
  isLoading,
  modeK,
  onModeKChange,
  modeButtonsLocked = false,
}: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputFocusedRef = useRef(false);
  const config = currentDomainConfig;

  const placeholderQueries = useMemo(
    () => config.examplePlaceholderQueries ?? [config.inputPlaceholder],
    [config.examplePlaceholderQueries, config.inputPlaceholder]
  );

  const currentPlaceholder = placeholderQueries[placeholderIndex % placeholderQueries.length];

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputMessage.trim() || inputFocusedRef.current) return;
      setPlaceholderIndex((i) => (i + 1) % placeholderQueries.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputMessage, placeholderQueries.length]);

  const modeOptions: ModeOption[] = useMemo(
    () => [
      { k: 0, name: 'suggester', label: 'Suggester' },
      { k: 1, name: 'nudger', label: 'Nudger' },
      { k: 2, name: 'explorer', label: 'Explorer' },
    ],
    []
  );

  const selectedMode = useMemo(() => {
    return modeOptions.find((m) => m.k === modeK) ?? modeOptions[2];
  }, [modeK, modeOptions]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim(), selectedMode.k);
      setInputMessage('');
    }
  };

  const modeButtonBase =
    'rounded-full border border-black/20 bg-white hover:bg-black/5 transition-all duration-200 flex flex-col items-center justify-center gap-0 py-2 px-4 min-w-[4.5rem] disabled:opacity-50 disabled:cursor-not-allowed text-black/80';

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-2xl border border-black/20 bg-white shadow-sm overflow-hidden"
      >
        {/* Row 1: text input + send — inside same border as chatbox */}
        <div className="relative flex items-center">
          {/* Animated placeholder overlay (hidden when user has typed) */}
          {!inputMessage.trim() && (
            <div
              className="absolute inset-0 flex items-center pl-4 pr-12 pointer-events-none"
              aria-hidden
            >
              <span
                key={placeholderIndex}
                className="placeholder-enter text-base text-black/40 truncate max-w-full"
              >
                {currentPlaceholder}
              </span>
            </div>
          )}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder=" "
            onFocus={() => { inputFocusedRef.current = true; }}
            onBlur={() => { inputFocusedRef.current = false; }}
            className="w-full pl-4 pr-12 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-black text-base relative z-[1]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-2 w-9 h-9 bg-[#8C1515] text-white rounded-full hover:bg-[#750013] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shrink-0"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Row 2: followup questions header + mode buttons */}
        <div className="pl-4 pr-2 pt-2 pb-2">
          <p className="text-xs text-black/50 mb-2">Followup Questions</p>
          <div className="flex items-center gap-2 flex-wrap">
          {modeOptions.map((m) => {
            const isSelected = m.k === selectedMode.k;
            const questionLabel = m.k === 1 ? '1 question' : `${m.k} questions`;
            return (
              <button
                key={m.k}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${m.label}, ${questionLabel}`}
                onClick={() => onModeKChange(m.k)}
                disabled={isLoading || modeButtonsLocked}
                className={`${modeButtonBase} ${isSelected ? '!bg-[#8C1515]/25 !border-[#8C1515]/60 text-[#8C1515] shadow-sm' : ''}`}
              >
                <span className={`text-sm leading-tight font-medium ${isSelected ? 'text-[#8C1515]' : ''}`}>{questionLabel}</span>
              </button>
            );
          })}
          </div>
        </div>
      </form>

      <div className="text-center text-xs text-black/50">
        IDSS can make mistakes. Check before completing any purchases.
      </div>
    </div>
  );
}
