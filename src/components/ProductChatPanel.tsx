'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/chat';

interface ProductChatPanelProps {
  product: Product;
  onClose: () => void;
  onSendMessage: (message: string) => void;
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

export default function ProductChatPanel({ product, onClose, onSendMessage }: ProductChatPanelProps) {
  const [input, setInput] = useState('');
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const name = getProductName(product);
  const imgSrc = !imgError ? getProductImage(product) : null;
  const price = getProductPrice(product);
  const productId = product.id ?? (product as { product_id?: string }).product_id ?? '';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (message: string) => {
    if (!message.trim()) return;
    // Append ctx tag so backend focuses on this product
    const tagged = productId
      ? `${message.trim()} [ctx:${productId}]`
      : message.trim();
    onSendMessage(tagged);
    setInput('');
    onClose();
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
        {/* Product thumbnail */}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Intro prompt */}
        <div className="rounded-xl bg-[#8C1515]/5 border border-[#8C1515]/15 px-3 py-2.5">
          <p className="text-xs text-black/65 leading-relaxed">
            Ask me anything about <span className="font-semibold text-black">{name}</span>.
            I&apos;ll answer based on its specs, reviews, and how it fits your needs.
          </p>
        </div>

        {/* Quick question chips */}
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
      </div>

      {/* Custom question input */}
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
            disabled={!input.trim()}
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
