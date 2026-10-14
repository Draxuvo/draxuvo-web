// Datos de demostración del flujo orden de trabajo → ticket cobrado. No llaman a la API.
export const FLOW_STEPS = ["pending", "progress", "items", "done", "paid"] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

export const FLOW_ITEMS = [
  { key: "labor", cents: 85_000 },
  { key: "cable", cents: 32_000 },
  { key: "outlet", cents: 18_000 },
] as const;

export const FLOW_TOTAL_CENTS = FLOW_ITEMS.reduce((sum, item) => sum + item.cents, 0);
export const FLOW_FOLIO = "T-0042";
