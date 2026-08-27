import { describe, expect, it } from "vitest";
import { applyGuideOverride, guideOverrideSchema } from "./merge";
import { guides } from "./index";

const sample = guides.find((g) => !g.pillar)!;

describe("applyGuideOverride", () => {
  it("keeps base fields when there is no override", () => {
    const out = applyGuideOverride(sample, undefined, 3);
    expect(out.title).toBe(sample.title);
    expect(out.published).toBe(sample.published);
    expect(out.order).toBe(3);
  });

  it("applies title/description/lead overrides", () => {
    const out = applyGuideOverride(sample, { title: "T", description: "D".repeat(20), lead: "L".repeat(20) }, 0);
    expect(out.title).toBe("T");
    expect(out.description).toBe("D".repeat(20));
  });

  it("draft status unpublishes and published status publishes", () => {
    expect(applyGuideOverride(sample, { status: "draft" }, 0).published).toBe(false);
    expect(applyGuideOverride({ ...sample, published: false }, { status: "published" }, 0).published).toBe(
      true,
    );
  });

  it("uses the override order over the index", () => {
    expect(applyGuideOverride(sample, { order: 9 }, 2).order).toBe(9);
  });

  it("rejects an invalid status and a too-short title", () => {
    expect(guideOverrideSchema.safeParse({ status: "live" }).success).toBe(false);
    expect(guideOverrideSchema.safeParse({ title: "ab" }).success).toBe(false);
  });
});
