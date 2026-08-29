const MAP: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  external: "bg-sky-100 text-sky-800",
};

const LABELS: Record<string, string> = {
  confirmed: "confirmada",
  pending: "pendiente",
  cancelled: "cancelada",
  expired: "caducada",
  external: "externa",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${MAP[status] ?? "bg-gray-100"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
