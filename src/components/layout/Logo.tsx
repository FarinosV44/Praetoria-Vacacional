export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.1" />
      <path
        d="M12 44 L26 20 L34 34 L40 26 L52 44 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M10 46 q 8 -6 16 0 t 16 0 t 16 0"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
