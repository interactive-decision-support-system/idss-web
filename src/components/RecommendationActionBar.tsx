'use client';

import { useState } from 'react';
import { Product } from '@/types/chat';

interface RecommendationActionBarProps {
  products: Product[];
  onSendMessage: (message: string) => void;
}

const COMPARE_CRITERIA = [
  'Price', 'Brand', 'RAM', 'Processor / CPU', 'Storage', 'Display size',
  'Battery life', 'Weight', 'GPU', 'OS', 'Resolution', 'Storage type',
];

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={`w-7 h-7 transition-colors ${filled ? 'text-yellow-400' : 'text-black/20'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.462a1 1 0 00-.364 1.118l1.286 3.974c.3.921-.755 1.688-1.538 1.118l-3.388-2.462a1 1 0 00-1.175 0l-3.388 2.462c-.783.57-1.838-.197-1.538-1.118l1.286-3.974a1 1 0 00-.364-1.118L2.049 9.401c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function RecommendationActionBar({ products, onSendMessage }: RecommendationActionBarProps) {
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [showCompare, setShowCompare] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

  const getProductName = (p: Product) => {
    return (p as { name?: string }).name ?? (p as { title?: string }).title ?? 'Product';
  };

  const handleRatingSubmit = () => {
    const starLabel = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][ratingValue] ?? '';
    const summary = `[Feedback] Rating: ${ratingValue}/5 (${starLabel})${feedbackText.trim() ? ` — "${feedbackText.trim()}"` : ''}`;
    console.log(summary);
    setRatingSubmitted(true);
  };

  const handleCompare = () => {
    if (selectedProductIds.length < 2 || selectedCriteria.length === 0) return;
    const names = selectedProductIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean)
      .map(p => getProductName(p!));
    const msg = `Compare ${names.join(' vs ')} by ${selectedCriteria.join(', ')}`;
    onSendMessage(msg);
    setShowCompare(false);
    setSelectedProductIds([]);
    setSelectedCriteria([]);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCriteria = (c: string) => {
    setSelectedCriteria(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Section header — makes the bar easy to spot */}
      <div className="flex items-center gap-2 pt-1 pb-0.5 border-t border-black/10">
        <span className="text-xs font-semibold text-black/40 uppercase tracking-wider">Explore your options</span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSendMessage('Show me similar items based on brand and price range')}
          className="px-3 py-1.5 text-sm rounded-lg border border-black/20 bg-white hover:bg-black/5 text-black/80 font-medium transition-colors"
          title="Find items with similar brand and price"
        >
          See similar items
          <span className="text-xs text-black/40 ml-1">(brand, price)</span>
        </button>

        <button
          onClick={() => onSendMessage('Tell me more about these products — what are the pros and cons of each?')}
          className="px-3 py-1.5 text-sm rounded-lg border border-black/20 bg-white hover:bg-black/5 text-black/80 font-medium transition-colors"
        >
          Research
        </button>

        <button
          onClick={() => { setShowCompare(!showCompare); setShowRating(false); }}
          className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${showCompare ? 'border-[#8C1515] bg-[#8C1515]/5 text-[#8C1515]' : 'border-black/20 bg-white hover:bg-black/5 text-black/80'}`}
        >
          Compare items
        </button>

        <button
          onClick={() => {
            const next = !showRating;
            setShowRating(next);
            setShowCompare(false);
            // Reset rating state when opening so user can always re-rate
            if (next) { setRatingValue(0); setFeedbackText(''); setRatingSubmitted(false); }
          }}
          className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${showRating ? 'border-[#8C1515] bg-[#8C1515]/5 text-[#8C1515]' : 'border-black/20 bg-white hover:bg-black/5 text-black/80'}`}
        >
          Rate recommendations
        </button>

        <button
          onClick={() => onSendMessage('Get best value laptop — considering price, performance, and quality')}
          className="px-3 py-1.5 text-sm rounded-lg border border-black/20 bg-white hover:bg-black/5 text-black/80 font-medium transition-colors"
          title="Best value by price, GPU performance, and build quality"
        >
          Get best value
          <span className="text-xs text-black/40 ml-1">(price, GPU, quality)</span>
        </button>

        <button
          onClick={() => onSendMessage('Refine my search')}
          className="px-3 py-1.5 text-sm rounded-lg border border-black/20 bg-white hover:bg-black/5 text-black/80 font-medium transition-colors"
        >
          Refine search
        </button>
      </div>

      {/* Rating Survey Panel */}
      {showRating && (
        <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3 shadow-sm">
          <h4 className="font-semibold text-sm text-black">Rate these recommendations</h4>
          {ratingSubmitted ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium py-2">Thanks for your feedback!</span>
              <button
                onClick={() => { setShowRating(false); setRatingSubmitted(false); setRatingValue(0); setFeedbackText(''); }}
                className="text-xs text-black/40 hover:text-black/70 transition-colors px-2 py-1"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-black/60 mb-2">How well did the AI match your needs? (1–5 stars)</p>
                <StarRatingInput value={ratingValue} onChange={setRatingValue} />
              </div>
              <div>
                <p className="text-xs text-black/60 mb-1.5">Comments, requests, or suggestions (optional)</p>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="e.g. I wanted something lighter, or more focused on battery life..."
                  rows={3}
                  className="w-full text-sm border border-black/15 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#8C1515]/40 text-black placeholder:text-black/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRatingSubmit}
                  disabled={ratingValue === 0}
                  className="px-4 py-1.5 text-sm rounded-lg bg-[#8C1515] text-white font-medium hover:bg-[#750013] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => { setShowRating(false); setRatingValue(0); setFeedbackText(''); setRatingSubmitted(false); }}
                  className="px-4 py-1.5 text-sm rounded-lg border border-black/15 text-black/60 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compare Dialog Panel */}
      {showCompare && (
        <div className="rounded-xl border border-black/10 bg-white p-4 space-y-4 shadow-sm">
          <h4 className="font-semibold text-sm text-black">Compare items</h4>

          {/* Product selection */}
          <div>
            <p className="text-xs text-black/60 mb-2">Which products do you want to compare? (select 2+)</p>
            <div className="space-y-1.5">
              {products.slice(0, 6).map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="w-4 h-4 accent-[#8C1515] rounded"
                  />
                  <span className="text-sm text-black/80 truncate">{getProductName(p)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Criteria selection */}
          <div>
            <p className="text-xs text-black/60 mb-2">Compare by what criteria? (select 1+)</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPARE_CRITERIA.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCriteria(c)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedCriteria.includes(c) ? 'border-[#8C1515] bg-[#8C1515]/10 text-[#8C1515] font-medium' : 'border-black/15 text-black/60 hover:border-black/30'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCompare}
              disabled={selectedProductIds.length < 2 || selectedCriteria.length === 0}
              className="px-4 py-1.5 text-sm rounded-lg bg-[#8C1515] text-white font-medium hover:bg-[#750013] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Compare
            </button>
            <button
              onClick={() => { setShowCompare(false); setSelectedProductIds([]); setSelectedCriteria([]); }}
              className="px-4 py-1.5 text-sm rounded-lg border border-black/15 text-black/60 hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
