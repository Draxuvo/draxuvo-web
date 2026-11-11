"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { categoryColor, formatPrice, type PublicMenuItem } from "@/lib/public-menu";
import { cn } from "@/lib/utils";
import { IconBadge } from "./icon-badge";
import { PhotoViewer } from "./photo-viewer";

// Un platillo del menú público (spec 059). Con foto (spec 061, contracts/web.md) sale como el dueño eligió: tarjeta con
// la foto 4:3 a todo lo ancho, o renglón con la miniatura que se amplía al tocarla; sin foto, el renglón con su icono.
// Las fotos se piden conforme se acercan a la vista, reservan su espacio y, si no cargan, dejan el icono.
export function MenuItem({ item, category }: { item: PublicMenuItem; category: string }) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const [failed, setFailed] = useState(false);
  const [viewing, setViewing] = useState(false);
  const closeViewer = useCallback(() => setViewing(false), []);
  const photo = item.photo ?? null;

  const details = (
    <>
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
    </>
  );

  if (photo?.style === "card") {
    return (
      <li
        className={cn(
          "overflow-hidden rounded-etiqueta border border-anaquel-borde bg-etiqueta",
          item.sold_out && "opacity-60",
        )}
      >
        <div className="aspect-[4/3] w-full" style={{ backgroundColor: categoryColor(category) }}>
          {failed ? (
            <IconBadge icon={item.icon} name={item.name} category={category} large />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene del tamaño justo desde el almacenamiento
            <img
              src={photo.url}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
          )}
        </div>
        <div className="p-3">{details}</div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex gap-3 rounded-etiqueta border border-anaquel-borde bg-etiqueta p-3",
        item.sold_out && "opacity-60",
      )}
    >
      {photo?.style === "thumbnail" ? (
        <button
          type="button"
          onClick={() => setViewing(true)}
          aria-label={t("viewPhoto", { name: item.name })}
          className="size-11 shrink-0 overflow-hidden rounded-etiqueta"
          style={{ backgroundColor: categoryColor(category) }}
        >
          {failed ? (
            <IconBadge icon={item.icon} name={item.name} category={category} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- la miniatura ya viene del tamaño justo
            <img
              src={photo.thumbnail_url}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
          )}
        </button>
      ) : (
        <IconBadge icon={item.icon} name={item.name} category={category} />
      )}
      <div className="min-w-0 flex-1">{details}</div>
      {viewing && <PhotoViewer item={item} category={category} onClose={closeViewer} />}
    </li>
  );
}
