"use client";

import { type CSSProperties, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { m } from "motion/react";
import { type BillingCycle, type Need, type PlansResponse, registrationUrl, suggestPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { PlanFinder } from "./plan-finder";
import { TiltTag } from "./tilt-tag";

const CYCLES: BillingCycle[] = ["monthly", "annual"];
const CHOSEN_PLAN = "pro";

// Precio de etiquetadora: el número entero grande; signo, centavos y moneda al 40 %.
function PriceFigure({ parts }: { parts: Intl.NumberFormatPart[] }) {
  return (
    <span className="inline-flex items-start font-display leading-none font-extrabold tabular-nums">
      {parts.map((part, index) =>
        part.type === "currency" || part.type === "decimal" || part.type === "fraction" ? (
          <span key={index} className="mt-1 text-[0.4em]">{part.value}</span>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
      <span className="mt-1 ml-1 text-[0.4em] opacity-60">MXN</span>
    </span>
  );
}

export function PricingSection({ catalog }: { catalog: PlansResponse }) {
  const t = useTranslations("pricing");
  const tm = useTranslations("modules");
  const locale = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  // El giro de reetiquetado solo corre después de que el visitante cambia el ciclo.
  const [relabeled, setRelabeled] = useState(false);
  const [needs, setNeeds] = useState<Need[]>([]);
  const suggested = suggestPlan(needs, catalog);
  const tf = useTranslations("finder");

  function toggleNeed(need: Need) {
    setNeeds((current) => (current.includes(need) ? current.filter((value) => value !== need) : [...current, need]));
  }

  const money = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  });
  const format = (cents: number) => money.format(cents / 100);
  const ivaPercent = Math.round(catalog.iva_rate * 100);

  function chooseCycle(value: BillingCycle) {
    if (value === cycle) return;
    setCycle(value);
    setRelabeled(true);
  }

  return (
    <section id="precios" aria-labelledby="pricing-title" className="scroll-mt-16">
      <div className="border-b-2 border-tinta bg-ceja">
        <div className="mx-auto max-w-[72rem] px-4 pt-4 pb-5 sm:px-6 lg:pt-5 lg:pb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <h2 id="pricing-title" className="font-display text-[2rem] leading-none font-extrabold uppercase sm:text-[2.5rem]">
              {t("title")}
            </h2>
            <div role="group" aria-label={t("cycleLabel")} className="inline-flex rounded-etiqueta border-2 border-tinta bg-etiqueta p-1">
              {CYCLES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cycle === value}
                  onClick={() => chooseCycle(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-[4px] px-3 py-1.5 font-display text-lg leading-none font-semibold uppercase transition-colors duration-120 sm:px-4",
                    cycle === value ? "bg-tinta text-etiqueta" : "hover:bg-anaquel",
                  )}
                >
                  {t(value)}
                  {value === "annual" && (
                    <span className="rounded-full bg-ceja px-2 py-0.5 font-sans text-xs font-semibold tracking-normal text-tinta normal-case">
                      {t("annualNote")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <PlanFinder
            needs={needs}
            onToggle={toggleNeed}
            onClear={() => setNeeds([])}
            suggestedName={suggested ? t(`plans.${suggested.key}.name`) : null}
          />

          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pt-5 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
            {catalog.plans.map((plan, index) => {
              const price = plan.prices[cycle];
              const chosen = plan.key === CHOSEN_PLAN;
              const nameId = `plan-${plan.key}`;
              const isSuggested = suggested?.key === plan.key;
              const showSeal = suggested ? isSuggested : chosen;
              return (
                <m.li
                  key={plan.key}
                  animate={{ y: isSuggested ? -8 : 0 }}
                  className="flex w-[80%] max-w-[22rem] shrink-0 snap-start flex-col lg:w-auto lg:max-w-none"
                >
                <TiltTag
                  as="div"
                  aria-labelledby={nameId}
                  style={{ "--d": `${450 + index * 90}ms` } as CSSProperties}
                  className={cn(
                    "notch hero-stick flex h-full flex-col rounded-etiqueta border-2 border-tinta bg-etiqueta py-4 pr-4 pl-6 shadow-etiqueta [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)]",
                    (chosen && !suggested) || isSuggested ? "outline-4 outline-offset-0 outline-oferta" : "",
                  )}
                >
                  {showSeal && (
                    <p className="absolute -top-3 right-4 rotate-[5deg] rounded-[4px] border-2 border-tinta bg-oferta px-2 py-0.5 text-[0.8125rem] font-semibold tracking-[0.06em] text-tinta uppercase shadow-etiqueta">
                      {isSuggested ? tf("badge") : t("recommended")}
                    </p>
                  )}
                  <h3 id={nameId} className="font-display text-[1.75rem] leading-none font-extrabold uppercase">
                    {t(`plans.${plan.key}.name`)}
                  </h3>
                  <p className="mt-1 min-h-[2lh] text-[0.8125rem] leading-snug text-gris-texto">{t(`plans.${plan.key}.desc`)}</p>
                  <div className="mt-2 pb-3 [perspective:600px]">
                    <div
                      key={cycle}
                      style={{ animationDelay: `${index * 30}ms` }}
                      className={relabeled ? "motion-safe:animate-relabel" : undefined}
                    >
                      <p className="text-[clamp(2.5rem,5vw,3.75rem)] leading-none">
                        <PriceFigure parts={money.formatToParts(price.amount_cents / 100)} />
                      </p>
                      <p className="mt-1 text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">
                        {t("beforeTax")} · {t(cycle === "monthly" ? "perMonthLong" : "perYearLong")}
                      </p>
                      <dl className="mt-2 space-y-0.5 border-t border-dashed border-tinta/40 pt-2 font-display text-lg tabular-nums">
                        <div className="flex justify-between gap-4">
                          <dt className="font-sans text-[0.9375rem]">{t("iva", { rate: ivaPercent })}</dt>
                          <dd className="font-semibold">{format(price.iva_cents)}</dd>
                        </div>
                        <div className="flex justify-between gap-4 text-xl">
                          <dt className="font-sans text-[0.9375rem] font-semibold">{t("total")}</dt>
                          <dd className="font-extrabold">{format(price.total_cents)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <a
                    href={registrationUrl(locale, plan.key, cycle)}
                    aria-describedby={nameId}
                    className={cn(
                      "press mt-auto rounded-etiqueta border-2 border-tinta px-3 py-2 text-center font-semibold text-tinta transition-colors duration-120",
                      showSeal ? "bg-oferta hover:bg-oferta-hover" : "bg-etiqueta hover:bg-ceja",
                    )}
                  >
                    {t("cta")}
                  </a>
                </TiltTag>
                </m.li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[72rem] px-4 pt-6 sm:px-6">
        <p className="max-w-[60ch] text-gris-texto">
          {t("subtitle")} {t("note", { rate: ivaPercent })}
        </p>
        <ul className="mt-5 grid gap-6 md:grid-cols-3">
          {catalog.plans.map((plan) => (
            <li key={plan.key}>
              <p className="font-display text-xl leading-none font-extrabold uppercase">{t(`plans.${plan.key}.name`)}</p>
              <p className="sr-only">{t("includes")}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {plan.modules.map((module) => (
                  <li
                    key={module}
                    className="inline-flex items-center gap-1 rounded-full border border-anaquel-borde bg-etiqueta py-1 pr-2.5 pl-1.5 text-[0.8125rem] font-medium"
                  >
                    <Check className="size-4 text-sello" strokeWidth={2.25} aria-hidden="true" />
                    {tm(`items.${module}.title`)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
