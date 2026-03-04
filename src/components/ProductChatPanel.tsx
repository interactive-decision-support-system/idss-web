'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/chat';
import { idssApiService } from '@/services/api';

interface ProductChatPanelProps {
  product: Product;
  onClose: () => void;
}

interface PanelMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'What are the pros and cons?',
  'Is this good for gaming?',
  'How is the battery life?',
  'Compare to similar laptops',
  'Is this worth the price?',
  'What are the specs in detail?',
];

function getProductName(p: Product): string {
  return (p as { name?: string }).name ?? (p as { title?: string }).title ?? 'Product';
}

function getProductImage(p: Product): string | null {
  const pp = p as { image?: { primary?: string }; image_url?: string; primaryImage?: string };
  return pp.image?.primary ?? pp.image_url ?? pp.primaryImage ?? null;
}

function getProductPrice(p: Product): string | null {
  const pp = p as { price?: number; price_text?: string };
  if (pp.price_text) return pp.price_text;
  if (pp.price != null) return `$${pp.price.toLocaleString()}`;
  return null;
}

export default function ProductChatPanel({ product, onClose }: ProductChatPanelProps) {
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const name = getProductName(product);
  const imgSrc = !imgError ? getProductImage(product) : null;
  const price = getProductPrice(product);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || loading) return;

    // Snapshot history before adding new user message
    const priorHistory = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      // Use dedicated product Q&A endpoint — passes full product data as context,
      // bypasses the interview flow entirely, answers directly about this product.
      const answer = await idssApiService.productQA(text, product as object, priorHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 shrink-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 shrink-0 relative">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              fill
              className="object-cover"
              sizes="40px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">?</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-black truncate">{name}</p>
          {price && <p className="text-xs text-[#8C1515] font-medium">{price}</p>}
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
          aria-label="Close Ask AI panel"
        >
          <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body — conversation or empty state */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <>
            {/* Intro */}
            <div className="rounded-xl bg-[#8C1515]/5 border border-[#8C1515]/15 px-3 py-2.5">
              <p className="text-xs text-black/65 leading-relaxed">
                Ask me anything about <span className="font-semibold text-black">{name}</span>.
                I&apos;ll answer based on its specs, reviews, and how it fits your needs.
              </p>
            </div>

            {/* Quick chips */}
            <div>
              <p className="text-[10px] font-semibold text-black/35 uppercase tracking-wider mb-2">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="px-2.5 py-1.5 text-xs rounded-full border border-black/15 text-black/65 hover:border-[#8C1515]/40 hover:text-[#8C1515] hover:bg-[#8C1515]/5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] text-xs leading-relaxed rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-[#8C1515] text-white rounded-br-sm'
                      : 'bg-black/5 text-black rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-black/5 rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-black/8">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a specific question…"
            rows={2}
            className="flex-1 text-sm border border-black/15 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#8C1515]/40 text-black placeholder:text-black/30"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-9 h-9 mb-0.5 rounded-lg bg-[#8C1515] text-white flex items-center justify-center hover:bg-[#750013] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-black/30 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
