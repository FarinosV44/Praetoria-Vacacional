"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires one analytics event when mounted. Used on thin pages (e.g. /contacto). */
export function TrackOnMount({
  event,
  params,
}: {
  event: Parameters<typeof track>[0];
  params?: Parameters<typeof track>[1];
}) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
