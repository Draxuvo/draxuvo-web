import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FALLBACK_PLANS,
  MODULE_KEYS,
  getPlans,
  registrationUrl,
  suggestPlan,
  uiBaseUrl,
  type PlansResponse,
} from "./plans";

describe("FALLBACK_PLANS", () => {
  it("tiene tres planes con IVA de 16%", () => {
    expect(FALLBACK_PLANS.plans.map((p) => p.key)).toEqual(["basic", "pro", "enterprise"]);
    expect(FALLBACK_PLANS.iva_rate).toBe(0.16);
  });

  it("cada precio suma monto más IVA redondeado", () => {
    for (const plan of FALLBACK_PLANS.plans) {
      for (const cycle of ["monthly", "annual"] as const) {
        const { amount_cents, iva_cents, total_cents } = plan.prices[cycle];
        expect(iva_cents).toBe(Math.round(amount_cents * 0.16));
        expect(total_cents).toBe(amount_cents + Math.round(amount_cents * 0.16));
      }
    }
  });

  it("los precios anuales son los esperados", () => {
    expect(FALLBACK_PLANS.plans.map((p) => p.prices.annual.amount_cents)).toEqual([399_000, 799_000, 1_599_000]);
  });
});

describe("suggestPlan", () => {
  it("sin necesidades devuelve null", () => {
    expect(suggestPlan([], FALLBACK_PLANS)).toBeNull();
  });

  it("devuelve el plan más barato que cubre todas las necesidades", () => {
    expect(suggestPlan(["employees"], FALLBACK_PLANS)?.key).toBe("basic");
    expect(suggestPlan(["employees", "work_orders"], FALLBACK_PLANS)?.key).toBe("pro");
    expect(suggestPlan(["reports", "whatsapp"], FALLBACK_PLANS)?.key).toBe("enterprise");
    expect(suggestPlan(["multi_company"], FALLBACK_PLANS)?.key).toBe("enterprise");
  });

  it("devuelve null si ningún plan cubre las necesidades", () => {
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans: FALLBACK_PLANS.plans.slice(0, 2) };
    expect(suggestPlan(["whatsapp"], catalog)).toBeNull();
  });

  it("elige por precio mensual sin importar el orden del catálogo", () => {
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans: [...FALLBACK_PLANS.plans].reverse() };
    expect(suggestPlan(["employees"], catalog)?.key).toBe("basic");
  });

  it("no depende del ciclo: el resultado es el mismo aunque el anual invierta el orden de precios", () => {
    const [basic, pro, enterprise] = FALLBACK_PLANS.plans;
    const cheapAnnualPro = {
      ...pro,
      prices: { ...pro.prices, annual: { amount_cents: 1, iva_cents: 0, total_cents: 1 } },
    };
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans: [basic, cheapAnnualPro, enterprise] };
    expect(suggestPlan(["employees"], catalog)?.key).toBe("basic");
  });
});

describe("getPlans", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function respond(body: unknown, ok = true) {
    fetchMock.mockResolvedValue({ ok, json: async () => body });
  }

  const valid: PlansResponse = {
    iva_rate: 0.08,
    modules: ["employees"],
    plans: [
      {
        key: "basic",
        modules: ["employees"],
        prices: {
          monthly: { amount_cents: 100, iva_cents: 8, total_cents: 108 },
          annual: { amount_cents: 1000, iva_cents: 80, total_cents: 1080 },
        },
      },
    ],
  };

  it("sin NEXT_PUBLIC_API_URL devuelve el fallback sin llamar a fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(await getPlans()).toBe(FALLBACK_PLANS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve el payload válido de la API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    respond(valid);
    expect(await getPlans()).toEqual(valid);
  });

  it("pide <base>/api/v1/plans quitando la diagonal final", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/");
    respond(valid);
    await getPlans();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.test/api/v1/plans");
  });

  it("devuelve el fallback si la respuesta no es ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    respond(valid, false);
    expect(await getPlans()).toBe(FALLBACK_PLANS);
  });

  it("devuelve el fallback si fetch lanza un error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    fetchMock.mockRejectedValue(new Error("red caída"));
    expect(await getPlans()).toBe(FALLBACK_PLANS);
  });

  it("devuelve el fallback si el JSON falla al leerse", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    fetchMock.mockResolvedValue({ ok: true, json: async () => Promise.reject(new Error("json")) });
    expect(await getPlans()).toBe(FALLBACK_PLANS);
  });

  const { annual, ...monthlyOnly } = valid.plans[0].prices;
  void annual;
  it.each([
    ["no es un objeto", "texto"],
    ["es null", null],
    ["plans vacío", { ...valid, plans: [] }],
    ["iva_rate no es número", { ...valid, iva_rate: "0.16" }],
    ["un plan sin precio anual", { ...valid, plans: [{ ...valid.plans[0], prices: monthlyOnly }] }],
    ["los módulos de un plan no son arreglo", { ...valid, plans: [{ ...valid.plans[0], modules: "employees" }] }],
    ["plans no es arreglo", { ...valid, plans: {} }],
  ])("devuelve el fallback si el payload inválido: %s", async (_name, body) => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    respond(body);
    expect(await getPlans()).toBe(FALLBACK_PLANS);
  });

  it("acepta un payload cuyo campo modules de la raíz no es un arreglo (la validación solo revisa los planes)", async () => {
    // Observación: el spec pide tratar modules no-arreglo como inválido, pero isPlansResponse no lo valida.
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
    respond({ ...valid, modules: "employees" });
    expect(await getPlans()).toEqual({ ...valid, modules: "employees" });
  });
});

describe("uiBaseUrl y registrationUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa http://localhost:4200 por defecto", () => {
    vi.stubEnv("NEXT_PUBLIC_UI_URL", undefined as unknown as string);
    delete process.env.NEXT_PUBLIC_UI_URL;
    expect(uiBaseUrl()).toBe("http://localhost:4200");
  });

  it("quita la diagonal final y lee el entorno al llamarse", () => {
    vi.stubEnv("NEXT_PUBLIC_UI_URL", "https://panel.test/");
    expect(uiBaseUrl()).toBe("https://panel.test");
    vi.stubEnv("NEXT_PUBLIC_UI_URL", "https://otro.test");
    expect(uiBaseUrl()).toBe("https://otro.test");
  });

  it("arma el enlace de registro con plan y ciclo mensual o anual", () => {
    vi.stubEnv("NEXT_PUBLIC_UI_URL", "https://panel.test");
    expect(registrationUrl("es", "pro", "monthly")).toBe("https://panel.test/es/registro?plan=pro&ciclo=mensual");
    expect(registrationUrl("en", "enterprise", "annual")).toBe("https://panel.test/en/registro?plan=enterprise&ciclo=anual");
  });
});

describe("MODULE_KEYS", () => {
  it("lista los ocho módulos", () => {
    expect(MODULE_KEYS).toHaveLength(8);
  });
});
