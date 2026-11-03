import { describe, expect, it } from "vitest";
import { propertyJsonLd } from "./seo";
import { getAllProperties } from "@/domains/properties/registry";

describe("propertyJsonLd — Google vacation-rental required fields", () => {
  for (const p of getAllProperties()) {
    it(`${p.slug} has identifier, containsPlace with occupancy, image and geo`, () => {
      const j = propertyJsonLd(p, {});
      expect(j["@type"]).toBe("VacationRental");
      expect(j.identifier).toBe(`praetoria-vacacional-${p.slug}`);
      expect(j.containsPlace["@type"]).toBe("Accommodation");
      expect(j.containsPlace.occupancy.value).toBe(p.capacity.guests);
      expect(j.containsPlace.numberOfBedrooms).toBe(p.capacity.bedrooms);
      expect(j.image.length).toBeGreaterThanOrEqual(8);
      expect(j.geo?.latitude).toBeTypeOf("number");
      expect(j.checkinTime).toMatch(/^\d{2}:\d{2}$/);
      expect(j.checkoutTime).toMatch(/^\d{2}:\d{2}$/);
    });
  }
});
