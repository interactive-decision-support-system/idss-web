'use client';

/**
 * LoadingSkeleton — replaces the plain "Analyzing your request..." text with
 * a visual skeleton that (a) communicates progress via Nielsen H1 (Visibility
 * of System Status), (b) sets expectations about the shape of the response,
 * and (c) provides a cancel button for Nielsen H3 (User Control & Freedom).
 */
interface LoadingSkeletonProps {
  phase: number;
  phases: string[];
  onCancel?: () => void;
}

export default function LoadingSkeleton({ phase, phases, onCancel }: LoadingSkeletonProps) {
  const label = phases[Math.min(phase, phases.length - 1)];
  const progress = Math.min(((phase + 1) / phases.length) * 100, 95);

  return (
    <div className="space-y-4 max-w-4xl" role="status" aria-live="polite" aria-label={label}>
      {/* Phase label + cancel */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8C1515] animate-pulse" />
          <span className="text-sm text-black/60 font-medium">{label}</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-black/40 hover:text-[#8C1515] transition-colors px-2 py-1 rounded border border-transparent hover:border-black/15"
            aria-label="Cancel request"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-black/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#8C1515]/60 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skeleton cards mimicking recommendation layout */}
      <div className="space-y-3">
        {/* Hero skeleton */}
        <div className="rounded-xl border border-black/8 p-4 flex gap-4">
          <div className="skeleton w-28 h-28 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-5 w-1/3" />
            <div className="flex gap-2 mt-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border border-black/5 p-3 space-y-2">
              <div className="skeleton aspect-video rounded-lg" />
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-4 w-1/3" />
              <div className="flex gap-1">
                <div className="skeleton h-3 w-12 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
