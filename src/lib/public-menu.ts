// Menú público de una mesa (spec 059). Contrato: specs/059-menu-qr-mesas/contracts/api.md (GET /public/menus/:token).
// Lo pide el navegador del comensal directo a la API (no el servidor de `web`): así el límite por IP de la API ve la
// IP real de cada teléfono (research R1).
import type { ProductIconKey } from "@/lib/product-icons/catalog";

export interface PublicMenuItem {
  name: string;
  description: string | null;
  /** Centavos MXN. */
  price_cents: number;
  /** Ya resuelto por la API (producto → tipo); `null` muestra la inicial. */
  icon: ProductIconKey | string | null;
  sold_out: boolean;
}

export interface PublicMenuCategory {
  name: string;
  items: PublicMenuItem[];
}

export interface PublicMenu {
  business: { name: string };
  table: { name: string };
  categories: PublicMenuCategory[];
}

export type PublicMenuResult =
  | { kind: "ok"; menu: PublicMenu }
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | { kind: "error" };

export async function fetchPublicMenu(token: string, signal?: AbortSignal): Promise<PublicMenuResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { kind: "error" };

  try {
    const response = await fetch(`${apiUrl}/api/v1/public/menus/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
    if (response.ok) return { kind: "ok", menu: (await response.json()) as PublicMenu };

    const code = await errorCode(response);
    if (response.status === 404 && code === "menu_link_invalid") return { kind: "invalid" };
    if (response.status === 403 && code === "menu_unavailable") return { kind: "unavailable" };
    return { kind: "error" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { kind: "error" };
  }
}

async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { details?: { code?: string } } };
    return body.error?.details?.code;
  } catch {
    return undefined;
  }
}

/** Minúsculas y sin acentos, para buscar «cafe» y encontrar «Café». */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Recorta el menú a la categoría elegida (`null` = todas) y a la búsqueda por nombre; quita las categorías vacías. */
export function filterMenu(
  categories: PublicMenuCategory[],
  { category, query }: { category: string | null; query: string },
): PublicMenuCategory[] {
  const term = normalize(query);
  return categories
    .filter((c) => category === null || c.name === category)
    .map((c) => ({ ...c, items: term ? c.items.filter((item) => normalize(item.name).includes(term)) : c.items }))
    .filter((c) => c.items.length > 0);
}

// Colores fijos que leen bien con texto blanco; el mismo hash que `categoryColor` del panel (ui).
const PALETTE = ["#0b7a4b", "#c2410c", "#1d4ed8", "#7c3aed", "#be123c"];

/** Color estable por categoría: el mismo nombre da siempre el mismo color. */
export function categoryColor(category: string): string {
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function formatPrice(priceCents: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", { style: "currency", currency: "MXN" }).format(
    priceCents / 100,
  );
}
