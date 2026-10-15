import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("une clases y descarta valores falsos", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("resuelve conflictos de Tailwind dejando la última clase", () => {
    expect(cn("px-2", "px-6")).toBe("px-6");
  });
});
