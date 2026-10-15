import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_PLANS, registrationUrl } from "@/lib/plans";
import { renderWithProviders } from "@/test/render";
import { PricingSection } from "./pricing-section";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_UI_URL", "https://panel.example.com");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const pinta = () => renderWithProviders(<PricingSection catalog={FALLBACK_PLANS} />);
const tarjeta = (nombre: string) => screen.getByRole("heading", { name: nombre }).closest("div[aria-labelledby]") as HTMLElement;

describe("PricingSection", () => {
  it("muestra los tres planes con precio mensual, IVA y total", () => {
    pinta();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Básico", "Pro", "Empresa"]);
    const basico = within(tarjeta("Básico"));
    expect(basico.getByText("$63.84")).toBeInTheDocument();
    expect(basico.getByText("$462.84")).toBeInTheDocument();
    expect(basico.getByText(/al mes/)).toBeInTheDocument();
  });

  it("el ciclo mensual está activo al inicio", () => {
    pinta();
    expect(screen.getByRole("button", { name: "Mensual" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Anual/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("cambiar a anual cambia los importes y la leyenda de periodo", async () => {
    pinta();
    await userEvent.click(screen.getByRole("button", { name: /Anual/ }));
    const basico = within(tarjeta("Básico"));
    expect(basico.getByText("$638.40")).toBeInTheDocument();
    expect(basico.getByText("$4,628.40")).toBeInTheDocument();
    expect(basico.queryByText("$462.84")).toBeNull();
    expect(basico.getByText(/al año/)).toBeInTheDocument();
  });

  it("los enlaces de registro llevan el plan y el ciclo", async () => {
    pinta();
    const enlaces = screen.getAllByRole("link", { name: "Crear cuenta con este plan" });
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual([
      registrationUrl("es", "basic", "monthly"),
      registrationUrl("es", "pro", "monthly"),
      registrationUrl("es", "enterprise", "monthly"),
    ]);
    expect(enlaces[1]).toHaveAttribute("href", "https://panel.example.com/es/registro?plan=pro&ciclo=mensual");

    await userEvent.click(screen.getByRole("button", { name: /Anual/ }));
    expect(screen.getAllByRole("link", { name: "Crear cuenta con este plan" })[2]).toHaveAttribute(
      "href",
      "https://panel.example.com/es/registro?plan=enterprise&ciclo=anual",
    );
  });

  it("sin buscador activo el plan Pro lleva el sello Recomendado", () => {
    pinta();
    expect(screen.getAllByText("Recomendado")).toHaveLength(1);
    expect(within(tarjeta("Pro")).getByText("Recomendado")).toBeInTheDocument();
    expect(screen.queryByText("Te conviene")).toBeNull();
  });

  it("el plan sugerido por el buscador recibe el sello Te conviene", async () => {
    pinta();
    await userEvent.click(screen.getByRole("checkbox", { name: "Mando tickets por WhatsApp" }));
    expect(screen.getAllByText("Te conviene")).toHaveLength(1);
    expect(within(tarjeta("Empresa")).getByText("Te conviene")).toBeInTheDocument();
    expect(screen.queryByText("Recomendado")).toBeNull();
  });

  it("al quitar la selección vuelve el sello Recomendado", async () => {
    pinta();
    await userEvent.click(screen.getByRole("checkbox", { name: "Mando tickets por WhatsApp" }));
    await userEvent.click(screen.getByRole("button", { name: "Quitar selección" }));
    expect(screen.queryByText("Te conviene")).toBeNull();
    expect(screen.getByText("Recomendado")).toBeInTheDocument();
  });

  it("la nota aclara moneda e IVA", () => {
    pinta();
    expect(screen.getByText(/Precios en pesos mexicanos \(MXN\) más IVA del 16%\./)).toBeInTheDocument();
  });
});
