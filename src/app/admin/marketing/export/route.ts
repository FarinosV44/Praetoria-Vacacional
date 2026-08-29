import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { displayName } from "@/domains/crm/types";

/**
 * CSV export of a segment's contacts (issue #56 §6, §9). requireAdmin — the file
 * is never publicly reachable.
 *   ?segment=<id>&field=email|phone|whatsapp|all
 */
function csvCell(v: string | null | undefined): string {
  const s = (v ?? "").replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL(request.url);
  const segmentId = url.searchParams.get("segment");
  const field = url.searchParams.get("field") ?? "all";
  const repo = getRepository();

  const criteria = segmentId ? ((await repo.getSegment(segmentId))?.criteria ?? {}) : {};
  const members = await repo.segmentMembers(criteria);

  let header: string;
  let rows: string[];
  if (field === "email") {
    header = "email,nombre";
    rows = members.filter((m) => m.email).map((m) => `${csvCell(m.email)},${csvCell(displayName(m))}`);
  } else if (field === "phone" || field === "whatsapp") {
    header = "telefono,nombre";
    rows = members
      .filter((m) => m.phone || m.whatsapp)
      .map((m) => `${csvCell(m.phone ?? m.whatsapp)},${csvCell(displayName(m))}`);
  } else {
    header = "nombre,email,telefono,whatsapp,idioma,pais,gasto_eur,reservas,consentimiento";
    rows = members.map((m) =>
      [
        csvCell(displayName(m)),
        csvCell(m.email),
        csvCell(m.phone),
        csvCell(m.whatsapp),
        csvCell(m.language),
        csvCell(m.country),
        (m.totalSpentCents / 100).toFixed(2),
        String(m.confirmedCount),
        m.marketingConsent ? "si" : "no",
      ].join(","),
    );
  }

  const body = `﻿${[header, ...rows].join("\n")}\n`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="segmento-${segmentId ?? "todos"}-${field}.csv"`,
    },
  });
}
