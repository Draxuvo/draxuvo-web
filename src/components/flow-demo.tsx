"use client";

import { type KeyboardEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { FLOW_FOLIO, FLOW_ITEMS, FLOW_STEPS, FLOW_TOTAL_CENTS } from "@/lib/demo-flow";
import { cn } from "@/lib/utils";

// Demo del flujo orden de trabajo → ticket cobrado. Cinco estados fijos, sin llamadas a la API.
// Avanza y retrocede con los botones, las flechas del teclado o deslizando.
export function FlowDemo() {
  const t = useTranslations("flow");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const total = FLOW_STEPS.length;
  const key = FLOW_STEPS[step];

  const money = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "narrowSymbol",
  });
  const format = (cents: number) => money.format(cents / 100);

  const go = (next: number) => setStep(Math.max(0, Math.min(total - 1, next)));

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLButtonElement && event.key === "Enter") return;
    if (event.key === "ArrowRight") go(step + 1);
    else if (event.key === "ArrowLeft") go(step - 1);
    else return;
    event.preventDefault();
  }

  const control =
    "press inline-flex items-center gap-2 rounded-etiqueta border-2 border-tinta bg-etiqueta px-4 py-2 font-display text-lg leading-none font-semibold uppercase transition-colors duration-120 hover:bg-ceja disabled:opacity-40 disabled:hover:bg-etiqueta";

  return (
    <div
      role="group"
      aria-label={t("region")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="mx-auto max-w-[72rem] px-4 pt-14 sm:px-6 sm:pt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-[2rem] leading-none font-extrabold uppercase sm:text-[2.5rem]">{t("title")}</h3>
          <p className="mt-2 max-w-[56ch] text-gris-texto">{t("subtitle")}</p>
        </div>
        <p className="rounded-full border-2 border-tinta bg-ceja px-3 py-1 text-[0.8125rem] font-semibold tracking-[0.06em] uppercase">
          {t("demoLabel")}
        </p>
      </div>

      <m.div
        drag="x"
        dragSnapToOrigin
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(step + 1);
          else if (info.offset.x > 60) go(step - 1);
        }}
        className="mt-6 grid touch-pan-y gap-6 md:grid-cols-[1fr_1.1fr]"
      >
        <div>
          <ol className="flex gap-1.5" aria-label={t("stepLabel", { n: step + 1, total })}>
            {FLOW_STEPS.map((id, index) => (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(index)}
                  aria-label={t(`steps.${id}.title`)}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "h-3 w-full rounded-[2px] border-2 border-tinta transition-colors duration-120",
                    index <= step ? "bg-tinta" : "bg-etiqueta hover:bg-ceja",
                  )}
                />
              </li>
            ))}
          </ol>
          <div aria-live="polite" className="mt-4 min-h-[8rem]">
            <p className="font-display text-lg font-semibold tabular-nums">{t("stepLabel", { n: step + 1, total })}</p>
            <p className="mt-1 font-display text-[1.75rem] leading-none font-extrabold uppercase">{t(`steps.${key}.title`)}</p>
            <p className="mt-2 max-w-[44ch] leading-snug">{t(`steps.${key}.desc`)}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={control}>
              <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
              {t("prev")}
            </button>
            {step < total - 1 ? (
              <button type="button" onClick={() => go(step + 1)} className={`${control} bg-oferta hover:bg-oferta-hover`}>
                {t("next")}
                <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={() => go(0)} className={control}>
                <RotateCcw className="size-5" strokeWidth={1.75} aria-hidden="true" />
                {t("restart")}
              </button>
            )}
          </div>
        </div>

        <div className="notch rounded-etiqueta border-2 border-tinta bg-etiqueta py-4 pr-5 pl-7 shadow-etiqueta [--notch-bg:var(--color-anaquel)] [--notch-line:var(--color-tinta)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">{t("order")}</p>
              <p className="font-display text-2xl leading-none font-extrabold uppercase">{t("orderName")}</p>
              <p className="mt-1 text-sm text-gris-texto">
                {t("client")}: {t("clientName")}
              </p>
            </div>
            <p
              key={key}
              className={cn(
                "status-in rounded-full border-2 border-tinta px-3 py-0.5 text-sm font-semibold whitespace-nowrap",
                step >= 3 ? "bg-sello text-etiqueta" : step >= 1 ? "bg-ceja" : "bg-anaquel",
              )}
            >
              {t(`status.${key}`)}
            </p>
          </div>

          {step >= 1 && (
            <p className="mt-3 border-t border-dashed border-tinta/40 pt-2 text-sm">
              <span className="text-gris-texto">{t("assignee")}: </span>
              <span className="font-semibold">{t("assigneeName")}</span>
            </p>
          )}

          {step >= 2 && (
            <dl className="mt-2 space-y-0.5 border-t border-dashed border-tinta/40 pt-2 font-display text-lg tabular-nums">
              <dt className="sr-only">{t("items")}</dt>
              {FLOW_ITEMS.map((item) => (
                <div key={item.key} className="flex justify-between gap-4">
                  <dt className="font-sans text-[0.9375rem]">{t(`itemNames.${item.key}`)}</dt>
                  <dd className="font-semibold">{format(item.cents)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-tinta/40 pt-1 text-xl">
                <dt className="font-sans text-[0.9375rem] font-semibold">{t("total")}</dt>
                <dd className="font-extrabold">{format(FLOW_TOTAL_CENTS)}</dd>
              </div>
            </dl>
          )}

          {step === total - 1 && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-tinta pt-3">
              <p className="font-display text-xl font-extrabold tabular-nums">
                {t("folio")} {FLOW_FOLIO}
              </p>
              <p className="inline-flex -rotate-3 items-center gap-1 rounded-[4px] border-2 border-sello px-2 py-0.5 font-display text-xl font-extrabold text-sello uppercase">
                <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
                {t("paidStamp")}
              </p>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
}
