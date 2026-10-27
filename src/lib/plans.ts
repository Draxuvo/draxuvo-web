// Catálogo de planes para la tabla de precios. Fuente: GET /api/v1/plans (contracts/api.md),
// con fallback estático por si la API no responde (por ejemplo, durante el build).
export type PlanKey = "basic" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type ModuleKey =
  | "employees"
  | "attendance"
  | "inventory"
  | "work_orders"
  | "tickets"
  | "reports"
  | "whatsapp"
  | "multi_company";

export interface PlanPrice {
  amount_cents: number;
  iva_cents: number;
  total_cents: number;
}

export interface Plan {
  key: PlanKey;
  modules: ModuleKey[];
  prices: Record<BillingCycle, PlanPrice>;
}

export interface PlansResponse {
  iva_rate: number;
  plans: Plan[];
  modules: ModuleKey[];
}

export const MODULE_KEYS: ModuleKey[] = [
  "employees",
  "attendance",
  "inventory",
  "work_orders",
  "tickets",
  "reports",
  "whatsapp",
  "multi_company",
];

const IVA_RATE = 0.16;

function price(amountCents: number): PlanPrice {
  const ivaCents = Math.round(amountCents * IVA_RATE);
  return { amount_cents: amountCents, iva_cents: ivaCents, total_cents: amountCents + ivaCents };
}

function plan(key: PlanKey, modules: ModuleKey[], monthly: number, annual: number): Plan {
  return { key, modules, prices: { monthly: price(monthly), annual: price(annual) } };
}

export const FALLBACK_PLANS: PlansResponse = {
  iva_rate: IVA_RATE,
  modules: MODULE_KEYS,
  plans: [
    plan("basic", ["employees", "attendance", "inventory"], 39_900, 399_000),
    plan("pro", ["employees", "attendance", "inventory", "work_orders", "tickets", "reports"], 79_900, 799_000),
    plan("enterprise", MODULE_KEYS, 159_900, 1_599_000),
  ],
};

function isPlansResponse(data: unknown): data is PlansResponse {
  const value = data as PlansResponse | null;
  return (
    !!value &&
    typeof value.iva_rate === "number" &&
    Array.isArray(value.plans) &&
    value.plans.length > 0 &&
    value.plans.every((p) => p?.prices?.monthly && p?.prices?.annual && Array.isArray(p.modules))
  );
}

export async function getPlans(): Promise<PlansResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return FALLBACK_PLANS;

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/plans`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return FALLBACK_PLANS;
    const data: unknown = await res.json();
    return isPlansResponse(data) ? data : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

// Enlace al registro del panel (contracts/ui-routes.md, "Enlace draxuvo-web a ui").
export function uiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_UI_URL ?? "http://localhost:4200").replace(/\/$/, "");
}

/** Entrada a la demo del panel (spec 039); con `planKey`, el plan ya viene elegido. */
export function demoUrl(locale: string, planKey?: PlanKey): string {
  return `${uiBaseUrl()}/${locale}/demo${planKey ? `?plan=${planKey}` : ""}`;
}

export function registrationUrl(locale: string, planKey: PlanKey, cycle: BillingCycle): string {
  const ciclo = cycle === "annual" ? "anual" : "mensual";
  return `${uiBaseUrl()}/${locale}/registro?plan=${planKey}&ciclo=${ciclo}`;
}

// Necesidades del buscador de plan: son módulos ("más de una empresa" es multi_company).
export type Need = ModuleKey;

// El plan más barato (por total mensual) que incluye todas las necesidades. Sin necesidades, o si
// ningún plan las cubre, devuelve null. No depende del ciclo de cobro.
export function suggestPlan(needs: Need[], catalog: PlansResponse): Plan | null {
  if (needs.length === 0) return null;
  const covering = catalog.plans.filter((plan) => needs.every((need) => plan.modules.includes(need)));
  if (covering.length === 0) return null;
  return covering.reduce((best, plan) => (plan.prices.monthly.total_cents < best.prices.monthly.total_cents ? plan : best));
}
