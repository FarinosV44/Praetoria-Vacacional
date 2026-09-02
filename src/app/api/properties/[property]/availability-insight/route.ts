import { apiError, apiOk, enforceRateLimit } from "@/lib/api";
import { propertySlugSchema } from "@/lib/validation";
import { getAvailabilityInsight } from "@/domains/booking/service";

// Availability is live data — never prerender it. The property page stays
// static/ISR and fetches this at runtime (issue #49 signal, build-independent).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ property: string }> },
) {
  const limited = await enforceRateLimit(req, "availability-insight", 60, 60_000);
  if (limited) return limited;

  const { property } = await params;
  const slug = propertySlugSchema.safeParse(property);
  if (!slug.success) return apiError("Alojamiento no encontrado", 404);

  try {
    const insight = await getAvailabilityInsight(slug.data);
    if (!insight) return apiError("Alojamiento no encontrado", 404);
    return apiOk(insight, 200);
  } catch (err) {
    // Loud failure — the caller decides what to render (the note hides itself).
    console.error("availability-insight failed", err);
    return apiError("No se pudo calcular la ocupación", 500);
  }
}
