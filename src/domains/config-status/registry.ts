import { env } from "@/lib/env";

/**
 * Central feature/config status registry (issue #41).
 *
 * Every external integration is DECLARED here with a single status:
 *   - `configured`     — real credentials present, feature fully live
 *   - `not_configured` — no credentials yet; feature is built and degrades safely
 *   - `disabled`       — intentionally turned off
 *   - `error`          — credentials present but a check failed (set at runtime)
 *
 * "Falta configuración" ≠ "falta implementar". The code path exists in every
 * case; only the activation is pending.
 */

export type ConfigState = "configured" | "not_configured" | "disabled" | "error";

export interface ConfigFeature {
  key: string;
  label: string;
  /** What stops working (or runs in fallback) while not configured. */
  impact: string;
  /** Env vars the operator must set. */
  envVars: string[];
  /** Where to set them. */
  where: string;
  state: ConfigState;
  /** Short admin-facing status line. */
  statusLine: string;
  /** Public-facing message, shown ONLY when a user tries to use the feature. */
  publicMessage: string | null;
}

export function getConfigFeatures(): ConfigFeature[] {
  const database: ConfigFeature = {
    key: "database",
    label: "Base de datos (Supabase)",
    impact:
      "Sin Supabase la web funciona en modo demostración: los datos viven en memoria y no persisten entre despliegues.",
    envVars: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      "SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY)",
    ],
    where: "Supabase → Project Settings → API Keys",
    state: env.supabaseConfigured ? "configured" : "not_configured",
    statusLine: env.supabaseConfigured
      ? "Conectada. Reservas y bloqueos persisten en Postgres."
      : "Modo demostración (datos en memoria). Añade las claves de Supabase para producción.",
    publicMessage: null,
  };

  const payments: ConfigFeature = {
    key: "payments",
    label: "Pagos (Stripe)",
    impact:
      "El checkout, los holds, la validación y los webhooks están implementados. Sin claves, el último paso usa un simulador y no se realiza ningún cobro real.",
    envVars: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    where: "Stripe Dashboard → Developers → API keys (usa claves test hasta el lanzamiento)",
    state: env.stripeConfigured
      ? env.stripeWebhookConfigured
        ? "configured"
        : "error"
      : "not_configured",
    statusLine: env.stripeConfigured
      ? env.stripeWebhookConfigured
        ? "Activo. Los cobros se procesan con Stripe y se confirman por webhook firmado."
        : "Claves presentes pero falta STRIPE_WEBHOOK_SECRET: las reservas no se confirmarían automáticamente."
      : "Pagos aún no configurados. El checkout funciona con un simulador; no se cobra nada.",
    publicMessage: env.stripeConfigured
      ? null
      : "Los pagos con tarjeta se activarán próximamente. Puedes completar la reserva en modo demostración.",
  };

  const email: ConfigFeature = {
    key: "email",
    label: "Correo (Resend)",
    impact:
      "Las plantillas, los disparadores y los reintentos están implementados. Sin API key, los emails se registran en el servidor y la reserva NUNCA falla por ello.",
    envVars: ["RESEND_API_KEY", "EMAIL_FROM"],
    where: "Resend → API Keys (verifica también el dominio de envío)",
    state: env.emailConfigured ? "configured" : "not_configured",
    statusLine: env.emailConfigured
      ? "Activo. Confirmación, aviso de pago fallido y notificación interna vía Resend. Registro en /admin/pagos."
      : "Email pendiente: servicio no configurado. Cada intento se registra en /admin/pagos; la reserva nunca falla por esto.",
    publicMessage: null,
  };

  const ical: ConfigFeature = {
    key: "ical",
    label: "Sincronización Booking (iCal)",
    impact:
      "El importador, exportador, parser, deduplicación, cron y la UI de admin están implementados. Faltan las URLs iCal de cada alojamiento en Booking.",
    envVars: ["ICAL_EXPORT_TOKEN"],
    where:
      "Token: variable de entorno ICAL_EXPORT_TOKEN · URLs de importación de Booking: pégalas en /admin/sincronizacion (o en src/content/properties/<slug>.ts)",
    state: env.icalExportConfigured ? "configured" : "not_configured",
    statusLine: env.icalExportConfigured
      ? "Feeds de exportación activos. Revisa el estado de importación por alojamiento."
      : "Sincronización Booking aún no configurada. Genera ICAL_EXPORT_TOKEN y pega las URLs de Booking.",
    publicMessage: null,
  };

  const analytics: ConfigFeature = {
    key: "analytics",
    label: "Analítica (GA4)",
    impact:
      "Los eventos de conversión (search, begin_checkout, payment_started, reservation_confirmed…) están implementados y filtrados de PII. Sin ID de medición no se cargan scripts.",
    envVars: ["NEXT_PUBLIC_GA4_ID"],
    where: "Google Analytics 4 → Admin → Data Streams",
    state: env.analyticsConfigured ? "configured" : "not_configured",
    statusLine: env.analyticsConfigured
      ? "Activa. Consentimiento por defecto denegado; sin PII."
      : "Analítica pendiente de configuración. Añade NEXT_PUBLIC_GA4_ID.",
    publicMessage: null,
  };

  const searchConsole: ConfigFeature = {
    key: "search_console",
    label: "Google Search Console",
    impact: "La etiqueta de verificación se inyecta cuando hay token. El sitemap y robots ya están listos.",
    envVars: ["NEXT_PUBLIC_GSC_VERIFICATION"],
    where: "Search Console → Añadir propiedad → Etiqueta HTML",
    state: env.NEXT_PUBLIC_GSC_VERIFICATION ? "configured" : "not_configured",
    statusLine: env.NEXT_PUBLIC_GSC_VERIFICATION
      ? "Etiqueta de verificación activa."
      : "Search Console pendiente: falta el token de verificación.",
    publicMessage: null,
  };

  const admin: ConfigFeature = {
    key: "admin",
    label: "Panel de administración",
    impact: "El panel está implementado; requiere ADMIN_PASSWORD para iniciar sesión.",
    envVars: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"],
    where: "Variable de entorno",
    state: env.adminConfigured ? "configured" : "not_configured",
    statusLine: env.adminConfigured
      ? "Acceso configurado."
      : "Panel sin contraseña: define ADMIN_PASSWORD para habilitar el login.",
    publicMessage: null,
  };

  const campaigns: ConfigFeature = {
    key: "campaigns",
    label: "Envío de campañas por email",
    impact:
      "Segmentos, listas, exportación CSV, preparación con consentimiento y bajas, y el envío real por Resend (con cabecera de baja en un clic RFC-8058 y supresión por rebote) están implementados. El envío de WhatsApp masivo sigue pendiente de proveedor.",
    envVars: ["RESEND_API_KEY", "MARKETING_FROM", "RESEND_WEBHOOK_SECRET"],
    where: "Resend (misma cuenta que los correos transaccionales) · webhook a /api/webhooks/resend",
    state: env.emailConfigured ? "configured" : "not_configured",
    statusLine: env.emailConfigured
      ? "Activo por email vía Resend. Configura el webhook de Resend para suprimir rebotes automáticamente."
      : "Email sin configurar: las campañas se preparan pero el envío queda registrado como intención.",
    publicMessage: null,
  };

  const media: ConfigFeature = {
    key: "media",
    label: "Biblioteca de medios",
    impact:
      "La biblioteca (subida, ALT, punto focal, etiquetas, reutilización) está implementada. Sin Supabase Storage no se pueden subir archivos.",
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"],
    where: "Supabase → Storage → crear un bucket PRIVADO llamado «media»",
    state: env.supabaseConfigured ? "configured" : "not_configured",
    statusLine: env.supabaseConfigured
      ? "Activa. Recuerda crear el bucket privado «media» en Supabase Storage."
      : "Sin Storage. Configura Supabase y crea el bucket «media».",
    publicMessage: null,
  };

  const rateLimit: ConfigFeature = {
    key: "rate_limit",
    label: "Rate limiting distribuido",
    impact:
      "El límite de peticiones por IP y el denylist temporal por abuso están siempre activos. Sin Redis usan memoria local (correcto para un solo servidor); con varios servidores/regiones necesitas Upstash Redis para que el contador sea compartido.",
    envVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    where: "Upstash → Redis database → REST API (o la integración KV de Vercel)",
    state: env.rateLimitDistributed ? "configured" : "not_configured",
    statusLine: env.rateLimitDistributed
      ? "Distribuido (Upstash Redis). El contador se comparte entre instancias."
      : "En memoria (una instancia). Añade Upstash Redis si escalas a varias.",
    publicMessage: null,
  };

  const observability: ConfigFeature = {
    key: "observability",
    label: "Observabilidad (errores y trazas)",
    impact:
      "El registro estructurado (una línea JSON por evento) está siempre activo. Con un DSN de Sentry, además, cada error del servidor y del navegador se envía a Sentry sin SDK. Sin DSN, los errores solo quedan en los logs del servidor.",
    envVars: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "LOG_LEVEL"],
    where: "Sentry → Project Settings → Client Keys (DSN)",
    state: env.observabilityConfigured ? "configured" : "not_configured",
    statusLine: env.observabilityConfigured
      ? "Activa. Errores de servidor y navegador se envían a Sentry; logs estructurados en stdout."
      : "Solo logs locales. Añade SENTRY_DSN para centralizar errores y alertas.",
    publicMessage: null,
  };

  const whatsapp: ConfigFeature = {
    key: "whatsapp",
    label: "WhatsApp concierge",
    impact:
      "Un botón flotante que abre WhatsApp con un mensaje ya redactado y el contexto de la página. Sin número configurado, el botón no aparece.",
    envVars: ["NEXT_PUBLIC_WHATSAPP_NUMBER"],
    where: "Número de WhatsApp de atención, solo dígitos E.164 (p. ej. 34600111222)",
    state: env.whatsappConfigured ? "configured" : "not_configured",
    statusLine: env.whatsappConfigured
      ? "Activo. El botón flotante abre WhatsApp con el contexto de la reserva."
      : "Sin número. Añade NEXT_PUBLIC_WHATSAPP_NUMBER para activar el botón.",
    publicMessage: null,
  };

  return [database, payments, email, ical, analytics, searchConsole, admin, observability, rateLimit, media, campaigns, whatsapp];
}

export function getFeature(key: string): ConfigFeature | undefined {
  return getConfigFeatures().find((f) => f.key === key);
}

export function configSummary() {
  const features = getConfigFeatures();
  return {
    total: features.length,
    configured: features.filter((f) => f.state === "configured").length,
    pending: features.filter((f) => f.state === "not_configured").length,
    error: features.filter((f) => f.state === "error").length,
  };
}
