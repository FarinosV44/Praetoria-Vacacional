# Intranet de gestión — Praetoria Vacacional (issue #56)

Zona privada bajo `/admin`, autenticación server-side (`requireAdmin`), cookie
firmada HttpOnly, `noindex`. Toda la operativa de los dos alojamientos
(**Javalambre Mountain SuperSki** y **Valencia Frente al Mar**) desde un panel.

## Módulos

| Ruta | Qué hace |
|---|---|
| `/admin` | Panel: filtro mes + alojamiento; ingresos, pagos recibidos, ocupación, reservas por canal, próximas + recientes, facturas pendientes de emitir, estado de sincronización, accesos rápidos |
| `/admin/reservas` | Alta manual (todos los canales), edición, cancelación. Filtros: alojamiento, canal, estado, pago, búsqueda (localizador / nombre / email / documento / nº factura / localizador externo). Estado `external` para reservas de Booking/Airbnb cuyo bloqueo iCal ya reserva las fechas |
| `/admin/clientes` | CRM: ficha con historial, gasto, alojamientos, canal, consentimiento; alta manual; detección de duplicados (email / teléfono / documento / nombre + contacto) y fusión en un clic; export CSV |
| `/admin/facturas` | Series `JAV-YY####` / `PALM-YY####`; nº manual con sugerencia + detección de duplicados y saltos; «Emitir factura» desde la reserva; borrador → emitida (inmutable) → cobrada / anulada. Documento `@media print` por alojamiento en `/admin/facturas/[id]/documento`. Fiscalidad configurable en `/admin/facturas/ajustes` (exenta por defecto, art. 20.Uno.23º LIVA) |
| `/admin/calendario` | Rejilla mensual por alojamiento (colores por canal), navegación de mes, selección múltiple de días → aplicar precio / estancia mínima / quitar ajustes / cerrar fechas (bloqueo manual) / abrir fechas. Los cambios afectan de inmediato a la web y al checkout |
| `/admin/marketing` | Segmentos guardados (criterios AND: alojamiento, canal, idioma, nacional/extranjero, repetidores, gasto, última reserva, consentimiento, cupón); campañas email / WhatsApp / promo con lista de destinatarios materializada (respeta consentimiento y bajas); export CSV de contactos; `/admin/marketing/bajas` |
| `/admin/promociones` | Cupones (código, %/importe, alojamiento, límites, caducidad, quién los usó). «Crear cupón» rápido desde la ficha de cliente o el segmento |
| `/admin/sincronizacion` | URLs iCal de Booking y Airbnb por alojamiento; cada importación crea también el registro interno de reserva (`external`) |
| `/admin/actividad` | Registro de acciones críticas (cancelaciones, emisión/anulación de facturas, fusiones, envíos de campañas, cierres de calendario) |

## Roles (§10)

`domains/admin/roles.ts` define una matriz de capacidades para **admin**,
**gestión** y **solo lectura**. Hoy hay un único login; su rol se fija con
`ADMIN_ROLE` (por defecto `admin`). Cada acción de escritura llama a
`assertCapability(...)`. La arquitectura queda lista para multiusuario.

## Envío de campañas — «Aún no configurado»

El módulo de marketing está completo (segmentar, exportar, preparar, doble
confirmación escribiendo `ENVIAR`), pero el **envío masivo real no está
cableado**: `markCampaignSent` registra la intención y marca los destinatarios
como no enviados. Estado en `/admin/configuracion` → `campaigns`. Decisión D-009.

## Fiscalidad y facturas

- Números **no automáticos rígidos**: se pueden escribir a mano; el sistema
  sugiere el siguiente, avisa de duplicados y detecta saltos.
- Una factura **emitida es inmutable** (triggers `invoices_immutability_guard` /
  `invoice_items_immutability_guard`): para corregir un error se **anula y se
  emite una nueva**, nunca se edita en silencio. Decisión D-010.
- El documento se genera de forma determinista desde la fila congelada → siempre
  produce el mismo PDF.

## Modelo de datos

Migraciones `20260829100000`–`20260829140000` (ver `docs/api/INDEX.md`):
`customers`, `customer_merges`, `invoices`, `invoice_items`, `invoice_settings`,
`daily_rates`, `segments`, `campaigns`, `campaign_recipients`,
`marketing_unsubscribes`; columnas nuevas en `reservations`; nuevos valores de
enum (`reservation_source` += airbnb/other, `reservation_status` += external).
Reservas, clientes, facturas y pagos se relacionan por IDs estables.

## Verificación

La cadena completa `reserva → cliente → factura → documento → calendario →
historial → segmento` se prueba de extremo a extremo en
`src/domains/invoicing/chain.test.ts` contra el repositorio (modo DEMO;
el backend Supabase implementa la misma interfaz). Las rutas privadas se
comprueban en `e2e/intranet.spec.ts`.
