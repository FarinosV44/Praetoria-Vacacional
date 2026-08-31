/**
 * Content placeholders for async UI (issues #24, #77). `.pv-skeleton` carries a
 * gradient shimmer that respects `prefers-reduced-motion`.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pv-skeleton ${className}`} />;
}

export function SkeletonCalendar() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}

/** Price-breakdown placeholder for the booking widget / checkout summary. */
export function SkeletonQuote() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="flex justify-between border-t border-[var(--color-line)] pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
