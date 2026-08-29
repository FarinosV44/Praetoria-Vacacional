"use client";

export function PrintButton({ label = "Descargar / Imprimir PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-[#1f3a6b] px-4 py-2 text-sm font-medium text-white print:hidden"
    >
      {label}
    </button>
  );
}
