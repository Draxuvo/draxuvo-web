"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getImageProps } from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Capturas reales del panel con datos de demo (scripts/capture-screens.md).
const SLIDES = ["dashboard", "ordenes", "inventario", "asistencia", "suscripcion"] as const;
const AUTOPLAY_MS = 6000;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
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
      <img {...rest} srcSet={mobile} className="h-full w-full object-cover object-top" />
    </picture>
  );
}

export function ProductCarousel() {
  const t = useTranslations("carousel");
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const tabHidden = useTabHidden();
  const paused = hovered || focused || tabHidden || reducedMotion;
  const total = SLIDES.length;

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = (index + total) % total;
      track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
      setActive(next);
    },
    [reducedMotion, total],
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => goTo(active + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, active, goTo]);

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    }
  }

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
      <div
        ref={trackRef}
        onScroll={onScroll}
        tabIndex={0}
        aria-label={t("position", { n: active + 1, total })}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-offset-[-4px]"
      >
        {SLIDES.map((id, index) => (
          <figure
            key={id}
            role="group"
            aria-roledescription={t("slideRole")}
            aria-label={t("position", { n: index + 1, total })}
            aria-hidden={index !== active}
            className="w-full shrink-0 snap-start snap-always"
          >
            <div className="border-b-2 border-tinta bg-anaquel">
              <SlideImage id={id} alt={t(`slides.${id}.alt`)} />
            </div>
            <figcaption className="min-h-[4.5rem] px-4 pt-3 text-[0.9375rem] leading-snug text-tinta md:min-h-0 md:px-5">
              {t(`slides.${id}.caption`)}
            </figcaption>
          </figure>
        ))}
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
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label={t("prev")}
            className="grid size-10 place-items-center rounded-etiqueta border-2 border-tinta bg-etiqueta transition-colors duration-120 hover:bg-ceja"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label={t("next")}
            className="grid size-10 place-items-center rounded-etiqueta border-2 border-tinta bg-etiqueta transition-colors duration-120 hover:bg-ceja"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
