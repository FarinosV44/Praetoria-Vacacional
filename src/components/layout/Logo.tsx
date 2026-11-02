/**
 * Praetoria Vacacional logo (owner artwork, November 2026). The lockup —
 * terracotta "PRAETORIA" with the arch-and-horizon A, "VACACIONAL" tracked
 * below — is served as a traced vector from /public so it stays crisp at any
 * size: logo.svg for light backgrounds, logo-dark.svg for the ink footer.
 */
const RATIO = 3370 / 648;

export function Wordmark({
  className = "h-9 sm:h-10",
  tone = "light",
}: {
  /** Height utilities; the width follows the logo's aspect ratio. */
  className?: string;
  /** "light" for paper backgrounds, "dark" for ink backgrounds. */
  tone?: "light" | "dark";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      src={tone === "dark" ? "/logo-dark.svg" : "/logo.svg"}
      alt="Praetoria Vacacional"
      width={Math.round(40 * RATIO)}
      height={40}
      decoding="async"
      fetchPriority={tone === "light" ? "high" : "auto"}
      className={`block w-auto max-w-full ${className}`}
    />
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
