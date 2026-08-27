import { apiError, apiOk, enforceRateLimit, parseJson } from "@/lib/api";
import { quoteSchema } from "@/lib/validation";
import { checkProperty } from "@/domains/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "quote", 60, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(req, quoteSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const { property, checkIn, checkOut, guests } = parsed.data;
    const result = await checkProperty(property, checkIn, checkOut, guests);
    return apiOk(result);
  } catch (err) {
    console.error("quote failed", err);
    return apiError("No se pudo calcular el precio", 500);
  }
}
