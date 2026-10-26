import { describe, expect, it } from "vitest";
import { currentInternalPath } from "./legacy-paths";
import { renderMarkdown } from "@/domains/blog/markdown";

describe("currentInternalPath", () => {
  it("maps the old guide URLs to the hubs", () => {
    expect(currentInternalPath("/guias/valencia/guia-playas-de-valencia")).toBe("/guias/valencia-playa");
    expect(currentInternalPath("/guias/javalambre/guia-de-javalambre")).toBe("/guias/javalambre");
    expect(currentInternalPath("/guias/valencia/restaurantes-y-ocio-cerca-de-la-playa-valencia#x")).toBe(
      "/guias/valencia-playa/restaurantes-y-ocio-cerca-de-la-playa-valencia#x",
    );
  });
  it("leaves current URLs alone", () => {
    expect(currentInternalPath("/guias/valencia-playa/guia-playas-de-valencia")).toBe(
      "/guias/valencia-playa/guia-playas-de-valencia",
    );
    expect(currentInternalPath("/javalambre")).toBe("/javalambre");
  });
  it("is applied to links in blog markdown", () => {
    expect(renderMarkdown("[guía](/guias/javalambre/guia-de-javalambre)")).toContain('href="/guias/javalambre"');
  });
});
