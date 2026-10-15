import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { type DragSpy, newDragSpy } from "@/test/motion-drag";
import { ProductCarousel } from "./product-carousel";

const spy = vi.hoisted(() => ({ onDragEnd: {}, starts: 0, animations: [], values: [] }) as DragSpy);
vi.mock("motion/react", async () => (await import("@/test/motion-drag")).motionDragMock(spy));

const posicion = (n: number) => screen.getByText(`${n} de 5`);
const dispararArrastre = (x: number, velocidad = 0) =>
  act(() => spy.onDragEnd.x?.({}, { offset: { x, y: 0 }, velocity: { x: velocidad, y: 0 } }));

const ANCHO = 400;
const original = globalThis.ResizeObserver;

beforeEach(() => {
  Object.assign(spy, newDragSpy());
  // El marco mide 400 px: el umbral de arrastre es la cuarta parte, 100 px.
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => ANCHO });
  globalThis.ResizeObserver = class {
    constructor(private callback: () => void) {}
    observe() { this.callback(); }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  vi.useRealTimers();
  globalThis.ResizeObserver = original;
  Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
});

describe("ProductCarousel", () => {
  it("empieza en la primera de cinco pantallas", () => {
    renderWithProviders(<ProductCarousel />);
    expect(screen.getByRole("region", { name: "Pantallas del panel" })).toBeInTheDocument();
    expect(posicion(1)).toBeInTheDocument();
    expect(screen.getAllByRole("group", { name: /de 5$/ })).toHaveLength(5);
  });

  it("solo la pantalla activa es interactiva; las demás quedan inertes", () => {
    renderWithProviders(<ProductCarousel />);
    const slides = screen.getAllByRole("group", { name: /de 5$/, hidden: true });
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides.slice(1).every((slide) => slide.hasAttribute("inert"))).toBe(true);
  });

  it("Siguiente y Anterior dan la vuelta al llegar al borde", async () => {
    renderWithProviders(<ProductCarousel />);
    await userEvent.click(screen.getByRole("button", { name: "Pantalla anterior" }));
    expect(posicion(5)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Siguiente pantalla" }));
    expect(posicion(1)).toBeInTheDocument();
  });

  it("los puntos llevan a su pantalla y marcan la actual", async () => {
    renderWithProviders(<ProductCarousel />);
    await userEvent.click(screen.getByRole("button", { name: "Ver la pantalla 3" }));
    expect(posicion(3)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver la pantalla 3" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Ver la pantalla 1" })).not.toHaveAttribute("aria-current");
  });

  it("las flechas, Inicio y Fin del teclado mueven el carrusel", () => {
    renderWithProviders(<ProductCarousel />);
    const region = screen.getByRole("region", { name: "Pantallas del panel" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(posicion(2)).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(posicion(1)).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "End" });
    expect(posicion(5)).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "Home" });
    expect(posicion(1)).toBeInTheDocument();
  });

  it("otras teclas no se atrapan", () => {
    renderWithProviders(<ProductCarousel />);
    const evento = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    screen.getByRole("region", { name: "Pantallas del panel" }).dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(false);
  });

  describe("arrastre", () => {
    it("un arrastre largo a la izquierda avanza una pantalla, sin dar la vuelta", () => {
      renderWithProviders(<ProductCarousel />);
      dispararArrastre(-300);
      expect(posicion(2)).toBeInTheDocument();
    });

    it("un arrastre largo a la derecha en la primera pantalla se queda donde está", () => {
      renderWithProviders(<ProductCarousel />);
      dispararArrastre(300);
      expect(posicion(1)).toBeInTheDocument();
    });

    it("un arrastre corto regresa a la misma pantalla", () => {
      renderWithProviders(<ProductCarousel />);
      dispararArrastre(-60);
      expect(posicion(1)).toBeInTheDocument();
      expect(spy.animations.at(-1)).toBe(-0);
    });

    it("al acomodarse se desplaza el ancho medido por cada pantalla", () => {
      renderWithProviders(<ProductCarousel />);
      dispararArrastre(-300);
      expect(spy.animations.at(-1)).toBe(-ANCHO);
    });

    it("la velocidad del gesto cuenta aunque el desplazamiento sea corto", () => {
      renderWithProviders(<ProductCarousel />);
      // Con el marco medido en 0 px cualquier proyección distinta de cero cruza el umbral.
      dispararArrastre(-1, -2000);
      expect(posicion(2)).toBeInTheDocument();
      dispararArrastre(1, 2000);
      expect(posicion(1)).toBeInTheDocument();
    });

    it("en la última pantalla un arrastre a la izquierda no da la vuelta", () => {
      renderWithProviders(<ProductCarousel />);
      fireEvent.keyDown(screen.getByRole("region", { name: "Pantallas del panel" }), { key: "End" });
      dispararArrastre(-300);
      expect(posicion(5)).toBeInTheDocument();
    });
  });

  describe("reproducción automática", () => {
    it("avanza sola cada 6 segundos", () => {
      vi.useFakeTimers();
      renderWithProviders(<ProductCarousel />);
      act(() => vi.advanceTimersByTime(6000));
      expect(posicion(2)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(6000));
      expect(posicion(3)).toBeInTheDocument();
    });

    it("se detiene con el cursor encima y sigue al salir", () => {
      vi.useFakeTimers();
      renderWithProviders(<ProductCarousel />);
      const region = screen.getByRole("region", { name: "Pantallas del panel" });
      fireEvent.mouseEnter(region);
      act(() => vi.advanceTimersByTime(20000));
      expect(posicion(1)).toBeInTheDocument();
      fireEvent.mouseLeave(region);
      act(() => vi.advanceTimersByTime(6000));
      expect(posicion(2)).toBeInTheDocument();
    });

    it("se detiene mientras el foco está dentro", () => {
      vi.useFakeTimers();
      renderWithProviders(<ProductCarousel />);
      fireEvent.focus(screen.getByRole("button", { name: "Siguiente pantalla" }));
      act(() => vi.advanceTimersByTime(20000));
      expect(posicion(1)).toBeInTheDocument();
    });

    it("no avanza con el visor abierto", async () => {
      renderWithProviders(<ProductCarousel />);
      await userEvent.click(screen.getAllByRole("button", { name: "Ampliar pantalla" })[0]);
      vi.useFakeTimers();
      act(() => vi.advanceTimersByTime(20000));
      expect(posicion(1)).toBeInTheDocument();
    });
  });

  it("el botón Ampliar abre el visor con la captura de esa pantalla", async () => {
    renderWithProviders(<ProductCarousel />);
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
    await userEvent.click(screen.getByRole("button", { name: "Siguiente pantalla" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Ampliar pantalla" })[1]);
    expect(document.querySelector("dialog")).toHaveAttribute("open");
    expect(document.querySelector("dialog img")?.getAttribute("src")).toContain("ordenes");
  });
});
