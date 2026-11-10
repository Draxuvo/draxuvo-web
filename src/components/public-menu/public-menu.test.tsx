import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
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
});
