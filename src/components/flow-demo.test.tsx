import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FlowDemo } from "./flow-demo";

const siguiente = () => userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

describe("FlowDemo", () => {
  it("empieza en el paso 1 con Anterior deshabilitado", () => {
    renderWithProviders(<FlowDemo />);
    expect(screen.getAllByText("Paso 1 de 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Llega la orden")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.queryByText("Total")).toBeNull();
  });

  it("Siguiente avanza y muestra el responsable en el paso 2", async () => {
    renderWithProviders(<FlowDemo />);
    await siguiente();
    expect(screen.getByText("Se asigna y arranca")).toBeInTheDocument();
    expect(screen.getByText("Marco R.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });

  it("en el paso 3 aparecen los conceptos y el total de $1,350.00", async () => {
    renderWithProviders(<FlowDemo />);
    await siguiente();
    await siguiente();
    expect(screen.getByText("Mano de obra")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$1,350.00")).toBeInTheDocument();
  });

  it("Anterior regresa un paso", async () => {
    renderWithProviders(<FlowDemo />);
    await siguiente();
    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByText("Llega la orden")).toBeInTheDocument();
  });

  it("en el último paso muestra folio y sello, y Empezar de nuevo reinicia", async () => {
    renderWithProviders(<FlowDemo />);
    for (let i = 0; i < 4; i++) await siguiente();
    expect(screen.getAllByText("Paso 5 de 5").length).toBeGreaterThan(0);
    expect(screen.getByText("Folio T-0042")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    expect(screen.getAllByText("Paso 1 de 5").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pagado")).toBeNull();
  });

  it("los puntos del avance saltan directo a un paso", async () => {
    renderWithProviders(<FlowDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Se completa" }));
    expect(screen.getAllByText("Paso 4 de 5").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Se completa" })).toHaveAttribute("aria-current", "step");
  });

  it("las flechas del teclado avanzan y retroceden sin salirse de los límites", async () => {
    renderWithProviders(<FlowDemo />);
    const grupo = screen.getByRole("group", { name: /Demo del flujo/ });
    grupo.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Se asigna y arranca")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByText("Llega la orden")).toBeInTheDocument();
  });
});
