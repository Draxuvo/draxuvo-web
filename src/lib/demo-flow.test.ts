import { describe, expect, it } from "vitest";
import { FLOW_FOLIO, FLOW_ITEMS, FLOW_STEPS, FLOW_TOTAL_CENTS } from "./demo-flow";

describe("demo-flow", () => {
  it("tiene los cinco pasos en orden", () => {
    expect([...FLOW_STEPS]).toEqual(["pending", "progress", "items", "done", "paid"]);
  });

  it("el total es 135000 centavos y coincide con la suma de los conceptos", () => {
    expect(FLOW_TOTAL_CENTS).toBe(135_000);
    expect(FLOW_ITEMS.reduce((sum, item) => sum + item.cents, 0)).toBe(FLOW_TOTAL_CENTS);
  });

  it("el folio de demostración es T-0042", () => {
    expect(FLOW_FOLIO).toBe("T-0042");
  });
});
