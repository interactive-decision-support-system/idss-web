'use client';

import { Product } from '@/types/chat';

interface SpecRow {
  label: string;
  bestFn?: 'min' | 'max';
  badgeLabel?: string;
  /** Value used for numeric COMPARISON. */
  getVal: (p: Product) => unknown;
  /** Value used for DISPLAY in the cell (falls back to getVal). */
  getDisplayVal?: (p: Product) => unknown;
  format?: (v: unknown) => string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getSpec(p: Product, key: string, altKey?: string): unknown {
  const pd = p as Record<string, unknown>;
  const specs = ((pd.laptop as Record<string, unknown> | undefined)?.specs) as Record<string, unknown> | undefined;
  if (specs?.[key] != null) return specs[key];
  if (altKey && specs?.[altKey] != null) return specs[altKey];
  if (pd[key] != null) return pd[key];
  if (altKey && pd[altKey] != null) return pd[altKey];
  return undefined;
}

function parseNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const tb = v.match(/(\d+(?:\.\d+)?)\s*TB/i);
    if (tb) return parseFloat(tb[1]) * 1024;
    const n = parseFloat(v.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  }
  return null;
}

/** Shorten a CPU string to the essential model name. */
function shortCpu(raw: unknown): string {
  if (raw == null || raw === '') return '—';
  const s = String(raw);
  // "Intel Core i5-13420H Octa-core Processor" → "i5-13420H"
  const coreMatch = s.match(/(?:Intel\s+)?Core\s+(i\d-\S+)/i);
  if (coreMatch) return coreMatch[1];
  // "Apple M3 chip" → "Apple M3"
  const appleMatch = s.match(/(Apple\s+M\d+(?:\s+\w+)?)/i);
  if (appleMatch) return appleMatch[1].replace(/\s+chip.*/i, '');
  // "AMD Ryzen 7 7745HX" → "Ryzen 7 7745HX"
  const ryzenMatch = s.match(/(Ryzen\s+\d+\s+\S+)/i);
  if (ryzenMatch) return ryzenMatch[1];
  // Fallback: first 30 chars
  return s.length > 30 ? s.slice(0, 28) + '…' : s;
}

/** Shorten a GPU string to the essential model + VRAM. */
function shortGpu(raw: unknown): string {
  if (raw == null || raw === '') return '—';
  const s = String(raw);
  // "NVIDIA GeForce RTX 5050 8GB GDDR6" → "RTX 5050 (8GB)"
  const rtxMatch = s.match(/(RTX|GTX)\s*(\d{3,4})(?:\s+Ti)?(?:\s+(\d+GB))?/i);
  if (rtxMatch) {
    const vram = rtxMatch[3] ? ` (${rtxMatch[3]})` : '';
    const ti = s.includes(' Ti') ? ' Ti' : '';
    return `${rtxMatch[1].toUpperCase()} ${rtxMatch[2]}${ti}${vram}`;
  }
  // "AMD Radeon RX 7600M" → "RX 7600M"
  const rxMatch = s.match(/RX\s+(\d{3,4}[A-Z]*)/i);
  if (rxMatch) return `RX ${rxMatch[1]}`;
  // "Intel Iris Xe Graphics" → "Intel Iris Xe"
  const irisMatch = s.match(/(Intel\s+(?:Iris|Arc)\s+\w+)/i);
  if (irisMatch) return irisMatch[1];
  // "Apple M3 GPU" → "Apple M3 GPU"
  const appleGpu = s.match(/(Apple\s+M\d+\s+\d*-?core\s+GPU)/i) || s.match(/(Apple\s+M\d+)/i);
  if (appleGpu) return appleGpu[1];
  return s.length > 28 ? s.slice(0, 26) + '…' : s;
}

/** GPU tier score for comparison (higher = better). */
function gpuTierScore(p: Product): number | null {
  const raw = getSpec(p, 'graphics', 'gpu');
  if (raw == null) return null;
  const s = String(raw);
  const rtx = s.match(/RTX\s*(\d{3,4})/i);
  if (rtx) return 20000 + parseInt(rtx[1]);
  const gtx = s.match(/GTX\s*(\d{3,4})/i);
  if (gtx) return 10000 + parseInt(gtx[1]);
  const rx = s.match(/RX\s*(\d{3,4})/i);
  if (rx) return 5000 + parseInt(rx[1]);
  if (/iris|arc/i.test(s)) return 100;
  if (/apple\s+m/i.test(s)) return 200;
  return null;
}

// ─── spec rows ───────────────────────────────────────────────────────────────

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'Price',
    bestFn: 'min',
    badgeLabel: 'Lowest price',
    getVal: (p) => (p as Record<string, unknown>).price,
    format: (v) => typeof v === 'number' ? `$${(v as number).toLocaleString()}` : '—',
  },
  {
    label: 'Rating',
    bestFn: 'max',
    badgeLabel: 'Best rating',
    getVal: (p) => (p as Record<string, unknown>).rating,
    format: (v) => typeof v === 'number' ? `${(v as number).toFixed(1)} ★` : '—',
  },
  {
    label: 'Brand',
    getVal: (p) => (p as Record<string, unknown>).brand,
  },
  {
    label: 'CPU',
    getVal: (p) => getSpec(p, 'processor', 'cpu'),
    format: shortCpu,
  },
  {
    label: 'RAM',
    bestFn: 'max',
    badgeLabel: 'Most RAM',
    getVal: (p) => getSpec(p, 'ram'),
  },
  {
    label: 'Storage',
    bestFn: 'max',
    badgeLabel: 'Most storage',
    getVal: (p) => getSpec(p, 'storage'),
  },
  {
    label: 'Storage type',
    getVal: (p) => getSpec(p, 'storage_type'),
  },
  {
    label: 'GPU',
    bestFn: 'max',
    badgeLabel: 'Best GPU',
    getVal: gpuTierScore,
    getDisplayVal: (p) => getSpec(p, 'graphics', 'gpu'),
    format: shortGpu,
  },
  {
    label: 'Display',
    getVal: (p) => getSpec(p, 'screen_size', 'display'),
    format: (v) => {
      if (v == null || v === '') return '—';
      const s = String(v);
      const inch = s.match(/^(\d{2}(?:\.\d+)?)[""]?$/);
      if (inch) return `${inch[1]}"`;
      return s.length > 20 ? s.slice(0, 18) + '…' : s;
    },
  },
  {
    label: 'Resolution',
    getVal: (p) => getSpec(p, 'resolution'),
  },
  {
    label: 'Refresh rate',
    bestFn: 'max',
    badgeLabel: 'Smoothest display',
    getVal: (p) => getSpec(p, 'refresh_rate_hz'),
    format: (v) => v != null && v !== '' ? `${v} Hz` : '—',
  },
  {
    label: 'Battery',
    bestFn: 'max',
    badgeLabel: 'Best battery life',
    getVal: (p) => getSpec(p, 'battery_life'),
  },
  {
    label: 'Weight',
    bestFn: 'min',
    badgeLabel: 'Lightest',
    getVal: (p) => getSpec(p, 'weight'),
  },
  {
    label: 'OS',
    getVal: (p) => getSpec(p, 'os', 'operating_system'),
    format: (v) => {
      if (v == null || v === '') return '—';
      const s = String(v);
      return s.replace(/^Windows\s+/, 'Win ').replace(/^macOS\s+/, 'macOS ');
    },
  },
];

// Map user-facing criteria names → SPEC_ROWS label(s)
const CRITERIA_ROW_MAP: Record<string, string[]> = {
  'Price':          ['Price'],
  'Brand':          ['Brand'],
  'RAM':            ['RAM'],
  'Processor / CPU': ['CPU'],
  'Storage':        ['Storage', 'Storage type'],
  'Display size':   ['Display'],
  'Battery life':   ['Battery'],
  'Weight':         ['Weight'],
  'GPU':            ['GPU'],
  'OS':             ['OS'],
  'Resolution':     ['Resolution'],
  'Storage type':   ['Storage type'],
};

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
  bestPickText?: string | null;
  selectedCriteria?: string[];
}

export default function ComparisonSideBySide({ products, bestPickText, selectedCriteria }: Props) {
  if (!products || products.length === 0) return null;

  // Determine which rows to show
  const visibleRows: SpecRow[] = (() => {
    if (!selectedCriteria || selectedCriteria.length === 0) return SPEC_ROWS;
    const allowedLabels = new Set<string>();
    for (const criterion of selectedCriteria) {
      const mapped = CRITERIA_ROW_MAP[criterion];
      if (mapped) mapped.forEach(l => allowedLabels.add(l));
    }
    return SPEC_ROWS.filter(r => allowedLabels.has(r.label));
  })();

  const getBestIdx = (row: SpecRow): number | null => {
    if (!row.bestFn) return null;
    const nums = products.map(p => parseNum(row.getVal(p)));
    if (nums.every(n => n === null)) return null;
    let bestIdx = -1;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === null) continue;
      if (bestIdx === -1) { bestIdx = i; continue; }
      if (row.bestFn === 'min' ? nums[i]! < nums[bestIdx]! : nums[i]! > nums[bestIdx]!) bestIdx = i;
    }
    return bestIdx >= 0 ? bestIdx : null;
  };

  // Per-product "Best for X" badges
  const highlights: string[][] = products.map(() => []);
  visibleRows.forEach(row => {
    if (!row.bestFn) return;
    const best = getBestIdx(row);
    if (best !== null) highlights[best].push(row.badgeLabel ?? row.label);
  });

  // ─── Bullet point summary ────────────────────────────────────────────────
  // Show actual spec values for ALL visible rows (CPU, Storage, GPU, etc.)
  // regardless of whether the row has a bestFn. This ensures "Processor / CPU"
  // and "Storage" criteria always populate, not just comparable (min/max) ones.
  const bullets: Array<{ name: string; parts: string[]; badge: string | null }> = products.map((p, i) => {
    const pd = p as Record<string, unknown>;
    const name = String(pd.name ?? pd.title ?? `Product ${i + 1}`);
    const wins = highlights[i];

    const parts: string[] = [];
    for (const row of visibleRows) {
      // Always use display value (GPU shows name, not tier score)
      const v = row.getDisplayVal ? row.getDisplayVal(p) : row.getVal(p);
      const display = row.format ? row.format(v) : (v != null && v !== '' ? String(v) : null);
      if (display && display !== '—') {
        // Mark winner inline for comparable rows
        const bestIdx = getBestIdx(row);
        const isBest = row.bestFn != null && bestIdx === i;
        parts.push(isBest ? `${row.label}: ${display} ✓` : `${row.label}: ${display}`);
        if (parts.length >= 3) break;
      }
    }

    return {
      name,
      parts,
      badge: wins.length > 0 ? wins[0] : null,
    };
  });

  return (
    <div className="space-y-3">
      {/* Bullet point summary */}
      {bullets.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 space-y-2">
          <p className="text-[11px] font-semibold text-black/40 uppercase tracking-wide mb-2">At a glance</p>
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-black/80">
              <span className="mt-0.5 text-[#8C1515] font-bold shrink-0">•</span>
              <span className="flex-1">
                <span className="font-medium text-black">{b.name}</span>
                {b.badge && (
                  <span className="ml-1.5 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-full">
                    {b.badge}
                  </span>
                )}
                {b.parts.length > 0 && (
                  <span className="text-black/55"> — {b.parts.join(' · ')}</span>
                )}
                {b.parts.length === 0 && !b.badge && (
                  <span className="text-black/40"> — no data available</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Spec table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 shadow-sm">
        <table className="min-w-full text-sm bg-white">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.03]">
              <th className="py-3 px-4 text-left text-[11px] font-semibold text-black/40 uppercase tracking-wide w-28 shrink-0 border-r border-black/5">
                Spec
              </th>
              {products.map((p, i) => {
                const pd = p as Record<string, unknown>;
                const name = (pd.name ?? pd.title ?? `Product ${i + 1}`) as string;
                const badges = highlights[i];
                return (
                  <th key={(p.id as string) || i} className="py-3 px-4 text-left font-semibold text-black leading-snug min-w-[160px] max-w-[220px] align-top">
                    <span className="line-clamp-2 block text-xs">{name}</span>
                    {typeof pd.price === 'number' && (
                      <span className="text-[#8C1515] font-bold text-sm mt-0.5 block">
                        ${(pd.price as number).toLocaleString()}
                      </span>
                    )}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {badges.map(b => (
                          <span key={b} className="inline-flex items-center text-[9px] font-semibold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full leading-none">
                            ✦ {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => {
              const displayVals = products.map(p =>
                row.getDisplayVal ? row.getDisplayVal(p) : row.getVal(p)
              );
              // When user explicitly selected criteria, always show those rows even if
              // all values are missing — display "—" so they know data isn't available.
              // Only silently drop all-empty rows in the unfiltered full-spec table.
              const allEmpty = displayVals.every(v => v == null || v === '');
              if (allEmpty && (!selectedCriteria || selectedCriteria.length === 0)) return null;
              const bestIdx = getBestIdx(row);
              return (
                <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-black/[0.015]'}>
                  <td className="py-2.5 px-4 text-xs font-medium text-black/50 border-r border-black/5 whitespace-nowrap align-top">
                    {row.label}
                  </td>
                  {displayVals.map((v, ci) => {
                    const display = row.format
                      ? row.format(v)
                      : (v != null && v !== '' ? String(v) : '—');
                    const isBest = bestIdx === ci;
                    return (
                      <td
                        key={ci}
                        className={`py-2.5 px-4 text-xs align-top max-w-[220px] ${
                          isBest ? 'font-semibold text-[#166534] bg-green-50/80' : 'text-black/75'
                        }`}
                      >
                        <span className="block leading-snug break-words">{display}</span>
                        {isBest && (
                          <span className="text-[9px] text-green-600 font-normal mt-0.5 block">✓ best</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {bestPickText && (
          <div className="px-4 py-3 bg-[#8C1515]/5 border-t border-black/10 text-sm font-semibold text-black rounded-b-xl">
            {bestPickText}
          </div>
        )}
      </div>
    </div>
  );
}
