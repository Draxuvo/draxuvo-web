import { describe, expect, it } from "vitest";
import { MODULE_ICONS, modulesWithPlan, planForModule } from "./modules";
import { FALLBACK_PLANS, MODULE_KEYS, type PlansResponse } from "./plans";

describe("planForModule", () => {
  it("devuelve el plan más barato que incluye el módulo", () => {
    expect(planForModule(FALLBACK_PLANS, "employees")).toBe("basic");
    expect(planForModule(FALLBACK_PLANS, "tickets")).toBe("pro");
    expect(planForModule(FALLBACK_PLANS, "whatsapp")).toBe("enterprise");
  });

  it("respeta el orden basic, pro, enterprise aunque el catálogo venga desordenado", () => {
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans: [...FALLBACK_PLANS.plans].reverse() };
    expect(planForModule(catalog, "employees")).toBe("basic");
  });

  it("no muta el catálogo recibido", () => {
    const plans = [...FALLBACK_PLANS.plans].reverse();
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans };
    const before = plans.map((p) => p.key);
    planForModule(catalog, "employees");
    expect(plans.map((p) => p.key)).toEqual(before);
  });

  it("devuelve null si ningún plan incluye el módulo", () => {
    const catalog: PlansResponse = { ...FALLBACK_PLANS, plans: FALLBACK_PLANS.plans.slice(0, 1) };
    expect(planForModule(catalog, "whatsapp")).toBeNull();
  });
});

describe("modulesWithPlan", () => {
  it("devuelve los ocho módulos en el orden de MODULE_KEYS", () => {
    const result = modulesWithPlan(FALLBACK_PLANS);
    expect(result).toHaveLength(8);
    expect(result.map((m) => m.key)).toEqual(MODULE_KEYS);
  });

  it("asigna el plan mínimo de cada módulo", () => {
    const byKey = Object.fromEntries(modulesWithPlan(FALLBACK_PLANS).map((m) => [m.key, m.plan]));
    expect(byKey.whatsapp).toBe("enterprise");
    expect(byKey.multi_company).toBe("enterprise");
    expect(byKey.work_orders).toBe("pro");
    expect(byKey.tickets).toBe("pro");
    expect(byKey.reports).toBe("pro");
    expect(byKey.employees).toBe("basic");
  });
});

describe("MODULE_ICONS", () => {
  it("tiene un icono para cada módulo", () => {
    for (const key of MODULE_KEYS) expect(MODULE_ICONS[key]).toBeDefined();
  });
});
