import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FALLBACK_PLANS } from "@/lib/plans";
import { setMediaMatches } from "@/test/setup";
import { renderWithProviders } from "@/test/render";
import { ModuleShowcase } from "./module-showcase";

const REDUCE = "(prefers-reduced-motion: reduce)";
const DESKTOP = "(min-width: 1024px)";

const pinta = () => renderWithProviders(<ModuleShowcase catalog={FALLBACK_PLANS} />);

describe("ModuleShowcase", () => {
  describe("modo lista (reducir movimiento)", () => {
    it("pinta los ocho módulos como artículos apilados, sin franja ni pasillo", () => {
      setMediaMatches(REDUCE, true);
      pinta();
      expect(screen.getAllByRole("article")).toHaveLength(8);
      expect(screen.queryByRole("group", { name: "Módulos" })).toBeNull();
      expect(screen.queryByText("Desliza para ver más módulos")).toBeNull();
      expect(screen.queryByText("1 de 8")).toBeNull();
    });

    it("cada módulo muestra título, problema, funciones, ejemplos por giro y el plan que lo incluye", () => {
      setMediaMatches(REDUCE, true);
      pinta();
      const personal = within(document.getElementById("modulo-employees")!);
      expect(personal.getByRole("heading", { level: 3, name: "Personal" })).toBeInTheDocument();
      expect(personal.getByText("Incluido desde el plan Básico")).toBeInTheDocument();
      expect(personal.getByText("El problema")).toBeInTheDocument();
      expect(personal.getByText("Expediente por persona con puesto, área, salario, correo y teléfono")).toBeInTheDocument();
      expect(personal.getByText("Restaurante")).toBeInTheDocument();
      expect(personal.getByText("Café")).toBeInTheDocument();
      expect(personal.getByText("Servicios técnicos")).toBeInTheDocument();

      const whatsapp = within(document.getElementById("modulo-whatsapp")!);
      expect(whatsapp.getByText("Incluido desde el plan Empresa")).toBeInTheDocument();
    });

    it("la navegación por chips enlaza a cada módulo", () => {
      setMediaMatches(REDUCE, true);
      pinta();
      const nav = within(screen.getByRole("navigation", { name: "Qué trae cada módulo" }));
      const enlaces = nav.getAllByRole("link");
      expect(enlaces).toHaveLength(8);
      expect(nav.getByRole("link", { name: "Personal" })).toHaveAttribute("href", "#modulo-employees");
    });

    it("el enlace de registro apunta al registro del panel", () => {
      setMediaMatches(REDUCE, true);
      pinta();
      const [primero] = screen.getAllByRole("link", { name: "Crear cuenta y probarlo" });
      expect(primero.getAttribute("href")).toMatch(/\/es\/registro$/);
    });
  });

  describe("elección de giro", () => {
    it("Restaurante viene marcado y se puede cambiar de giro", async () => {
      setMediaMatches(REDUCE, true);
      pinta();
      expect(screen.getByRole("radio", { name: "Restaurante" })).toBeChecked();
      await userEvent.click(screen.getByRole("radio", { name: "Café" }));
      expect(screen.getByRole("radio", { name: "Café" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Restaurante" })).not.toBeChecked();
    });
  });

  describe("selección de modo", () => {
    it("en pantalla chica sin reducir movimiento usa la franja con gesto lateral", () => {
      pinta();
      expect(screen.getByRole("group", { name: "Módulos" })).toBeInTheDocument();
      expect(screen.getByText("Desliza para ver más módulos")).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(8);
      expect(screen.queryByText("1 de 8")).toBeNull();
    });

    it("en escritorio sin reducir movimiento usa el pasillo y muestra la posición", () => {
      setMediaMatches(DESKTOP, true);
      pinta();
      expect(screen.getByText("1 de 8")).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Módulos" })).toBeNull();
      expect(screen.getAllByRole("article")).toHaveLength(8);
    });

    it("reducir movimiento gana sobre el escritorio", () => {
      setMediaMatches(DESKTOP, true);
      setMediaMatches(REDUCE, true);
      pinta();
      expect(screen.queryByText("1 de 8")).toBeNull();
      expect(screen.queryByRole("group", { name: "Módulos" })).toBeNull();
    });
  });
});
