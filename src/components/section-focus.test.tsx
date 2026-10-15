import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SectionFocus } from "./section-focus";

function pagina() {
  document.body.innerHTML = `
    <a id="enlace" href="#precios">Precios</a>
    <a id="roto" href="#no-existe">Nada</a>
    <a id="externo" href="https://example.com/#precios">Fuera</a>
    <section id="precios"><h2 id="titulo">Precios</h2></section>
    <h2 id="suelto">Suelto</h2>
    <div id="sin-titulo">Sin encabezado</div>`;
}

beforeEach(() => {
  vi.useFakeTimers();
  pagina();
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("SectionFocus", () => {
  it("al hacer clic en un ancla enfoca el título de la sección tras un tick", () => {
    render(<SectionFocus />);
    act(() => document.getElementById("enlace")!.click());
    expect(document.getElementById("titulo")).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(0));
    const titulo = document.getElementById("titulo")!;
    expect(titulo).toHaveAttribute("tabindex", "-1");
    expect(titulo).toHaveFocus();
  });

  it("si el destino es un título lo enfoca a él mismo", () => {
    render(<SectionFocus />);
    window.location.hash = "#suelto";
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(document.getElementById("suelto")).toHaveFocus();
  });

  it("si la sección no tiene título enfoca la propia sección", () => {
    render(<SectionFocus />);
    window.location.hash = "#sin-titulo";
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(document.getElementById("sin-titulo")).toHaveFocus();
  });

  it("respeta un tabindex que ya existía", () => {
    document.getElementById("titulo")!.setAttribute("tabindex", "0");
    render(<SectionFocus />);
    act(() => document.getElementById("enlace")!.click());
    act(() => vi.advanceTimersByTime(0));
    expect(document.getElementById("titulo")).toHaveAttribute("tabindex", "0");
  });

  it("con un id desconocido no mueve el foco", () => {
    render(<SectionFocus />);
    const antes = document.activeElement;
    act(() => document.getElementById("roto")!.click());
    act(() => vi.advanceTimersByTime(0));
    expect(document.activeElement).toBe(antes);
  });

  it("ignora los enlaces que no son anclas internas", () => {
    render(<SectionFocus />);
    const antes = document.activeElement;
    act(() => document.getElementById("externo")!.click());
    act(() => vi.advanceTimersByTime(0));
    expect(document.activeElement).toBe(antes);
  });

  it("al desmontar deja de escuchar", () => {
    const { unmount } = render(<SectionFocus />);
    unmount();
    act(() => document.getElementById("enlace")!.click());
    act(() => vi.advanceTimersByTime(0));
    expect(document.getElementById("titulo")).not.toHaveFocus();
  });
});
