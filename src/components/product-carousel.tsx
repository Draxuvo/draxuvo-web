"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getImageProps } from "next/image";
import { useTranslations } from "next-intl";
import { animate, m, useMotionValue, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScreenViewer } from "./screen-viewer";

// Capturas reales del panel con datos de demo (scripts/capture-screens.md).
const SLIDES = ["dashboard", "ordenes", "inventario", "asistencia", "suscripcion"] as const;
const AUTOPLAY_MS = 6000;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function useTabHidden() {
  return useSyncExternalStore(subscribeVisibility, () => document.hidden, () => true);
}

function SlideImage({ id, alt }: { id: string; alt: string }) {
  const common = { alt, quality: 75 };
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    src: `/screens/${id}-desktop.png`,
    width: 1440,
    height: 900,
    sizes: "(min-width: 1200px) 1120px, 92vw",
  });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    src: `/screens/${id}-mobile.png`,
    width: 390,
    height: 844,
    sizes: "300px",
  });

  return (
    <picture className="block aspect-[390/844] w-full md:aspect-[1440/900]">
      <source media="(min-width: 768px)" srcSet={desktop} sizes="(min-width: 1200px) 1120px, 92vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- getImageProps ya trae alt, tamaño y srcset */}
      <img {...rest} srcSet={mobile} draggable={false} className="h-full w-full object-cover object-top select-none" />
    </picture>
  );
}

// Carrusel que sigue el dedo o el cursor, con inercia y acomodo en la pantalla más cercana.
// Los botones, los puntos y las flechas del teclado hacen lo mismo que el arrastre.
export function ProductCarousel() {
  const t = useTranslations("carousel");
  const tv = useTranslations("viewer");
  const frameRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const reducedMotion = useReducedMotion() ?? true;
  const tabHidden = useTabHidden();
  const paused = hovered || focused || tabHidden || reducedMotion || viewing !== null;
  const total = SLIDES.length;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => {
      const w = frame.clientWidth;
      setWidth(w);
      x.set(-activeRef.current * w);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [x]);

  const goTo = useCallback(
    (index: number, wrap = true) => {
      const next = wrap ? (index + total) % total : Math.max(0, Math.min(total - 1, index));
      activeRef.current = next;
      setActive(next);
      const target = -next * (frameRef.current?.clientWidth ?? 0);
      if (reducedMotion) x.set(target);
      else animate(x, target, { type: "spring", stiffness: 260, damping: 32 });
    },
    [reducedMotion, total, x],
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => goTo(activeRef.current + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, active, goTo]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") goTo(active + 1);
    else if (event.key === "ArrowLeft") goTo(active - 1);
    else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(total - 1);
    else return;
    event.preventDefault();
  }

  const arrow =
    "press grid size-10 place-items-center rounded-etiqueta border-2 border-tinta bg-etiqueta transition-colors duration-120 hover:bg-ceja";

  return (
    <div
      role="region"
      aria-roledescription={t("roledescription")}
      aria-label={t("label")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      className="mx-auto max-w-[19rem] overflow-hidden rounded-etiqueta border-2 border-tinta bg-etiqueta shadow-etiqueta md:max-w-none"
    >
      <div ref={frameRef} tabIndex={0} aria-label={t("position", { n: active + 1, total })} className="overflow-hidden focus-visible:outline-offset-[-4px]">
        <m.div
          drag="x"
          dragConstraints={{ left: -(total - 1) * width, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={(_, info) => {
            const projected = info.offset.x + info.velocity.x * 0.25;
            if (projected < -width / 4) goTo(active + 1, false);
            else if (projected > width / 4) goTo(active - 1, false);
            else goTo(active, false);
          }}
          className="flex cursor-grab touch-pan-y active:cursor-grabbing"
        >
          {SLIDES.map((id, index) => (
            <figure
              key={id}
              role="group"
              aria-roledescription={t("slideRole")}
              aria-label={t("position", { n: index + 1, total })}
              inert={index !== active}
              className="w-full shrink-0"
            >
              <div className="relative border-b-2 border-tinta bg-anaquel">
                <SlideImage id={id} alt={t(`slides.${id}.alt`)} />
                <button
                  type="button"
                  onClick={() => setViewing(index)}
                  aria-label={tv("open")}
                  className="press absolute top-2 right-2 grid size-10 place-items-center rounded-etiqueta border-2 border-tinta bg-etiqueta shadow-etiqueta transition-colors duration-120 hover:bg-ceja"
                >
                  <Maximize2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <figcaption className="min-h-[4.5rem] px-4 pt-3 text-[0.9375rem] leading-snug text-tinta md:min-h-0 md:px-5">
                {t(`slides.${id}.caption`)}
              </figcaption>
            </figure>
          ))}
        </m.div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-3 md:px-5">
        <p aria-live={paused ? "polite" : "off"} className="font-display text-lg font-semibold tabular-nums">
          {t("position", { n: active + 1, total })}
        </p>

        <div className="flex items-center gap-1">
          {SLIDES.map((id, index) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={t("goTo", { n: index + 1 })}
              aria-current={index === active ? "true" : undefined}
              className="group grid h-8 w-6 place-items-center rounded-sm md:w-7"
            >
              <span
                className={cn(
                  "h-2 w-4 rounded-[2px] border-2 border-tinta transition-colors duration-120 md:w-5",
                  index === active ? "bg-tinta" : "bg-etiqueta group-hover:bg-ceja",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => goTo(active - 1)} aria-label={t("prev")} className={arrow}>
            <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} aria-label={t("next")} className={arrow}>
            <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ScreenViewer
        id={SLIDES[viewing ?? active]}
        alt={t(`slides.${SLIDES[viewing ?? active]}.alt`)}
        open={viewing !== null}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}
