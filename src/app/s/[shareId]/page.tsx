'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import IDSSLogo from '@/components/IDSSLogo';

interface SharedMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface SharedChat {
  title: string;
  messages: SharedMessage[];
  created_at: string;
}

export default function SharedChatPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [chat, setChat] = useState<SharedChat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/share/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: SharedChat) => setChat(data))
      .catch(() => setError('This shared chat could not be found or has expired.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Header */}
      <header className="border-b border-black/8 bg-white px-6 py-3 flex items-center gap-3">
        <IDSSLogo size={28} />
        <div>
          <p className="text-sm font-bold text-black leading-none">IDSS</p>
          <p className="text-[10px] text-black/40 leading-none mt-0.5">Stanford LDR Lab · Shared Chat</p>
        </div>
        <div className="ml-auto">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-lg bg-[#8C1515] text-white font-medium hover:bg-[#750013] transition-colors"
          >
            Try IDSS →
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-black/40">
            <div className="flex gap-1">
              {[0, 0.1, 0.2].map((delay, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#8C1515] animate-bounce"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-black/50 text-sm">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#8C1515] font-medium hover:underline">
              Start a new chat
            </Link>
          </div>
        )}

        {chat && (
          <div className="space-y-6">
            {/* Chat title + meta */}
            <div className="border-b border-black/8 pb-4">
              <h1 className="text-lg font-semibold text-black">{chat.title}</h1>
              <p className="text-xs text-black/40 mt-1">
                Shared on {new Date(chat.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Messages */}
            {chat.messages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#8C1515] text-white rounded-br-sm'
                        : 'bg-white border border-black/10 text-black rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

            {/* CTA */}
            <div className="pt-4 text-center border-t border-black/8">
              <p className="text-xs text-black/40 mb-3">Want personalized recommendations?</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8C1515] text-white text-sm font-medium hover:bg-[#750013] transition-colors"
              >
                Start your own chat →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
