'use client';

import { useState, FormEvent } from 'react';
import { currentDomainConfig } from '@/config/domain-config';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');
  const config = currentDomainConfig;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder={config.inputPlaceholder}
        className="w-full px-4 py-3 pr-12 bg-white border border-black/20 rounded-full focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515] transition-all duration-200 placeholder-black/40 text-black text-base shadow-sm"
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