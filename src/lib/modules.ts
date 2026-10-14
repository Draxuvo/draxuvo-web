import type { LucideIcon } from "lucide-react";
import { ChartColumn, Boxes, Building2, CalendarCheck, ClipboardList, MessageCircle, Receipt, Users } from "lucide-react";
import { MODULE_KEYS, type ModuleKey, type PlanKey, type PlansResponse } from "./plans";

// Orden de los módulos en el sitio e icono de cada uno. Los textos viven en messages/{es,en}.json
// bajo modules.items.<key>.
export const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  employees: Users,
  attendance: CalendarCheck,
  inventory: Boxes,
  work_orders: ClipboardList,
  tickets: Receipt,
  reports: ChartColumn,
  whatsapp: MessageCircle,
  multi_company: Building2,
};

export const BUSINESS_TYPES = ["restaurant", "cafe", "services"] as const;

const PLAN_ORDER: PlanKey[] = ["basic", "pro", "enterprise"];

// El plan más barato del catálogo que incluye el módulo (data-model §5).
export function planForModule(catalog: PlansResponse, module: ModuleKey): PlanKey | null {
  const plans = [...catalog.plans].sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
  return plans.find((plan) => plan.modules.includes(module))?.key ?? null;
}

export function modulesWithPlan(catalog: PlansResponse): { key: ModuleKey; plan: PlanKey | null }[] {
  return MODULE_KEYS.map((key) => ({ key, plan: planForModule(catalog, key) }));
}
