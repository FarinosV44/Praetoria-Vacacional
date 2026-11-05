"use client";

import { useEffect } from "react";

/** The draft WebMCP API (navigator.modelContext); only some browsers have it. */
interface ModelContext {
  registerTool(tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: { readOnlyHint?: boolean };
    execute(input: unknown): Promise<{ content: { type: "text"; text: string }[] }>;
  }): void;
}

let registered = false;

/**
 * Lets in-browser AI agents check availability with the same public, rate-limited
 * endpoint as the search form. Read-only by design: it never starts a booking.
 */
export function WebMcpTools() {
  useEffect(() => {
    const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!modelContext || registered) return;
    registered = true;

    try {
      modelContext.registerTool({
        name: "search_availability",
        description:
          "Comprueba qué apartamentos de Praetoria Vacacional están libres para unas fechas y un número de personas, con su precio. Check which apartments are available for given dates and guests, with prices.",
        inputSchema: {
          type: "object",
          properties: {
            checkIn: { type: "string", format: "date", description: "Entrada (YYYY-MM-DD)" },
            checkOut: { type: "string", format: "date", description: "Salida (YYYY-MM-DD)" },
            guests: { type: "integer", minimum: 1, description: "Número de personas" },
          },
          required: ["checkIn", "checkOut", "guests"],
        },
        annotations: { readOnlyHint: true },
        async execute(input) {
          const res = await fetch("/api/availability/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          return { content: [{ type: "text", text: await res.text() }] };
        },
      });
    } catch (err) {
      // The API is still a draft: a change in it must never affect the page.
      console.warn("WebMCP registration failed", err);
    }
  }, []);

  return null;
}
