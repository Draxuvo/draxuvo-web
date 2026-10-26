import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoUrl } from "@/lib/plans";
import { renderWithProviders } from "@/test/render";
import { Hero } from "./hero";
import { SiteHeader } from "./site-header";

vi.mock("./section-focus", () => ({ SectionFocus: () => null }));

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_UI_URL", "https://panel.example.com"));
afterEach(() => vi.unstubAllEnvs());

describe("«Probar demo» (spec 039)", () => {
  it("demoUrl apunta a la ruta pública de la demo del panel, con o sin plan", () => {
    expect(demoUrl("es")).toBe("https://panel.example.com/es/demo");
    expect(demoUrl("en", "pro")).toBe("https://panel.example.com/en/demo?plan=pro");
  });

  it("el encabezado y el héroe llevan a la demo en el idioma de la página", () => {
    renderWithProviders(<SiteHeader locale="es" />);
    expect(screen.getByRole("link", { name: "Probar demo" })).toHaveAttribute("href", "https://panel.example.com/es/demo");
  });

  it("el héroe ofrece la demo", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole("link", { name: "Probar demo" })).toHaveAttribute("href", "https://panel.example.com/es/demo");
  });

  it("en inglés dicen Try the demo", () => {
    renderWithProviders(<Hero />, "en");
    expect(screen.getByRole("link", { name: "Try the demo" })).toBeInTheDocument();
  });
});
