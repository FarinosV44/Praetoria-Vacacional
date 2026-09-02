import { apiError, apiOk, enforceRateLimit } from "@/lib/api";
import { propertySlugSchema } from "@/lib/validation";
import { getPropertyCalendar } from "@/domains/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ property: string }> },
) {
  const limited = await enforceRateLimit(req, "calendar", 60, 60_000);
  if (limited) return limited;

  const { property } = await params;
  const slug = propertySlugSchema.safeParse(property);
  if (!slug.success) return apiError("Alojamiento no encontrado", 404);

  try {
    const calendar = await getPropertyCalendar(slug.data);
    if (!calendar) return apiError("Alojamiento no encontrado", 404);
    return apiOk(calendar, 200);
  } catch (err) {
    console.error("calendar failed", err);
    return apiError("No se pudo cargar el calendario", 500);
  }
}
