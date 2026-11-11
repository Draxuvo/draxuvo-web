"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { categoryColor, formatPrice, type PublicMenuItem } from "@/lib/public-menu";
import { IconBadge } from "./icon-badge";

// Foto grande de un platillo en miniatura (spec 061, FR-012a). `<dialog>` nativo: atrapa el foco, cierra con Esc y
// pinta el fondo. Al abrir se agrega una entrada al historial para que «atrás» del teléfono cierre la foto en vez de
// salir del menú; cerrar con el botón, Esc o un toque fuera regresa esa entrada. La foto grande se pide solo aquí.
export function PhotoViewer({ item, category, onClose }: { item: PublicMenuItem; category: string; onClose: () => void }) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    window.history.pushState({ menuPhoto: true }, "");
    const onPop = () => {
      dialog.close();
      onClose();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  const requestClose = () => window.history.back();
  const url = item.photo?.url;

  return (
    <dialog
      ref={ref}
      aria-label={item.name}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        // Un toque en el fondo llega al propio <dialog>; uno en la foto o el texto, a sus hijos.
        if (event.target === event.currentTarget) requestClose();
      }}
      className="m-auto w-[min(92vw,40rem)] max-w-none overflow-hidden rounded-etiqueta bg-etiqueta p-0 text-tinta backdrop:bg-tinta/70"
    >
      <div className="relative">
        <div className="aspect-[4/3] w-full" style={{ backgroundColor: categoryColor(category) }}>
          {url && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene del tamaño justo desde el almacenamiento
            <img src={url} alt={item.name} decoding="async" onError={() => setFailed(true)} className="size-full object-cover" />
          ) : (
            <IconBadge icon={item.icon} name={item.name} category={category} large />
          )}
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label={t("closePhoto")}
          className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-tinta/80 text-etiqueta"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="flex items-baseline justify-between gap-3 p-4">
        <p className="min-w-0 font-semibold leading-snug break-words">{item.name}</p>
        <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.price_cents, locale)}</span>
      </div>
    </dialog>
  );
}
