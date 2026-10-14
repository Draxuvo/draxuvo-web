"use client";

import { type KeyboardEvent, type MouseEvent, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { m, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { BUSINESS_TYPES, MODULE_ICONS, modulesWithPlan } from "@/lib/modules";
import { type PlansResponse, uiBaseUrl } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ModuleArt } from "./module-art";
import { Reveal } from "./reveal";

const labelClass = "text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase";
const HEADER_PX = 64;
const VH_PER_MODULE = 70;

// rail: escritorio, scroll vertical que mueve el pasillo de lado. snap: celular, franja con
// gesto lateral. list: "reducir movimiento" y primer render (sin JavaScript): lista vertical.
type Mode = "rail" | "snap" | "list";
const REDUCE = "(prefers-reduced-motion: reduce)";
const DESKTOP = "(min-width: 1024px)";

function subscribeMode(onChange: () => void) {
  const queries = [window.matchMedia(REDUCE), window.matchMedia(DESKTOP)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function currentMode(): Mode {
  if (window.matchMedia(REDUCE).matches) return "list";
  return window.matchMedia(DESKTOP).matches ? "rail" : "snap";
}

export function ModuleShowcase({ catalog }: { catalog: PlansResponse }) {
  const t = useTranslations("modules");
  const tp = useTranslations("pricing");
  const locale = useLocale();
  const modules = modulesWithPlan(catalog);
  const total = modules.length;
  const mode = useSyncExternalStore(subscribeMode, currentMode, (): Mode => "list");

  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: [`start ${HEADER_PX}px`, "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `${(-(total - 1) / total) * 100}%`]);
  useMotionValueEvent(scrollYProgress, "change", (value) => setActive(Math.round(Math.max(0, Math.min(1, value)) * (total - 1))));

  function scrollToIndex(index: number) {
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    if (!outer || !sticky) return;
    const clamped = Math.max(0, Math.min(total - 1, index));
    const range = outer.offsetHeight - sticky.offsetHeight;
    const top = outer.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (range * clamped) / (total - 1) - HEADER_PX, behavior: "smooth" });
  }

  function onChipClick(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (mode !== "rail") return;
    event.preventDefault();
    scrollToIndex(index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement) return;
    const dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    if (mode === "rail") {
      event.preventDefault();
      scrollToIndex(active + dir);
    } else if (mode === "snap") {
      event.preventDefault();
      const strip = stripRef.current;
      strip?.scrollBy({ left: dir * strip.clientWidth * 0.88, behavior: "smooth" });
    }
  }

  const giroBar = (
    <fieldset className="mx-auto flex max-w-[72rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
      <legend className="float-left font-display text-lg leading-none font-semibold uppercase">{t("switchLabel")}</legend>
      <div className="flex flex-wrap gap-1.5">
        {BUSINESS_TYPES.map((type) => (
          <label key={type} className="cursor-pointer">
            <input type="radio" name="giro" value={type} defaultChecked={type === "restaurant"} className="peer sr-only" />
            <span className="press inline-block rounded-etiqueta border-2 border-tinta bg-etiqueta px-3 py-1 text-sm font-semibold transition-colors duration-120 peer-checked:bg-tinta peer-checked:text-etiqueta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta hover:bg-ceja peer-checked:hover:bg-tinta">
              {t(`businessTypes.${type}`)}
            </span>
          </label>
        ))}
      </div>
      {mode === "rail" && (
        <p aria-hidden="true" className="ml-auto font-display text-lg font-semibold tabular-nums">
          {t("position", { n: active + 1, total })}
        </p>
      )}
    </fieldset>
  );

  const panels = modules.map(({ key, plan }, index) => {
    const Icon = MODULE_ICONS[key];
    const features = t.raw(`items.${key}.features`) as string[];
    const titleId = `modulo-${key}-title`;
    return (
      <article
        key={key}
        id={`modulo-${key}`}
        aria-labelledby={titleId}
        onFocusCapture={mode === "rail" ? () => index !== active && scrollToIndex(index) : undefined}
        style={mode === "rail" ? { flex: `0 0 ${100 / total}%` } : undefined}
        className={cn(
          "scroll-mt-32",
          mode === "rail" && "flex h-full flex-col overflow-y-auto",
          mode === "snap" && "w-[88%] shrink-0 snap-center overflow-hidden rounded-etiqueta border-2 border-tinta bg-anaquel",
        )}
      >
        <div className={cn("border-tinta bg-ceja", mode === "snap" ? "border-b-2" : "border-y-2")}>
          <div className="mx-auto flex max-w-[72rem] flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:gap-6">
            <Reveal className="shrink-0">
              <div className="notch flex items-center gap-3 rounded-etiqueta border-2 border-tinta bg-etiqueta py-3 pr-4 pl-6 shadow-etiqueta [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)]">
                <Icon className="size-7 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <h3 id={titleId} className="font-display text-[2rem] leading-none font-extrabold uppercase">
                  {t(`items.${key}.title`)}
                </h3>
              </div>
            </Reveal>
            <p className="flex-1 leading-snug">{t(`items.${key}.desc`)}</p>
            {plan && (
              <p className="self-start rounded-full bg-sello px-3 py-1 text-[0.8125rem] font-semibold text-etiqueta md:self-auto">
                {t("planLabel", { plan: tp(`plans.${plan}.name`) })}
              </p>
            )}
          </div>
        </div>

        <div className={cn(mode === "rail" && "flex flex-1 items-center")}>
        <div
          className={cn(
            "mx-auto grid w-full max-w-[72rem] gap-6 px-4 pt-6 sm:px-6 md:grid-cols-3 md:gap-10",
            mode === "rail" ? "lg:grid-cols-[18rem_repeat(3,minmax(0,1fr))]" : "lg:grid-cols-[13rem_repeat(3,minmax(0,1fr))]",
            mode === "list" ? "pb-12 md:pb-16" : "pb-6",
            mode === "rail" && "lg:text-lg lg:leading-snug",
          )}
        >
          <div className="md:col-span-3 lg:col-span-1">
            <ModuleArt moduleKey={key} large={mode === "rail"} />
          </div>
          <div>
            <h4 className={labelClass}>{t("problemLabel")}</h4>
            <p className="mt-1.5">{t(`items.${key}.problem`)}</p>
          </div>
          <div>
            <h4 className={labelClass}>{t("featuresLabel")}</h4>
            <ul className="mt-2 space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-5 shrink-0 text-sello" strokeWidth={2.25} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={labelClass}>{t("examplesLabel")}</h4>
            <dl className="mt-2 space-y-3">
              {BUSINESS_TYPES.map((type) => (
                <div key={type} data-giro={type}>
                  <dt className="font-display text-lg leading-tight font-semibold uppercase">{t(`businessTypes.${type}`)}</dt>
                  <dd className="mt-0.5 leading-snug">{t(`items.${key}.examples.${type}`)}</dd>
                </div>
              ))}
            </dl>
            <a
              href={`${uiBaseUrl()}/${locale}/registro`}
              className="draw-underline mt-4 inline-flex items-center gap-1.5 pb-0.5 text-sm font-semibold"
            >
              {t("signup")}
              <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </a>
          </div>
        </div>
        </div>
      </article>
    );
  });

  return (
    <section id="modulos" aria-labelledby="modules-title" onKeyDown={onKeyDown} className="giros scroll-mt-16 pt-16 sm:pt-24">
      <div className="mx-auto max-w-[72rem] px-4 sm:px-6">
        <h2 id="modules-title" className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-gris-texto">{t("subtitle")}</p>

        <nav aria-label={t("title")} className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {modules.map(({ key }, index) => {
              const Icon = MODULE_ICONS[key];
              return (
                <li key={key}>
                  <a
                    href={`#modulo-${key}`}
                    onClick={(event) => onChipClick(event, index)}
                    className="press inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-etiqueta px-3 py-1.5 text-sm font-semibold transition-colors duration-120 hover:bg-ceja"
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    {t(`items.${key}.title`)}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div
        ref={outerRef}
        style={mode === "rail" ? { height: `calc(100dvh + ${(total - 1) * VH_PER_MODULE}vh)` } : undefined}
        className="mt-8"
      >
        {mode === "rail" ? (
          <div
            ref={stickyRef}
            onScroll={(event) => {
              event.currentTarget.scrollLeft = 0;
            }}
            className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden border-y-2 border-tinta bg-anaquel"
          >
            <div className="border-b-2 border-tinta">{giroBar}</div>
            <m.div style={{ x, width: `${total * 100}%` }} className="flex min-h-0 flex-1 will-change-transform">
              {panels}
            </m.div>
          </div>
        ) : (
          <>
            <div className="sticky top-16 z-30 border-y-2 border-tinta bg-anaquel">{giroBar}</div>
            {mode === "snap" ? (
              <>
                <p className="mx-auto mt-4 max-w-[72rem] px-4 text-sm font-medium text-gris-texto sm:px-6">{t("pasilloHint")}</p>
                <div
                  ref={stripRef}
                  role="group"
                  aria-label={t("pasilloLabel")}
                  tabIndex={0}
                  className="pasillo-franja no-scrollbar mt-3 flex items-start gap-4 overflow-x-auto scroll-px-4 px-4 pb-6"
                >
                  {panels}
                </div>
              </>
            ) : (
              <div className="mt-2">{panels}</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
