import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Need } from "@/lib/plans";
import { renderWithProviders } from "@/test/render";
import { PlanFinder } from "./plan-finder";

function pinta(props: Partial<React.ComponentProps<typeof PlanFinder>> = {}) {
  const onToggle = vi.fn();
  const onClear = vi.fn();
  renderWithProviders(<PlanFinder needs={[]} onToggle={onToggle} onClear={onClear} suggestedName={null} {...props} />);
  return { onToggle, onClear };
}

describe("PlanFinder", () => {
  it("muestra las cuatro necesidades y el mensaje inicial", () => {
    pinta();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByText("Marca lo que necesitas y el plan que conviene se adelanta.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar selección" })).toBeNull();
  });

  it("marcar una necesidad avisa con su clave", async () => {
    const { onToggle } = pinta();
    await userEvent.click(screen.getByRole("checkbox", { name: "Cobro con tickets" }));
    expect(onToggle).toHaveBeenCalledWith("tickets");
  });

  it("con necesidades y un plan sugerido anuncia la razón", () => {
    pinta({ needs: ["work_orders", "tickets"], suggestedName: "Pro" });
    expect(
      screen.getByText("El plan Pro es el más barato que incluye Llevo órdenes de trabajo; Cobro con tickets."),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Cobro con tickets" })).toBeChecked();
  });

  it("si ningún plan cubre todo lo marcado lo dice", () => {
    pinta({ needs: ["whatsapp"], suggestedName: null });
    expect(screen.getByText(/Ningún plan cubre todo lo que marcaste/)).toBeInTheDocument();
  });

  it("Quitar selección limpia las necesidades", async () => {
    const { onClear } = pinta({ needs: ["whatsapp"], suggestedName: "Empresa" });
    await userEvent.click(screen.getByRole("button", { name: "Quitar selección" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("el mensaje en vivo cambia al marcar y desmarcar", async () => {
    function Wrapper() {
      const [needs, setNeeds] = useState<Need[]>([]);
      return (
        <PlanFinder
          needs={needs}
          onToggle={(n) => setNeeds((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]))}
          onClear={() => setNeeds([])}
          suggestedName={needs.length ? "Empresa" : null}
        />
      );
    }
    renderWithProviders(<Wrapper />);
    const region = screen.getByText(/Marca lo que necesitas/);
    expect(region).toHaveAttribute("aria-live", "polite");
    await userEvent.click(screen.getByRole("checkbox", { name: "Tengo más de una empresa" }));
    expect(region).toHaveTextContent("El plan Empresa es el más barato que incluye Tengo más de una empresa.");
    await userEvent.click(screen.getByRole("checkbox", { name: "Tengo más de una empresa" }));
    expect(region).toHaveTextContent("Marca lo que necesitas");
  });
});
