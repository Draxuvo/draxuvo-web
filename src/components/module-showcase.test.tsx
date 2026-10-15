import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("pasillo en escritorio", () => {
    // El contenedor mide 8000 px y el panel pegajoso 1000: cada módulo ocupa 1000 px de recorrido.
    const alturas = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get");
    afterEach(() => alturas.mockReset());

    function pintaPasillo() {
      alturas.mockImplementation(function (this: HTMLElement) {
        return this.style.height.startsWith("calc") ? 8000 : 1000;
      });
      setMediaMatches(DESKTOP, true);
      const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
      pinta();
      return scrollTo;
    }
    const top = (scrollTo: ReturnType<typeof vi.spyOn>, llamada = -1) => (scrollTo.mock.calls.at(llamada)![0] as ScrollToOptions).top!;

    it("un chip no navega por ancla: desplaza la página hasta su módulo", async () => {
      const scrollTo = pintaPasillo();
      await userEvent.click(screen.getByRole("link", { name: "Personal" }));
      const primero = top(scrollTo);
      await userEvent.click(screen.getByRole("link", { name: "Inventario" }));
      expect(top(scrollTo) - primero).toBe(2000);
      expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "smooth" }));
    });

    it("la flecha derecha pasa al módulo siguiente y la izquierda no baja del primero", () => {
      const scrollTo = pintaPasillo();
      const seccion = screen.getByRole("radio", { name: "Restaurante" }).closest("section")!;
      fireEvent.keyDown(seccion, { key: "ArrowLeft" });
      const primero = top(scrollTo);
      fireEvent.keyDown(seccion, { key: "ArrowRight" });
      expect(top(scrollTo) - primero).toBe(1000);
    });

    it("otras teclas y las flechas dentro de un radio no mueven el pasillo", () => {
      const scrollTo = pintaPasillo();
      const seccion = screen.getByRole("radio", { name: "Restaurante" }).closest("section")!;
      fireEvent.keyDown(seccion, { key: "Enter" });
      fireEvent.keyDown(screen.getByRole("radio", { name: "Café" }), { key: "ArrowRight" });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("al enfocar un módulo que no es el activo, el pasillo lo trae a la vista", () => {
      const scrollTo = pintaPasillo();
      fireEvent.focus(document.getElementById("modulo-inventory")!);
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });
  });

  describe("franja en pantalla chica", () => {
    it("las flechas desplazan la franja casi un ancho de pantalla", () => {
      pinta();
      const franja = screen.getByRole("group", { name: "Módulos" });
      const scrollBy = vi.fn();
      Object.defineProperty(franja, "scrollBy", { value: scrollBy });
      Object.defineProperty(franja, "clientWidth", { value: 300 });
      fireEvent.keyDown(franja, { key: "ArrowRight" });
      expect(scrollBy).toHaveBeenLastCalledWith({ left: 264, behavior: "smooth" });
      fireEvent.keyDown(franja, { key: "ArrowLeft" });
      expect(scrollBy).toHaveBeenLastCalledWith({ left: -264, behavior: "smooth" });
    });

    it("un chip sigue siendo un enlace normal a su módulo", async () => {
      const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
      pinta();
      const evento = new MouseEvent("click", { bubbles: true, cancelable: true });
      screen.getByRole("link", { name: "Personal" }).dispatchEvent(evento);
      expect(evento.defaultPrevented).toBe(false);
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});
