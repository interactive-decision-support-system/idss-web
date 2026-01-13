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
    <form onSubmit={handleSubmit} className="flex space-x-4">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder={config.inputPlaceholder}
        className="flex-1 px-4 py-2 bg-white border border-[#8b959e]/40 rounded-xl focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515] transition-all duration-200 placeholder-[#8b959e] text-black text-base shadow-sm"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!inputMessage.trim() || isLoading}
        className="w-10 h-10 bg-gradient-to-r from-[#8C1515] to-[#750013] text-white rounded-full hover:from-[#750013] hover:to-[#8C1515] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
        aria-label="Send message"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}
