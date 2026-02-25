'use client';

import { Product } from '@/types/chat';

interface SpecRow {
  label: string;
  bestFn?: 'min' | 'max';
  getVal: (p: Product) => unknown;
  format?: (v: unknown) => string;
}

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
    const n = parseFloat(v.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  }
  return null;
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'Price',
    bestFn: 'min',
    getVal: (p) => (p as Record<string, unknown>).price,
    format: (v) => typeof v === 'number' ? `$${(v as number).toLocaleString()}` : '—',
  },
  {
    label: 'Rating',
    bestFn: 'max',
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
  },
  {
    label: 'RAM',
    bestFn: 'max',
    getVal: (p) => getSpec(p, 'ram'),
  },
  {
    label: 'Storage',
    getVal: (p) => getSpec(p, 'storage'),
  },
  {
    label: 'Storage Type',
    getVal: (p) => getSpec(p, 'storage_type'),
  },
  {
    label: 'GPU',
    getVal: (p) => getSpec(p, 'graphics', 'gpu'),
  },
  {
    label: 'Display',
    getVal: (p) => getSpec(p, 'screen_size', 'display'),
  },
  {
    label: 'Battery',
    bestFn: 'max',
    getVal: (p) => getSpec(p, 'battery_life'),
  },
  {
    label: 'OS',
    getVal: (p) => getSpec(p, 'os', 'operating_system'),
  },
  {
    label: 'Weight',
    getVal: (p) => getSpec(p, 'weight'),
  },
];

interface Props {
  products: Product[];
  bestPickText?: string | null;
}

export default function ComparisonSideBySide({ products, bestPickText }: Props) {
  if (!products || products.length === 0) return null;

  const getBestIdx = (row: SpecRow): number | null => {
    if (!row.bestFn) return null;
    const nums = products.map(p => parseNum(row.getVal(p)));
    if (nums.every(n => n === null)) return null;
    let bestIdx = -1;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === null) continue;
      if (bestIdx === -1) { bestIdx = i; continue; }
      if (row.bestFn === 'min' ? nums[i]! < nums[bestIdx]! : nums[i]! > nums[bestIdx]!) {
        bestIdx = i;
      }
    }
    return bestIdx >= 0 ? bestIdx : null;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 mt-2 shadow-sm">
      <table className="min-w-full text-sm bg-white">
        <thead>
          <tr className="border-b border-black/10 bg-black/[0.03]">
            <th className="py-3 px-4 text-left text-[11px] font-semibold text-black/40 uppercase tracking-wide w-28 shrink-0 border-r border-black/5">
              Spec
            </th>
            {products.map((p, i) => {
              const pd = p as Record<string, unknown>;
              const name = pd.name as string || pd.title as string || `Product ${i + 1}`;
              return (
                <th key={p.id || i} className="py-3 px-4 text-left font-semibold text-black leading-snug min-w-[160px]">
                  <span className="line-clamp-2 block text-xs">{name}</span>
                  {typeof pd.price === 'number' && (
                    <span className="text-[#8C1515] font-bold text-sm mt-0.5 block">
                      ${(pd.price as number).toLocaleString()}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SPEC_ROWS.map((row, ri) => {
            const values = products.map(p => row.getVal(p));
            if (values.every(v => v == null || v === '')) return null;
            const bestIdx = getBestIdx(row);
            return (
              <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-black/[0.015]'}>
                <td className="py-2.5 px-4 text-xs font-medium text-black/50 border-r border-black/5 whitespace-nowrap">
                  {row.label}
                </td>
                {values.map((v, ci) => {
                  const display = row.format
                    ? row.format(v)
                    : (v != null && v !== '' ? String(v) : '—');
                  const isBest = bestIdx === ci;
                  return (
                    <td
                      key={ci}
                      className={`py-2.5 px-4 text-sm ${
                        isBest ? 'font-semibold text-[#166534] bg-green-50/80' : 'text-black/75'
                      }`}
                    >
                      {display}
                      {isBest && <span className="ml-1.5 text-[10px] text-green-600 font-normal">✓ best</span>}
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
  );
}
