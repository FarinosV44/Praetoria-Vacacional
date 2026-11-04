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
