import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { categoryColor, fetchPublicMenu, filterMenu, formatPrice, type PublicMenu } from "./public-menu";

const MENU: PublicMenu = {
  business: { name: "Sazón" },
  table: { name: "Mesa 4" },
  categories: [
    {
      name: "Bebidas",
      items: [
        { name: "Café de olla", description: null, price_cents: 3500, icon: "coffee", sold_out: false },
        { name: "Agua de horchata", description: "Natural", price_cents: 2500, icon: null, sold_out: false },
      ],
    },
    {
      name: "Platillos",
      items: [{ name: "Tacos al pastor", description: null, price_cents: 7000, icon: "taco", sold_out: true }],
    },
  ],
};

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("fetchPublicMenu", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the menu and asks the API without cache", async () => {
    const fetchMock = respond(200, MENU);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicMenu("abc_123")).resolves.toEqual({ kind: "ok", menu: MENU });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/public/menus/abc_123",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("maps 404 menu_link_invalid to invalid", async () => {
    vi.stubGlobal("fetch", respond(404, { error: { details: { code: "menu_link_invalid" } } }));
    await expect(fetchPublicMenu("x")).resolves.toEqual({ kind: "invalid" });
  });

  it("maps 403 menu_unavailable to unavailable", async () => {
    vi.stubGlobal("fetch", respond(403, { error: { details: { code: "menu_unavailable" } } }));
    await expect(fetchPublicMenu("x")).resolves.toEqual({ kind: "unavailable" });
  });

  it("treats 429, server errors and network failures as error", async () => {
    vi.stubGlobal("fetch", respond(429, { error: {} }));
    await expect(fetchPublicMenu("x")).resolves.toEqual({ kind: "error" });

    vi.stubGlobal("fetch", respond(500, "boom"));
    await expect(fetchPublicMenu("x")).resolves.toEqual({ kind: "error" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchPublicMenu("x")).resolves.toEqual({ kind: "error" });
  });
});

describe("filterMenu", () => {
  it("keeps everything with no category and no query", () => {
    expect(filterMenu(MENU.categories, { category: null, query: "" })).toEqual(MENU.categories);
  });

  it("filters by category", () => {
    expect(filterMenu(MENU.categories, { category: "Platillos", query: "" }).map((c) => c.name)).toEqual(["Platillos"]);
  });

  it("searches by name ignoring accents and case, inside the chosen category", () => {
    const result = filterMenu(MENU.categories, { category: null, query: "CAFE" });
    expect(result).toHaveLength(1);
    expect(result[0].items.map((i) => i.name)).toEqual(["Café de olla"]);

    expect(filterMenu(MENU.categories, { category: "Platillos", query: "café" })).toEqual([]);
  });
});

describe("categoryColor and formatPrice", () => {
  it("gives the same color to the same category", () => {
    expect(categoryColor("Bebidas")).toBe(categoryColor("Bebidas"));
    expect(categoryColor("Bebidas")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("formats cents as MXN in both languages", () => {
    expect(formatPrice(2850, "es")).toBe("$28.50");
    expect(formatPrice(2850, "en")).toContain("28.50");
  });
});
