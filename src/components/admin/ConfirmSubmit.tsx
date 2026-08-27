"use client";

/** Submit button that asks for confirmation before a destructive action (issue #13). */
export function ConfirmSubmit({
  children,
  message,
  className = "text-xs text-red-600 hover:underline",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
