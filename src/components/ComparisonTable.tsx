import React, { useState } from 'react';
import { Product } from '@/types/chat';

interface ComparisonTableProps {
  products: Product[];
}

const columns = [
  { key: 'brand', label: 'Brand' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
];

export default function ComparisonTable({ products }: ComparisonTableProps) {
  const [sortKey, setSortKey] = useState<string>('price');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const sorted = [...products].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="overflow-x-auto">
  <table className="min-w-full border border-[var(--color-border)] rounded-xl bg-white text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg)] cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                tabIndex={0}
                onClick={() => {
                  if (sortKey === col.key) setSortAsc((asc) => !asc);
                  else {
                    setSortKey(col.key);
                    setSortAsc(true);
                  }
                }}
                aria-sort={sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : undefined}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-[var(--color-accent)]">
                    {sortAsc ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((product, idx) => (
            <tr
              key={product.id}
              className={
                idx % 2 === 0
                  ? 'bg-white'
                  : 'bg-[var(--color-bg)]'
              }
              tabIndex={0}
            >
              <td className="py-3 px-4 text-[var(--color-text-main)]">
                {(product as { brand?: string }).brand ?? '—'}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-main)]">
                {typeof (product as { price?: number }).price === 'number'
                  ? `$${(product as { price?: number }).price!.toLocaleString()}`
                  : '—'}
              </td>
              <td className="py-3 px-4 text-[var(--color-text-main)]">
                {typeof (product as { rating?: number }).rating === 'number'
                  ? `${(product as { rating?: number }).rating} ★`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
