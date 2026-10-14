"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { m, useDragControls } from "motion/react";
import { Minus, Plus, X } from "lucide-react";

type ScreenViewerProps = { id: string; alt: string; open: boolean; onClose: () => void };

const DOUBLE_TAP_MS = 300;

// Pantalla completa sobre un <dialog> nativo (foco y Escape gratis). El pellizco es el nativo del
// navegador; el doble toque y los botones + y - alternan entre 1x y 2x. Se cierra con Escape, el
// botón, un clic fuera o arrastrando el asa hacia abajo.
export function ScreenViewer({ id, alt, open, onClose }: ScreenViewerProps) {
  const t = useTranslations("viewer");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const controls = useDragControls();
  const [zoom, setZoom] = useState<1 | 2>(1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    setZoom(1);
    opener.current?.focus();
    onClose();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "+" || event.key === "=") setZoom(2);
    else if (event.key === "-") setZoom(1);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    const now = event.timeStamp;
    const previous = lastTap.current;
    if (previous && now - previous.time < DOUBLE_TAP_MS && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 30) {
      setZoom((value) => (value === 1 ? 2 : 1));
      lastTap.current = null;
    } else {
      lastTap.current = { time: now, x: event.clientX, y: event.clientY };
    }
  }

  const button =
    "press grid size-10 place-items-center rounded-etiqueta border-2 border-tinta bg-etiqueta transition-colors duration-120 hover:bg-ceja";

  return (
    <dialog
      ref={dialogRef}
      aria-label={t("label")}
      onClose={handleClose}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="viewer m-auto max-h-[100dvh] w-[min(96vw,80rem)] max-w-none overflow-hidden rounded-etiqueta border-2 border-tinta bg-anaquel p-0 text-tinta backdrop:bg-tinta/70"
    >
      <m.div
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) dialogRef.current?.close();
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-tinta bg-ceja px-3 py-2">
          <div
            onPointerDown={(event) => controls.start(event)}
            className="flex min-h-10 flex-1 cursor-grab touch-none flex-col items-start justify-center gap-1 active:cursor-grabbing"
          >
            <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-tinta" />
            <span className="text-sm font-medium">{t("hint")}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setZoom(1)} aria-label={t("zoomOut")} aria-disabled={zoom === 1} className={`${button} aria-disabled:opacity-40`}>
              <Minus className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setZoom(2)} aria-label={t("zoomIn")} aria-disabled={zoom === 2} className={`${button} aria-disabled:opacity-40`}>
              <Plus className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={t("close")} className={button}>
              <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div onPointerUp={onPointerUp} className="max-h-[calc(100dvh-5rem)] overflow-auto bg-etiqueta [touch-action:manipulation_pinch-zoom]">
          <picture>
            <source media="(min-width: 768px)" srcSet={`/screens/${id}-desktop.png`} />
            <img
              src={`/screens/${id}-mobile.png`}
              alt={alt}
              draggable={false}
              style={
                zoom === 1
                  ? { width: "auto", maxWidth: "100%", maxHeight: "calc(100dvh - 6rem)" }
                  : { width: "200%", maxWidth: "none", maxHeight: "none" }
              }
              className="mx-auto block h-auto select-none"
            />
          </picture>
        </div>
      </m.div>
    </dialog>
  );
}
