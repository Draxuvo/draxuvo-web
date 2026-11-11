import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import type { PublicMenu as Menu } from "@/lib/public-menu";
import { PublicMenu } from "./public-menu";

const MENU: Menu = {
  business: { name: "Sazón Centro" },
  table: { name: "Mesa 4" },
  categories: [
    {
      name: "Bebidas",
      items: [
        { name: "Café de olla", description: "Con canela", price_cents: 3500, icon: "coffee", sold_out: false },
        { name: "Agua de horchata", description: null, price_cents: 2500, icon: null, sold_out: false },
      ],
    },
    {
      name: "Platillos",
      items: [
        { name: "Sopa del día", description: null, price_cents: 5500, icon: "soup", sold_out: false },
        { name: "Tacos al pastor", description: null, price_cents: 7000, icon: "taco", sold_out: true },
      ],
    },
  ],
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function mockFetch(...responses: Response[]) {
  const fn = vi.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("PublicMenu", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows the business, the table and the menu by category", async () => {
    mockFetch(reply(200, MENU));
    renderWithProviders(<PublicMenu token="tok" />);

    expect(await screen.findByRole("heading", { level: 1, name: "Sazón Centro" })).toBeInTheDocument();
    expect(screen.getByText("Mesa 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Bebidas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Platillos" })).toBeInTheDocument();
    expect(screen.getByText("Con canela")).toBeInTheDocument();
    expect(screen.getByText("$35.00")).toBeInTheDocument();
    expect(document.title).toBe("Sazón Centro · Menú");
  });

  it("labels numeric table names and keeps other names as they are", async () => {
    mockFetch(reply(200, { ...MENU, table: { name: "7" } }));
    const { unmount } = renderWithProviders(<PublicMenu token="tok" />);
    expect(await screen.findByText("Mesa 7")).toBeInTheDocument();
    unmount();

    mockFetch(reply(200, { ...MENU, table: { name: "Terraza" } }));
    renderWithProviders(<PublicMenu token="tok" />);
    expect(await screen.findByText("Terraza")).toBeInTheDocument();
    expect(screen.queryByText("Mesa Terraza")).not.toBeInTheDocument();
  });

  it("marks sold out dishes", async () => {
    mockFetch(reply(200, MENU));
    renderWithProviders(<PublicMenu token="tok" />);

    const tacos = (await screen.findByText("Tacos al pastor")).closest("li")!;
    expect(within(tacos).getByText("Agotado")).toBeInTheDocument();
    expect(tacos).toHaveClass("opacity-60");
    const sopa = screen.getByText("Sopa del día").closest("li")!;
    expect(within(sopa).queryByText("Agotado")).not.toBeInTheDocument();
  });

  it("filters by category chip and by search", async () => {
    const user = userEvent.setup();
    mockFetch(reply(200, MENU));
    renderWithProviders(<PublicMenu token="tok" />);
    await screen.findByText("Café de olla");

    await user.click(screen.getByRole("button", { name: "Platillos" }));
    expect(screen.getByRole("button", { name: "Platillos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Café de olla")).not.toBeInTheDocument();
    expect(screen.getByText("Sopa del día")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todo" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar en el menú" }), "cafe");
    expect(screen.getByText("Café de olla")).toBeInTheDocument();
    expect(screen.queryByText("Sopa del día")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "pizza");
    expect(screen.getByText("No hay platillos que coincidan.")).toBeInTheDocument();
  });

  it("is read only and has no Draxuvo branding", async () => {
    mockFetch(reply(200, MENU));
    const { container } = renderWithProviders(<PublicMenu token="tok" />);
    await screen.findByText("Café de olla");

    expect(container.textContent).not.toMatch(/draxuvo/i);
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons).toEqual(["Todo", "Bebidas", "Platillos"]);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the invalid link notice", async () => {
    mockFetch(reply(404, { error: { details: { code: "menu_link_invalid" } } }));
    renderWithProviders(<PublicMenu token="tok" />);

    expect(await screen.findByText("Este enlace no es válido.")).toBeInTheDocument();
    expect(screen.getByText("Pide el menú al personal.")).toBeInTheDocument();
    expect(document.title).toBe("Menú");
  });

  it("shows the unavailable notice without products", async () => {
    mockFetch(reply(403, { error: { details: { code: "menu_unavailable" } } }));
    renderWithProviders(<PublicMenu token="tok" />);

    expect(await screen.findByText("El menú no está disponible por el momento.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the empty menu notice", async () => {
    mockFetch(reply(200, { ...MENU, categories: [] }));
    renderWithProviders(<PublicMenu token="tok" />);

    expect(await screen.findByText("Este menú aún no tiene platillos.")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("offers to retry after an error and then shows the menu", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(reply(429, {}), reply(200, MENU));
    renderWithProviders(<PublicMenu token="tok" />);

    await user.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Café de olla")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses English texts on an English phone", async () => {
    mockFetch(reply(200, MENU));
    renderWithProviders(<PublicMenu token="tok" />, "en");

    expect(await screen.findByText("Sold out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });
  describe("photos (spec 061)", () => {
    const PHOTOS: Menu = {
      business: { name: "Sazón Centro" },
      table: { name: "Mesa 4" },
      categories: [
        {
          name: "Platillos",
          items: [
            { name: "Enchiladas suizas", description: "Con crema", price_cents: 14500, icon: "taco", sold_out: false, photo: { style: "card", url: "https://fotos.test/enchiladas-card" } },
            { name: "Pozole rojo", description: null, price_cents: 16000, icon: "soup", sold_out: false, photo: { style: "thumbnail", url: "https://fotos.test/pozole-card", thumbnail_url: "https://fotos.test/pozole-thumb" } },
            { name: "Sopa del día", description: null, price_cents: 5500, icon: "soup", sold_out: false, photo: null },
            { name: "Flautas", description: null, price_cents: 9000, icon: "taco", sold_out: true, photo: { style: "card", url: "https://fotos.test/flautas-card" } },
          ],
        },
        { name: "Bebidas", items: [{ name: "Café de olla", description: null, price_cents: 3500, icon: "coffee", sold_out: false, photo: null }] },
      ],
    };

    beforeEach(() => {
      // jsdom no implementa <dialog>.showModal / close.
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute("open", "");
      };
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute("open");
      };
    });

    it("shows a card photo 4:3, lazily, with the dish name as alt", async () => {
      mockFetch(reply(200, PHOTOS));
      renderWithProviders(<PublicMenu token="tok" />);

      const img = await screen.findByRole("img", { name: "Enchiladas suizas" });
      expect(img).toHaveAttribute("src", "https://fotos.test/enchiladas-card");
      expect(img).toHaveAttribute("loading", "lazy");
      expect(img.parentElement).toHaveClass("aspect-[4/3]");
      // La foto de una tarjeta no se toca.
      expect(img.closest("button")).toBeNull();
    });

    it("shows a thumbnail button that opens the large photo with name and price, and closes it", async () => {
      mockFetch(reply(200, PHOTOS));
      const back = vi.spyOn(window.history, "back").mockImplementation(() => window.dispatchEvent(new PopStateEvent("popstate")));
      const user = userEvent.setup();
      renderWithProviders(<PublicMenu token="tok" />);

      const thumb = await screen.findByRole("button", { name: "Ver foto de Pozole rojo" });
      expect(within(thumb).getByRole("img", { name: "Pozole rojo" })).toHaveAttribute("src", "https://fotos.test/pozole-thumb");
      expect(document.querySelector('img[src="https://fotos.test/pozole-card"]')).toBeNull();

      await user.click(thumb);
      const viewer = screen.getByRole("dialog", { name: "Pozole rojo" });
      expect(within(viewer).getByRole("img", { name: "Pozole rojo" })).toHaveAttribute("src", "https://fotos.test/pozole-card");
      expect(within(viewer).getByText("$160.00")).toBeInTheDocument();

      await user.click(within(viewer).getByRole("button", { name: "Cerrar" }));
      expect(back).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes the large photo with the phone back button", async () => {
      mockFetch(reply(200, PHOTOS));
      const push = vi.spyOn(window.history, "pushState");
      const user = userEvent.setup();
      renderWithProviders(<PublicMenu token="tok" />);

      await user.click(await screen.findByRole("button", { name: "Ver foto de Pozole rojo" }));
      expect(push).toHaveBeenCalled();
      window.dispatchEvent(new PopStateEvent("popstate"));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("shows the icon when a photo fails to load", async () => {
      mockFetch(reply(200, PHOTOS));
      renderWithProviders(<PublicMenu token="tok" />);

      const img = await screen.findByRole("img", { name: "Enchiladas suizas" });
      fireEvent.error(img);
      expect(screen.queryByRole("img", { name: "Enchiladas suizas" })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "Enchiladas suizas" })).toBeInTheDocument();
    });

    it("keeps sold out dishes with photo dimmed and marked", async () => {
      mockFetch(reply(200, PHOTOS));
      renderWithProviders(<PublicMenu token="tok" />);

      const flautas = (await screen.findByRole("img", { name: "Flautas" })).closest("li")!;
      expect(flautas).toHaveClass("opacity-60");
      expect(within(flautas).getByText("Agotado")).toBeInTheDocument();
    });

    it("search and category filters also cut cards and thumbnails", async () => {
      mockFetch(reply(200, PHOTOS));
      const user = userEvent.setup();
      renderWithProviders(<PublicMenu token="tok" />);

      await screen.findByRole("img", { name: "Enchiladas suizas" });
      await user.type(screen.getByRole("searchbox", { name: "Buscar en el menú" }), "pozole");
      expect(screen.queryByRole("img", { name: "Enchiladas suizas" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ver foto de Pozole rojo" })).toBeInTheDocument();

      await user.clear(screen.getByRole("searchbox"));
      await user.click(screen.getByRole("button", { name: "Bebidas" }));
      expect(screen.queryByRole("button", { name: "Ver foto de Pozole rojo" })).not.toBeInTheDocument();
      expect(screen.getByText("Café de olla")).toBeInTheDocument();
    });
  });
});
