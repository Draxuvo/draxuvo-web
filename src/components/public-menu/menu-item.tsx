"use client";

import { useLocale, useTranslations } from "next-intl";
import { isProductIconKey } from "@/lib/product-icons/catalog";
import { SHAPES } from "@/lib/product-icons/shapes";
import { categoryColor, formatPrice, type PublicMenuItem } from "@/lib/public-menu";
import { cn } from "@/lib/utils";

// Cuadro del color de la categoría con el icono del producto (spec 026) o, sin icono, la inicial. Decorativo.
function IconBadge({ icon, name, category }: { icon: PublicMenuItem["icon"]; name: string; category: string }) {
  return (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-etiqueta text-etiqueta"
      style={{ backgroundColor: categoryColor(category) }}
    >
      {isProductIconKey(icon) ? (
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          {SHAPES[icon].map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ) : (
        <span className="text-lg font-semibold uppercase">{name.trim().charAt(0)}</span>
      )}
    </span>
  );
}

export function MenuItem({ item, category }: { item: PublicMenuItem; category: string }) {
  const t = useTranslations("menu");
  const locale = useLocale();

  return (
    <li
      className={cn(
        "flex gap-3 rounded-etiqueta border border-anaquel-borde bg-etiqueta p-3",
        item.sold_out && "opacity-60",
      )}
    >
      <IconBadge icon={item.icon} name={item.name} category={category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 font-semibold leading-snug break-words">{item.name}</h3>
          <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.price_cents, locale)}</span>
        </div>
        {item.description && <p className="mt-0.5 text-sm text-gris-texto break-words">{item.description}</p>}
        {item.sold_out && (
          <span className="mt-1.5 inline-block rounded-sm bg-anaquel px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-tinta">
            {t("soldOut")}
          </span>
        )}
      </div>
    </li>
  );
}
