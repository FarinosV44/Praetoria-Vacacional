/**
 * Vitest stub for the `server-only` marker package.
 *
 * `server-only`'s real entrypoint throws on import outside a React Server
 * Component build. Under vitest we exercise those server modules directly
 * (job handlers, sync, the booking service…), so we alias the marker to this
 * no-op — the same thing Next.js does via the `react-server` export condition.
 */
export {};
