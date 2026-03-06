'use client';

import { useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Copy-to-clipboard hook
// ---------------------------------------------------------------------------
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copy, copied };
}

// ---------------------------------------------------------------------------
// Code block with copy button
// ---------------------------------------------------------------------------
function CodeBlock({ code, copyKey }: { code: string; copyKey: string }) {
  const { copy, copied } = useCopy();
  return (
    <div className="relative rounded-lg bg-black/90 text-green-400 font-mono text-sm px-4 py-3 pr-20 overflow-x-auto">
      <pre className="whitespace-pre-wrap break-all">{code}</pre>
      <button
        onClick={() => copy(code, copyKey)}
        className="absolute right-3 top-3 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
      >
        {copied === copyKey ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Platform pill
// ---------------------------------------------------------------------------
const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: 'bg-green-500' },
  { id: 'imessage', label: 'iMessage', emoji: '💙', color: 'bg-blue-500' },
  { id: 'telegram', label: 'Telegram', emoji: '✈️', color: 'bg-sky-500' },
  { id: 'discord',  label: 'Discord',  emoji: '🎮', color: 'bg-indigo-500' },
  { id: 'slack',    label: 'Slack',    emoji: '⚡', color: 'bg-yellow-500' },
];

// ---------------------------------------------------------------------------
// Connect page
// ---------------------------------------------------------------------------
export default function ConnectPage() {
  const [activePlatform, setActivePlatform] = useState('whatsapp');
  const [activeOS, setActiveOS] = useState<'mac' | 'windows'>('mac');

  const SKILL_URL = process.env.NEXT_PUBLIC_SKILL_URL || 'https://idss-backend-production.up.railway.app/skill';
  const IDSS_API  = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://idss-backend.onrender.com';

  const installCmd = activeOS === 'mac'
    ? 'curl -fsSL https://openclaw.ai/install.sh | bash'
    : 'winget install openclaw  # or: curl -fsSL https://openclaw.ai/install.sh | bash';

  const connectCmd: Record<string, string> = {
    whatsapp: 'Connect WhatsApp to OpenClaw',
    imessage: 'Connect iMessage to OpenClaw',
    telegram: 'Connect Telegram to OpenClaw',
    discord:  'Connect Discord to OpenClaw',
    slack:    'Connect Slack to OpenClaw',
  };

  const connectDetail: Record<string, string> = {
    whatsapp: 'In your OpenClaw chat, type: "connect whatsapp" — it will show a QR code to scan.',
    imessage: 'On your Mac, OpenClaw connects to iMessage automatically via AppleScript. Type: "connect imessage".',
    telegram: 'Create a Telegram bot via @BotFather, then tell OpenClaw: "connect telegram with token [your-token]".',
    discord:  'Tell OpenClaw: "connect discord with token [your-bot-token]" to link your Discord server.',
    slack:    'Tell OpenClaw: "connect slack with webhook [your-webhook-url]" to post to a Slack channel.',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-black/8 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-[#8C1515] hover:text-[#750013]">
          ← IDSS Shopping
        </Link>
        <a
          href="https://openclaw.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-black/40 hover:text-black/70"
        >
          OpenClaw ↗
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8C1515]/8 border border-[#8C1515]/20 text-xs font-semibold text-[#8C1515] mb-6">
          🦞 Powered by OpenClaw
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          Use IDSS from any<br />
          <span className="text-[#8C1515]">messaging app</span>
        </h1>

        <p className="text-base text-black/55 max-w-xl mx-auto mb-8 leading-relaxed">
          Connect IDSS to WhatsApp, iMessage, Telegram and more via OpenClaw.
          Ask for product recommendations, compare laptops, and find eBay deals —
          all without opening a browser.
        </p>

        {/* Platform pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activePlatform === p.id
                  ? 'border-[#8C1515] bg-[#8C1515]/8 text-[#8C1515]'
                  : 'border-black/15 text-black/60 hover:border-black/30'
              }`}
            >
              <span>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-2xl mx-auto px-6 pb-16 space-y-8">

        {/* Step 1 — Install OpenClaw */}
        <div className="rounded-xl border border-black/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#8C1515] text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="text-base font-semibold text-gray-900">Install OpenClaw on your computer</h2>
          </div>
          <p className="text-sm text-black/55 pl-10">
            OpenClaw runs on your machine — Mac, Windows, or Linux. It&apos;s open source and free.
          </p>

          {/* OS tabs */}
          <div className="pl-10 flex gap-2">
            {(['mac', 'windows'] as const).map(os => (
              <button
                key={os}
                onClick={() => setActiveOS(os)}
                className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                  activeOS === os
                    ? 'border-[#8C1515] bg-[#8C1515]/8 text-[#8C1515]'
                    : 'border-black/15 text-black/50 hover:border-black/25'
                }`}
              >
                {os === 'mac' ? 'macOS / Linux' : 'Windows'}
              </button>
            ))}
          </div>
          <div className="pl-10">
            <CodeBlock code={installCmd} copyKey="install" />
          </div>
          <p className="text-xs text-black/40 pl-10">
            Or visit{' '}
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer"
               className="underline hover:text-black/70">openclaw.ai</a>
            {' '}for GUI installers and detailed setup instructions.
          </p>
        </div>

        {/* Step 2 — Connect messaging app */}
        <div className="rounded-xl border border-black/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#8C1515] text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
            <h2 className="text-base font-semibold text-gray-900">
              Connect{' '}
              {PLATFORMS.find(p => p.id === activePlatform)?.label}
            </h2>
          </div>
          <p className="text-sm text-black/55 pl-10">{connectDetail[activePlatform]}</p>
          <div className="pl-10">
            <CodeBlock code={connectCmd[activePlatform]} copyKey="connect" />
          </div>
          <p className="text-xs text-black/40 pl-10">
            OpenClaw supports 12+ messaging platforms.{' '}
            <a href="https://docs.openclaw.ai/channels" target="_blank" rel="noopener noreferrer"
               className="underline hover:text-black/70">Full list →</a>
          </p>
        </div>

        {/* Step 3 — Install IDSS skill */}
        <div className="rounded-xl border border-black/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#8C1515] text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
            <h2 className="text-base font-semibold text-gray-900">Install the IDSS Shopping skill</h2>
          </div>
          <p className="text-sm text-black/55 pl-10">
            Inside your OpenClaw chat, paste this command to install the IDSS shopping skill.
            It connects OpenClaw to our AI product database.
          </p>
          <div className="pl-10 space-y-3">
            <CodeBlock
              code={`Install this skill from URL: ${SKILL_URL}`}
              copyKey="skill-install"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-black/40">Or download the file directly:</span>
              <a
                href="/api/skill"
                download="idss-shopping.js"
                className="text-xs font-medium text-[#8C1515] hover:text-[#750013] underline"
              >
                idss-shopping.js ↓
              </a>
            </div>
          </div>
          <div className="pl-10 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> The skill needs the API URL for our backend. Tell OpenClaw:<br />
              <span className="font-mono">&quot;Set IDSS_API_URL to {IDSS_API}&quot;</span>
            </p>
          </div>
        </div>

        {/* Step 4 — Try it */}
        <div className="rounded-xl border border-black/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#8C1515] text-white text-sm font-bold flex items-center justify-center shrink-0">4</span>
            <h2 className="text-base font-semibold text-gray-900">Start shopping via {PLATFORMS.find(p => p.id === activePlatform)?.label}</h2>
          </div>
          <p className="text-sm text-black/55 pl-10">
            Send any of these messages from your connected app:
          </p>
          <div className="pl-10 space-y-2">
            {[
              'find me a gaming laptop under $900',
              'compare MacBook Air vs Dell XPS 13 for ML work',
              'I need a laptop for coding, 16GB RAM, light weight',
              'ebay MacBook Pro M3 — show me the best deals',
              'which has better battery life, these two?',
            ].map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#8C1515] font-bold text-xs mt-0.5 shrink-0">→</span>
                <code className="text-xs text-black/70 font-mono bg-black/5 px-2 py-0.5 rounded">
                  {msg}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-black/40 pl-10">
            The AI remembers your conversation for 24 hours. Say <em>&ldquo;reset shopping&rdquo;</em> to start fresh.
          </p>
        </div>

        {/* eBay section */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h3 className="text-sm font-semibold text-amber-900">eBay deal finding</h3>
          </div>
          <p className="text-sm text-amber-800">
            Say <strong>&ldquo;ebay [product]&rdquo;</strong> and OpenClaw will search eBay for live listings —
            price, condition, shipping, and seller rating.
          </p>
          <p className="text-sm text-amber-800">
            To watch a listing and get alerts when the price drops, tell OpenClaw:<br />
            <em className="font-mono text-xs">&ldquo;Watch eBay for MacBook Pro M3 and alert me under $1,200&rdquo;</em>
          </p>
          <p className="text-xs text-amber-700">
            For making offers on eBay on your behalf, store your eBay credentials securely in OpenClaw:
            <em> &ldquo;Remember my eBay username is X&rdquo;</em>
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wider">FAQ</h3>
          {[
            {
              q: 'Is my data private?',
              a: 'OpenClaw runs on your own machine — your messages and credentials never pass through our servers unless you explicitly send a shopping query. We only receive the text of your product questions.',
            },
            {
              q: 'Does this cost anything?',
              a: 'OpenClaw itself is free and open source. IDSS is free during beta. You need your own Claude/OpenAI subscription for OpenClaw\'s AI (or use a local model).',
            },
            {
              q: 'Which messaging apps work?',
              a: 'WhatsApp, iMessage, Telegram, Discord, Slack, Signal, and more. See the OpenClaw integrations page for the full list.',
            },
            {
              q: 'Can I use this on my phone?',
              a: 'Yes — OpenClaw runs on your computer but you interact via your phone\'s messaging app. Send a WhatsApp message from your phone, get an AI reply instantly.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-black/8 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-sm text-black/55">{a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 text-center px-5 py-3 rounded-xl bg-[#8C1515] text-white text-sm font-semibold hover:bg-[#750013] transition-colors"
          >
            Try IDSS in the browser →
          </Link>
          <a
            href="https://openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-5 py-3 rounded-xl border border-black/20 text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
          >
            Get OpenClaw ↗
          </a>
        </div>
      </section>
    </div>
  );
}
