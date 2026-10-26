import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Admin phone notifications: subscription storage, VAPID key bootstrap and the
 * send loop (pruning devices the push service says are gone). The network call
 * itself is mocked — `web-push` owns the encryption.
 */

const { sendNotification } = vi.hoisted(() => ({ sendNotification: vi.fn() }));
vi.mock("web-push", () => ({
  default: {
    sendNotification,
    generateVAPIDKeys: () => ({ publicKey: "BPUBLICKEY_generated", privateKey: "private_generated" }),
  },
}));

async function freshPush() {
  vi.resetModules();
  delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
  return import("./push");
}

const SUB = (n: number) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/device-${n}-abcdefghij`,
  keys: { p256dh: "B".padEnd(87, "x"), auth: "authsecret123456" },
});

beforeEach(() => sendNotification.mockReset());
afterEach(() => {
  vi.resetModules();
  delete (globalThis as unknown as { __pvStore?: unknown }).__pvStore;
});

describe("push subscriptions", () => {
  it("validates what the browser sends", async () => {
    const { parseSubscription } = await freshPush();
    expect(parseSubscription(SUB(1))).toEqual(SUB(1));
    expect(parseSubscription({ ...SUB(1), endpoint: "http://insecure.example/x" })).toBeNull();
    expect(parseSubscription({ endpoint: SUB(1).endpoint })).toBeNull();
    expect(parseSubscription("nope")).toBeNull();
  });

  it("stores one entry per device and removes it again", async () => {
    const { saveSubscription, listSubscriptions, removeSubscription } = await freshPush();
    await saveSubscription(SUB(1), "iPhone · Safari");
    await saveSubscription(SUB(1), "iPhone · Safari"); // same device twice → one row
    await saveSubscription(SUB(2), "Android · Chrome");
    expect((await listSubscriptions()).map((s) => s.label).sort()).toEqual(["Android · Chrome", "iPhone · Safari"]);
    await removeSubscription(SUB(1).endpoint);
    expect(await listSubscriptions()).toHaveLength(1);
  });

  it("generates the VAPID pair once and reuses it", async () => {
    const { getVapidKeys } = await freshPush();
    const a = await getVapidKeys();
    const b = await getVapidKeys();
    expect(a.publicKey).toBe("BPUBLICKEY_generated");
    expect(b).toEqual(a);
  });
});

describe("sendPushToAdmins", () => {
  it("does nothing when no phone is registered", async () => {
    const { sendPushToAdmins } = await freshPush();
    expect(await sendPushToAdmins({ title: "t", body: "b", url: "/admin" })).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends to every device and prunes the ones that are gone", async () => {
    const { saveSubscription, sendPushToAdmins, listSubscriptions } = await freshPush();
    await saveSubscription(SUB(1), "a");
    await saveSubscription(SUB(2), "b");
    await saveSubscription(SUB(3), "c");
    sendNotification.mockImplementation(async (sub: { endpoint: string }) => {
      if (sub?.endpoint.includes("device-2")) throw Object.assign(new Error("gone"), { statusCode: 410 });
      if (sub?.endpoint.includes("device-3")) throw Object.assign(new Error("boom"), { statusCode: 500 });
      return { statusCode: 201 };
    });

    const report = await sendPushToAdmins({ title: "Nueva reserva", body: "x", url: "/admin/reservas/1" });
    expect(report).toEqual({ sent: 1, removed: 1, failed: 1 });
    const [, payload, opts] = sendNotification.mock.calls[0]!;
    expect(JSON.parse(payload as string)).toMatchObject({ title: "Nueva reserva", url: "/admin/reservas/1" });
    expect((opts as { vapidDetails: { publicKey: string } }).vapidDetails.publicKey).toBe("BPUBLICKEY_generated");
    expect((await listSubscriptions()).map((s) => s.endpoint).some((e) => e.includes("device-2"))).toBe(false);
  });
});
