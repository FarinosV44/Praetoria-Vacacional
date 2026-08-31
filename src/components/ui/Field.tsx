import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Design-system form controls (issue #77) — `.pv-input` / `.pv-select` /
 * `.pv-textarea` with a consistent label, hint and error slot. Wrap a control in
 * `<Field>` to get the label + spacing; or use the raw classes directly.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="pv-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="pv-error">{error}</p>
      ) : hint ? (
        <p className="pv-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={`pv-input ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={`pv-select ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={`pv-textarea ${className}`} {...props} />;
}
