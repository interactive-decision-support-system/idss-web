'use client';

import { useMemo, useState, useEffect, useRef, FormEvent } from 'react';
import { getMultiDomainDefaults } from '@/config/domain-config';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function ChatInput({
  onSendMessage,
  isLoading,
}: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputFocusedRef = useRef(false);

  const placeholderQueries = useMemo(
    () => getMultiDomainDefaults().examplePlaceholderQueries,
    []
  );

  const currentPlaceholder = placeholderQueries[placeholderIndex % placeholderQueries.length];

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputMessage.trim() || inputFocusedRef.current) return;
      setPlaceholderIndex((i) => (i + 1) % placeholderQueries.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputMessage, placeholderQueries.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      await onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

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
      </form>

      <div className="text-center text-xs text-black/50">
        IDSS can make mistakes. Check before completing any purchases.
      </div>
    </div>
  );
}
