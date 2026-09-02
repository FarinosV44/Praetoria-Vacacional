"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { verifyUnsubToken } from "@/domains/marketing/unsubscribe";
import { reportError } from "@/lib/observability/report";

export async function confirmUnsubscribeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("t") ?? "");
  const email = verifyUnsubToken(token);
  if (!email) redirect("/baja");
  try {
    await getRepository().addUnsubscribe(email, "one-click");
  } catch (err) {
    reportError(err, { scope: "marketing/unsubscribe" });
  }
  redirect(`/baja?t=${token}&hecho=1`);
}
