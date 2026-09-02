import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { verifyUnsubToken } from "@/domains/marketing/unsubscribe";
import { reportError } from "@/lib/observability/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issue #73 — RFC-8058 one-click unsubscribe. Mail clients POST here directly;
 * humans following the link get redirected to the confirmation page.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const email = verifyUnsubToken(token);
  if (!email) return new NextResponse("Invalid token", { status: 400 });
  try {
    await getRepository().addUnsubscribe(email, "one-click");
  } catch (err) {
    reportError(err, { scope: "marketing/unsubscribe" });
  }
  return new NextResponse("Unsubscribed", { status: 200 });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/baja?t=${encodeURIComponent(token)}`, req.url));
}
