"use client";

/**
 * Issue #66 — browser-side error reporting. Best-effort `sendBeacon`/`fetch` to
 * the server sink; never throws, never blocks rendering.
 */
export function reportClientError(
  error: Error & { digest?: string },
  boundary: "route" | "global",
) {
  try {
    const payload = JSON.stringify({
      message: String(error?.message ?? error).slice(0, 500),
      digest: error?.digest,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      boundary,
    });
    const url = "/api/observability/client-error";
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      void fetch(url, { method: "POST", body: payload, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    // swallow
  }
}
