"use client";

/**
 * Last-resort error boundary (issue #42) — used when the root layout itself
 * throws. Must render its own <html>/<body>. No stack trace for the user.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          color: "#222",
          background: "#f4f6fb",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22 }}>Praetoria Vacacional no está disponible ahora mismo</h1>
          <p style={{ color: "#666", maxWidth: 420, margin: "8px auto 20px" }}>
            Estamos teniendo un problema técnico temporal. Vuelve a intentarlo en unos minutos.
          </p>
          <button
            onClick={reset}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 999,
              border: 0,
              background: "#1f3a6b",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
