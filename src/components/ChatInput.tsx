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
  const [isListening, setIsListening] = useState(false);
  const inputFocusedRef = useRef(false);
  const isListeningRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const placeholderQueries = useMemo(
    () => getMultiDomainDefaults().examplePlaceholderQueries,
    []
  );

  const currentPlaceholder = placeholderQueries[placeholderIndex % placeholderQueries.length];

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputMessage.trim() || inputFocusedRef.current || isListeningRef.current) return;
      setPlaceholderIndex((i) => (i + 1) % placeholderQueries.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputMessage, placeholderQueries.length]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      await onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleMicClick = () => {
    // If already listening, stop
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => { isListeningRef.current = true; setIsListening(true); };
    recognition.onend = () => { isListeningRef.current = false; setIsListening(false); };
    recognition.onerror = () => { isListeningRef.current = false; setIsListening(false); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-2xl border border-black/20 bg-white shadow-sm overflow-hidden"
      >
        {/* Row 1: text input + mic + send — inside same border as chatbox */}
        <div className="relative flex items-center">
          {/* Animated placeholder overlay (hidden when user has typed or listening) */}
          {!inputMessage.trim() && !isListening && (
            <div
              className="absolute inset-0 flex items-center pl-4 pr-20 pointer-events-none"
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
          {/* Listening indicator overlay */}
          {isListening && !inputMessage.trim() && (
            <div
              className="absolute inset-0 flex items-center pl-4 pr-20 pointer-events-none"
              aria-hidden
            >
              <span className="text-base text-[#8C1515] animate-pulse">
                Listening…
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
            className="w-full pl-4 pr-20 py-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-black text-base relative z-[1]"
            disabled={isLoading}
          />
          {/* Mic button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`absolute right-12 z-[2] w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
              ${isListening
                ? 'bg-[#8C1515] text-white animate-pulse'
                : 'text-black/40 hover:text-black/70 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            aria-label={isListening ? 'Stop listening' : 'Speak your query'}
          >
            {isListening ? (
              // Stop icon when active
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Mic icon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  x1="12" y1="19" x2="12" y2="23" />
                <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          {/* Send button */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-2 z-[2] w-9 h-9 bg-[#8C1515] text-white rounded-full hover:bg-[#750013] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shrink-0"
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
