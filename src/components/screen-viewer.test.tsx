import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { type DragSpy, newDragSpy } from "@/test/motion-drag";
import { ScreenViewer } from "./screen-viewer";

const spy = vi.hoisted(() => ({ onDragEnd: {}, starts: 0, animations: [], values: [] }) as DragSpy);
vi.mock("motion/react", async () => (await import("@/test/motion-drag")).motionDragMock(spy));

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

const area = () => imagen().closest("div") as HTMLElement;
const toque = (time: number, x = 100, y = 100, pointerType = "touch") => {
  const event = new Event("pointerup", { bubbles: true });
  // jsdom no trae PointerEvent con estos campos y timeStamp es de solo lectura.
  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    clientX: { value: x },
    clientY: { value: y },
    timeStamp: { value: time },
  });
  fireEvent(area(), event);
};

describe("ScreenViewer", () => {
  beforeEach(() => Object.assign(spy, newDragSpy()));

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

  describe("doble toque", () => {
    it("dos toques seguidos y cercanos acercan, y otros dos alejan", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      toque(1000);
      toque(1200);
      expect(imagen().style.width).toBe("200%");
      toque(3000);
      toque(3100);
      expect(imagen().style.width).toBe("auto");
    });

    it("un solo toque no cambia el zoom", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      toque(1000);
      expect(imagen().style.width).toBe("auto");
    });

    it("dos toques separados más de 300 ms no cuentan como doble", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      toque(1000);
      toque(1400);
      expect(imagen().style.width).toBe("auto");
    });

    it("dos toques lejos uno del otro no cuentan como doble", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      toque(1000, 100, 100);
      toque(1100, 200, 100);
      expect(imagen().style.width).toBe("auto");
    });

    it("el ratón no dispara el doble toque", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      toque(1000, 100, 100, "mouse");
      toque(1100, 100, 100, "mouse");
      expect(imagen().style.width).toBe("auto");
    });
  });

  describe("arrastrar el asa hacia abajo", () => {
    const soltar = (y: number, velocidad = 0) => spy.onDragEnd.y?.({}, { offset: { x: 0, y }, velocity: { x: 0, y: velocidad } });

    it("un arrastre largo cierra el visor", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      soltar(200);
      expect(dialogo()).not.toHaveAttribute("open");
    });

    it("un gesto rápido y corto también lo cierra", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      soltar(20, 900);
      expect(dialogo()).not.toHaveAttribute("open");
    });

    it("un arrastre corto y lento lo deja abierto", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      soltar(60, 100);
      expect(dialogo()).toHaveAttribute("open");
    });

    it("al tocar el asa empieza el arrastre", async () => {
      renderWithProviders(<Host />);
      await userEvent.click(screen.getByRole("button", { name: "Ver pantalla" }));
      fireEvent.pointerDown(screen.getByText(/Pellizca o toca dos veces/).parentElement!);
      expect(spy.starts).toBe(1);
    });
  });
});
