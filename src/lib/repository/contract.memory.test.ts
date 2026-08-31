import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllProperties } from "@/domains/properties/registry";
import { runRepositoryContract } from "./contract";
import type { Repository } from "./types";

/**
 * Issue #83 — the shared repository contract, run against the in-memory store,
 * plus a static parity check so a method can never exist on one implementation
 * and not the other (TypeScript already enforces the interface; this catches an
 * accidental `as any` or a stray extra method).
 */

describe("repository contract · memoryRepository", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
  });

  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
  });

  runRepositoryContract(async () => {
    delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
    const mod = await import("./memory");
    const repo = mod.memoryRepository as Repository;
    const first = getAllProperties()[0];
    if (!first) throw new Error("no seeded property");
    const propertyId = first.id;
    return {
      repo,
      propertyId,
      makeHoldStale: () => {
        // every live hold expires within holdMinutes; jump the clock past it
        vi.useFakeTimers();
        vi.setSystemTime(new Date(Date.now() + 60 * 60_000));
      },
    };
  });
});

describe("repository parity", () => {
  it("memory and supabase expose exactly the same method surface", async () => {
    const { memoryRepository } = await import("./memory");
    const { supabaseRepository } = await import("./supabase");

    const keys = (o: object) =>
      [...Object.keys(o)].filter((k) => typeof (o as Record<string, unknown>)[k] === "function").sort();

    const mem = keys(memoryRepository);
    const sup = keys(supabaseRepository);

    expect(sup.filter((k) => !mem.includes(k))).toEqual([]);
    expect(mem.filter((k) => !sup.includes(k))).toEqual([]);
  });
});
