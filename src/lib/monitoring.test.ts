import { describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/browser";
import type { ErrorEvent } from "@sentry/browser";
import { beforeBreadcrumb, beforeSend, initMonitoring, scrubUrl } from "./monitoring";

vi.mock("@sentry/browser", () => ({ init: vi.fn() }));

// Spec 071: ningún error del sitio sale con query string, el token del menú QR ni datos de quien lo visita.
describe("monitoring", () => {
  it("scrubUrl quita query, hash y el token del menú QR", () => {
    expect(scrubUrl("https://draxuvo.com/es/precios?plan=pro#faq")).toBe("https://draxuvo.com/es/precios");
    expect(scrubUrl("https://draxuvo.com/es/m/AbCdEf1234567890xyz12")).toBe("https://draxuvo.com/es/m/:token");
    expect(scrubUrl("/m/AbCdEf1234567890xyz12?mesa=4")).toBe("/m/:token");
    expect(scrubUrl(undefined)).toBeUndefined();
  });

  it("beforeSend no deja usuario, tokens ni query", () => {
    const event = {
      request: {
        url: "https://draxuvo.com/es/m/AbCdEf1234567890xyz12?x=1",
        query_string: "x=1",
        headers: { "User-Agent": "Mozilla/5.0", Cookie: "a=b" },
      },
      transaction: "/es/m/AbCdEf1234567890xyz12",
      user: { ip_address: "187.0.0.1" },
    } as unknown as ErrorEvent;

    const clean = beforeSend(event);
    const dumped = JSON.stringify(clean);

    expect(clean.request?.url).toBe("https://draxuvo.com/es/m/:token");
    expect(clean.request?.headers).toEqual({ "User-Agent": "Mozilla/5.0" });
    expect(clean.transaction).toBe("/es/m/:token");
    expect(clean.user).toBeUndefined();
    for (const secret of ["AbCdEf1234567890xyz12", "187.0.0.1", "a=b"]) expect(dumped).not.toContain(secret);
  });

  it("beforeBreadcrumb limpia las URLs de la API pública y descarta la consola", () => {
    expect(
      beforeBreadcrumb({ category: "fetch", data: { url: "https://api.draxuvo.com/api/v1/public/menus/AbCdEf1234567890xyz12" } })?.data?.url,
    ).toBe("https://api.draxuvo.com/api/v1/public/menus/:token");
    expect(beforeBreadcrumb({ category: "navigation", data: { from: "/es/m/tok", to: "/es?x=1" } })?.data).toEqual({
      from: "/es/m/:token",
      to: "/es",
    });
    expect(beforeBreadcrumb({ category: "console", message: "hola" })).toBeNull();
  });

  it("sin DSN no inicializa; con DSN una sola vez y sin tracing", () => {
    expect(initMonitoring("")).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();

    expect(initMonitoring("https://abc@o1.ingest.sentry.io/1")).toBe(true);
    expect(initMonitoring("https://abc@o1.ingest.sentry.io/1")).toBe(true);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Sentry.init).mock.calls[0][0]).toMatchObject({ tracesSampleRate: 0, dataCollection: { userInfo: false } });
  });
});
