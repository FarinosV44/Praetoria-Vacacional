/**
 * Praetoria Vacacional wordmark (creative direction 2026, #99 — route B lockup).
 * Pure typography: "PRAETORIA" set confidently, a hairline, then "VACACIONAL"
 * smaller and tracked. No pictogram — the Praetoria family is recognised by
 * its type, not by an illustrated sun, wave or mountain.
 */
export function Wordmark({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Slightly tighter gap; below 360px the lockup always stacks on two lines. */
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap leading-none max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-1.5 ${compact ? "gap-2" : "gap-3"} ${className}`}
    >
      <span className="text-[1.02rem] font-bold tracking-[0.14em]">PRAETORIA</span>
      <span aria-hidden className="h-3.5 w-px bg-current opacity-45 max-[359px]:hidden" />
      <span className="text-[0.6rem] font-medium tracking-[0.32em] max-[359px]:text-[0.52rem] max-[359px]:tracking-[0.42em]">
        VACACIONAL
      </span>
    </span>
  );
}

/** Square monogram used for the favicon and small marks (concept 1, "P"). */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect width="64" height="64" fill="currentColor" />
      <path d="M22 50V14h13.5c7.7 0 12.5 4.4 12.5 11.2S43.2 36.4 35.5 36.4H29.6V50Z M29.6 30.2h5.3c3.6 0 5.6-1.8 5.6-5s-2-5-5.6-5h-5.3Z" fill="#f7f5f0" fillRule="evenodd" />
    </svg>
  );
}
