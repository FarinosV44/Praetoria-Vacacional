"use client";

import { useEffect, useState, useTransition } from "react";
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
  sendTestPushAction,
} from "@/domains/admin/mobile-actions";

/** Chrome's install prompt event (not in the TS DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PushState = "checking" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

function base64UrlToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function deviceLabel(): string {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Dispositivo";
  const browser = /CriOS|Chrome/.test(ua) ? "Chrome" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "navegador";
  return `${os} · ${browser}`;
}

/**
 * Turns the admin into a phone app: install hint (iPhone needs "Añadir a
 * pantalla de inicio" before web push works), Android install button, and the
 * notifications switch with a test message.
 */
export function MobileAppSetup({ vapidPublicKey, devices }: { vapidPublicKey: string; devices: number }) {
  const [state, setState] = useState<PushState>("checking");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const sa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsIos(ios);
    setStandalone(sa);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    (async () => {
      if (!("serviceWorker" in navigator)) return setState("unsupported");
      const reg = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin/" });
      if (!("PushManager" in window) || !("Notification" in window)) {
        return setState(ios && !sa ? "needs-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function enable() {
    setMsg(null);
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "blocked" : "off");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToBytes(vapidPublicKey),
          }));
        const res = await savePushSubscriptionAction(sub.toJSON(), deviceLabel());
        if (!res.ok) throw new Error(res.error);
        setState("on");
        setMsg({ tone: "ok", text: "Activadas. Te avisaremos de cada reserva nueva." });
      } catch (err) {
        setMsg({ tone: "danger", text: `No se pudieron activar: ${(err as Error).message}` });
      }
    });
  }

  function disable() {
    setMsg(null);
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    });
  }

  function test() {
    setMsg(null);
    start(async () => {
      const res = await sendTestPushAction();
      setMsg(res.ok ? { tone: "ok", text: "Prueba enviada: debería llegarte en unos segundos." } : { tone: "danger", text: res.error });
    });
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <section className="admin-card space-y-4 p-4" aria-labelledby="app-setup">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="app-setup" className="text-base">Avisos de reservas en el móvil</h2>
          <p className="mt-1 text-sm text-[var(--a-text-soft)]">
            {devices === 0
              ? "Ningún teléfono activado todavía."
              : devices === 1
                ? "1 dispositivo recibe los avisos."
                : `${devices} dispositivos reciben los avisos.`}
          </p>
        </div>
        <span className="admin-chip" data-tone={state === "on" ? "ok" : state === "blocked" ? "danger" : "neutral"}>
          {state === "on" ? "Activados" : state === "blocked" ? "Bloqueados" : state === "checking" ? "…" : "Desactivados"}
        </span>
      </div>

      {!standalone && isIos && (
        <ol className="list-decimal space-y-1 rounded-[var(--a-radius-sm)] bg-[var(--a-surface-2)] py-3 pl-8 pr-3 text-sm">
          <li>Abre esta página en <strong>Safari</strong>.</li>
          <li>
            Pulsa <strong>Compartir</strong> y después <strong>Añadir a pantalla de inicio</strong>.
          </li>
          <li>Abre la app «Praetoria» desde el icono y activa aquí los avisos.</li>
        </ol>
      )}

      {!standalone && installEvent && (
        <button type="button" className="admin-btn w-full justify-center py-3" data-variant="outline" onClick={install}>
          Instalar la app en este teléfono
        </button>
      )}

      {state === "off" && (
        <button
          type="button"
          className="admin-btn w-full justify-center py-3 text-base"
          data-variant="primary"
          onClick={enable}
          disabled={pending || !vapidPublicKey}
        >
          {pending ? "Activando…" : "Activar avisos de reservas"}
        </button>
      )}

      {state === "on" && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="admin-btn justify-center py-3" data-variant="outline" onClick={test} disabled={pending}>
            Enviar prueba
          </button>
          <button type="button" className="admin-btn justify-center py-3" data-variant="ghost" onClick={disable} disabled={pending}>
            Desactivar aquí
          </button>
        </div>
      )}

      {state === "needs-install" && (
        <p className="text-sm text-[var(--a-text-soft)]">
          En iPhone los avisos solo funcionan desde la app instalada (iOS 16.4 o posterior).
        </p>
      )}
      {state === "blocked" && (
        <p className="text-sm text-[var(--a-text-soft)]">
          Has bloqueado las notificaciones. Actívalas en los ajustes del teléfono para «Praetoria» y vuelve aquí.
        </p>
      )}
      {state === "unsupported" && (
        <p className="text-sm text-[var(--a-text-soft)]">Este navegador no admite notificaciones push.</p>
      )}

      {msg && (
        <p role="status" className="text-sm" style={{ color: msg.tone === "ok" ? "var(--a-ok)" : "var(--a-danger)" }}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
