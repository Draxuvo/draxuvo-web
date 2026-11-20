// src/lib/monitoring.ts
// Spec 071: errores del navegador del sitio a Sentry. Sin NEXT_PUBLIC_SENTRY_DSN (desarrollo, pruebas, CI) no se
// inicializa. Solo navegador: los errores del render en el servidor se ven en Cloudflare (Workers → draxuvo-web →
// Observability). El sitio no tiene sesión: no hay usuario. El menú QR (`/m/<token>`, spec 059) lleva el token de la
// mesa en la ruta: se enmascara, igual que el query string.
import * as Sentry from "@sentry/browser";
import type { Breadcrumb, ErrorEvent } from "@sentry/browser";

/** Ruido del navegador que no es un error de Draxuvo (cancelaciones, extensiones, avisos de layout). */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  /ResizeObserver loop/,
  /^AbortError/,
  /The (user|operation) aborted/,
  /^Failed to fetch$/,
  /^Load failed$/,
  /^NetworkError when attempting to fetch resource\.?$/,
  /Non-Error promise rejection captured/,
];

/** Scripts que no son nuestros: extensiones del navegador. */
export const DENY_URLS: RegExp[] = [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-(web-)?extension:\/\//i];

// El token viaja en la página (`/m/<token>`) y en la petición a la API pública (`/public/menus/<token>`).
const TOKEN_ROUTES: [RegExp, string][] = [
  [/\/m\/[^/?#]+/, "/m/:token"],
  [/\/public\/menus\/[^/?#]+/, "/public/menus/:token"],
];

let initialized = false;

/** Quita query string y hash, y enmascara el token del menú QR. */
export function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  let clean = url.split(/[?#]/, 1)[0];
  for (const [pattern, replacement] of TOKEN_ROUTES) clean = clean.replace(pattern, replacement);
  return clean;
}

export function beforeSend(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request.url = scrubUrl(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;
    event.request.headers = event.request.headers?.["User-Agent"]
      ? { "User-Agent": event.request.headers["User-Agent"] }
      : undefined;
  }
  if (event.transaction) event.transaction = scrubUrl(event.transaction);
  delete event.user;
  return event;
}

export function beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  const data = breadcrumb.data;
  if (data) {
    for (const key of ["url", "from", "to"] as const) {
      if (typeof data[key] === "string") data[key] = scrubUrl(data[key]);
    }
  }
  if (breadcrumb.category === "console") return null;
  return breadcrumb;
}

/** Inicializa Sentry una sola vez, solo en el navegador y solo con DSN. */
export function initMonitoring(dsn = process.env.NEXT_PUBLIC_SENTRY_DSN): boolean {
  if (initialized) return true;
  if (typeof window === "undefined" || !dsn) return false;
  Sentry.init({
    dsn,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
    // Sentry 11: `dataCollection` reemplaza a `sendDefaultPii`.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ["User-Agent"] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
    },
    tracesSampleRate: 0,
    ignoreErrors: IGNORE_ERRORS,
    denyUrls: DENY_URLS,
    beforeSend,
    beforeBreadcrumb,
  });
  initialized = true;
  return true;
}
