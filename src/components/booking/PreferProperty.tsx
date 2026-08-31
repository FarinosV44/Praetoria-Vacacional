"use client";

import { usePreferProperty } from "@/domains/booking/stay";

/** Tells the persistent Booking Bar which property this page is about (issue #89). */
export function PreferProperty({ slug }: { slug: string }) {
  usePreferProperty(slug);
  return null;
}
