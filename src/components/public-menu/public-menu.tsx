"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { CategoryChips } from "@/components/public-menu/category-chips";
import { MenuItem } from "@/components/public-menu/menu-item";
import { fetchPublicMenu, filterMenu, type PublicMenu as Menu, type PublicMenuResult } from "@/lib/public-menu";

// Vuelve a consultar al regresar a la pestaña si pasó más de esto (FR-016: cambios visibles en menos de un minuto).
const REFRESH_AFTER_MS = 30_000;

type State = { status: "loading" } | PublicMenuResult;

// Página del menú de una mesa (spec 059): solo lectura, sin marca Draxuvo ni botones de pedir (FR-015, FR-026).
// Contrato de estados: specs/059-menu-qr-mesas/contracts/web.md.
export function PublicMenu({ token }: { token: string }) {
  const t = useTranslations("menu");
  const [state, setState] = useState<State>({ status: "loading" });
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const loadedAt = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(
    async (showLoading: boolean) => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      if (showLoading) setState({ status: "loading" });
      try {
        const result = await fetchPublicMenu(token, current.signal);
        loadedAt.current = Date.now();
        setState(result);
      } catch {
        // Cancelada por una consulta más nueva o al desmontar.
      }
    },
    [token],
  );

  useEffect(() => {
    // Primera carga al montar: el estado inicial ya es «cargando».
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - loadedAt.current > REFRESH_AFTER_MS) void load(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      controller.current?.abort();
    };
  }, [load]);

  const menu = "kind" in state && state.kind === "ok" ? state.menu : null;

  useEffect(() => {
    document.title = menu ? `${menu.business.name} · ${t("title")}` : t("title");
  }, [menu, t]);

  if (!("kind" in state)) return <LoadingView label={t("loading")} />;

  switch (state.kind) {
    case "invalid":
      return <Notice title={t("invalid")} hint={t("invalidHint")} />;
    case "unavailable":
      return <Notice title={t("unavailable")} hint={t("unavailableHint")} />;
    case "error":
      return (
        <Notice title={t("error")}>
          <button
            type="button"
            onClick={() => void load(true)}
            className="mt-5 min-h-11 rounded-full bg-tinta px-6 font-semibold text-etiqueta"
          >
            {t("retry")}
          </button>
        </Notice>
      );
    case "ok":
      return <MenuView menu={state.menu} category={category} onCategory={setCategory} query={query} onQuery={setQuery} />;
  }
}

function MenuView({
  menu,
  category,
  onCategory,
  query,
  onQuery,
}: {
  menu: Menu;
  category: string | null;
  onCategory: (category: string | null) => void;
  query: string;
  onQuery: (query: string) => void;
}) {
  const t = useTranslations("menu");
  const names = useMemo(() => menu.categories.map((c) => c.name), [menu]);
  // Si la categoría elegida desapareció tras recargar, se vuelve a «Todo».
  const selected = category !== null && names.includes(category) ? category : null;
  const visible = useMemo(() => filterMenu(menu.categories, { category: selected, query }), [menu, selected, query]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 pb-12">
      <header className="px-4 pt-8 pb-4">
        <h1 className="font-display text-4xl leading-none font-extrabold uppercase break-words">{menu.business.name}</h1>
        <p className="mt-2 text-lg font-semibold">{tableLabel(menu.table.name, (name) => t("tableName", { name }))}</p>
      </header>

      {menu.categories.length === 0 ? (
        <p className="px-4 py-10 text-center text-gris-texto">{t("empty")}</p>
      ) : (
        <>
          <div className="sticky top-0 z-10 space-y-3 border-b border-anaquel-borde bg-anaquel/95 px-4 pt-2 pb-3 backdrop-blur">
            <label className="relative block">
              <span className="sr-only">{t("searchLabel")}</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris-texto" />
              <input
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder={t("search")}
                className="min-h-11 w-full rounded-etiqueta border border-anaquel-borde bg-etiqueta pr-3 pl-9 text-base outline-none focus:border-tinta"
              />
            </label>
            <CategoryChips categories={names} selected={selected} onSelect={onCategory} />
          </div>

          {visible.length === 0 ? (
            <p className="px-4 py-10 text-center text-gris-texto">{t("noResults")}</p>
          ) : (
            <div className="space-y-6 px-4 pt-5">
              {visible.map((section) => (
                <section key={section.name} aria-labelledby={`cat-${slug(section.name)}`}>
                  <h2 id={`cat-${slug(section.name)}`} className="font-display text-2xl font-extrabold uppercase">
                    {section.name}
                  </h2>
                  <ul className="mt-2 space-y-2">
                    {section.items.map((item, index) => (
                      <MenuItem key={`${index}-${item.name}`} item={item} category={section.name} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Una mesa que se llama solo con un número sale como «Mesa 4»; cualquier otro nombre, tal cual (igual que la tarjeta). */
export function tableLabel(name: string, numbered: (name: string) => string): string {
  const trimmed = name.trim();
  return /^\d+$/.test(trimmed) ? numbered(trimmed) : name;
}

function slug(text: string) {
  return text.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
}

function Notice({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xl font-semibold">{title}</p>
      {hint && <p className="mt-2 text-gris-texto">{hint}</p>}
      {children}
    </div>
  );
}

function LoadingView({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8" aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div aria-hidden className="animate-pulse space-y-3">
        <div className="h-9 w-2/3 rounded-etiqueta bg-anaquel-borde" />
        <div className="h-5 w-1/4 rounded-etiqueta bg-anaquel-borde" />
        <div className="h-11 rounded-etiqueta bg-anaquel-borde" />
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-16 rounded-etiqueta bg-anaquel-borde" />
        ))}
      </div>
    </div>
  );
}
