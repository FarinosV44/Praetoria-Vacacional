import "server-only";
import { getRepository } from "@/lib/repository";
import type { OwnerLead, OwnerLeadStatus } from "./types";

const PREFIX = "lead:owner:";

function isLead(v: unknown): v is OwnerLead {
  const o = v as OwnerLead | null;
  return !!o && typeof o.id === "string" && typeof o.name === "string" && typeof o.createdAt === "string";
}

export async function saveOwnerLead(lead: OwnerLead): Promise<void> {
  await getRepository().setContentOverride(`${PREFIX}${lead.id}`, lead);
}

/** Newest first. */
export async function listOwnerLeads(): Promise<OwnerLead[]> {
  const rows = await getRepository().listContentOverrides(PREFIX);
  return rows
    .map((r) => r.value)
    .filter(isLead)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setOwnerLeadStatus(id: string, status: OwnerLeadStatus): Promise<void> {
  const row = await getRepository().getContentOverride(`${PREFIX}${id}`);
  if (!row || !isLead(row.value)) return;
  await saveOwnerLead({ ...row.value, status });
}
