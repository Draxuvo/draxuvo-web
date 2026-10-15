import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ScreenViewer } from "./screen-viewer";

function Host({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Ver pantalla</button>
      <ScreenViewer
        id="ordenes"
        alt="Lista de órdenes"
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      />
    </>
  );
}

const dialogo = () => document.querySelector("dialog") as HTMLDialogElement;
const imagen = () => screen.getByAltText("Lista de órdenes") as HTMLImageElement;

describe("ScreenViewer", () => {
  it("cerrado no está abierto", () => {
    renderWithProviders(<Host />);
    expect(dialogo()).not.toHaveAttribute("open");
  });

  it("al abrir llama a showModal y muestra la captura móvil por defecto", async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    renderWithProviders(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialogo()).toHaveAttribute("open");
    expect(screen.getByRole("dialog", { name: "Pantalla ampliada" })).toBeInTheDocument();
    expect(imagen()).toHaveAttribute("src", "/screens/ordenes-mobile.png");
    expect(dialogo().querySelector("source")).toHaveAttribute("srcset", "/screens/ordenes-desktop.png");
    showModal.mockRestore();
  });

  it("al cerrar devuelve el foco al elemento que lo abrió y avisa", async () => {
    const onClose = vi.fn();
    renderWithProviders(<Host onClose={onClose} />);
    const abrir = screen.getByRole("button", { name: "Ver pantalla" });
    await userEvent.click(abrir);
    screen.getByRole("button", { name: "Cerrar" }).focus();
    expect(abrir).not.toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(dialogo()).not.toHaveAttribute("open");
    // El <dialog> real emite "close" al cerrarse; jsdom no, así que se simula.
    fireEvent(dialogo(), new Event("close"));
    expect(abrir).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("los botones Acercar y Alejar alternan entre 1x y 2x", async () => {
    renderWithProviders(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
    expect(imagen().style.width).toBe("auto");
    expect(screen.getByRole("button", { name: "Alejar" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(screen.getByRole("button", { name: "Acercar" }));
    expect(imagen().style.width).toBe("200%");
    expect(screen.getByRole("button", { name: "Acercar" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(screen.getByRole("button", { name: "Alejar" }));
    expect(imagen().style.width).toBe("auto");
  });

  it("las teclas + y - acercan y alejan", async () => {
    renderWithProviders(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
    fireEvent.keyDown(dialogo(), { key: "+" });
    expect(imagen().style.width).toBe("200%");
    fireEvent.keyDown(dialogo(), { key: "-" });
    expect(imagen().style.width).toBe("auto");
    fireEvent.keyDown(dialogo(), { key: "=" });
    expect(imagen().style.width).toBe("200%");
  });

  it("al cerrar el zoom vuelve a 1x", async () => {
    renderWithProviders(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
    fireEvent.keyDown(dialogo(), { key: "+" });
    fireEvent(dialogo(), new Event("close"));
    expect(imagen().style.width).toBe("auto");
  });

  it("un clic en el fondo del diálogo lo cierra", async () => {
    renderWithProviders(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
    fireEvent.click(dialogo());
    expect(dialogo()).not.toHaveAttribute("open");
  });
});
