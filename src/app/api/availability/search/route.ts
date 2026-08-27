import { apiError, apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { searchSchema } from "@/lib/validation";
import { searchAllProperties } from "@/domains/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "search", 30, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, searchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const { checkIn, checkOut, guests } = parsed.data;
    const results = await searchAllProperties(checkIn, checkOut, guests);
    return apiOk({ checkIn, checkOut, guests, results });
  } catch (err) {
    console.error("availability/search failed", err);
    return apiError("No se pudo comprobar la disponibilidad", 500);
  }
}
