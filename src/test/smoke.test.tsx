import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanFinder } from "@/components/plan-finder";
import { renderWithProviders } from "./render";

describe("corredor de pruebas", () => {
  it("pinta un componente con mensajes reales en español", () => {
    renderWithProviders(<PlanFinder needs={[]} onToggle={vi.fn()} onClear={vi.fn()} suggestedName={null} />);

    expect(screen.getByText("¿Qué necesitas? Te decimos qué plan conviene")).toBeInTheDocument();
    expect(screen.getByLabelText("Llevo órdenes de trabajo")).toBeInTheDocument();
    expect(screen.getByText("Marca lo que necesitas y el plan que conviene se adelanta.")).toBeInTheDocument();
  });

  it("acepta el locale en", () => {
    renderWithProviders(<PlanFinder needs={[]} onToggle={vi.fn()} onClear={vi.fn()} suggestedName={null} />, "en");

    expect(screen.queryByText("¿Qué necesitas? Te decimos qué plan conviene")).not.toBeInTheDocument();
  });
});
