"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { type BillingCycle, type PlansResponse, registrationUrl } from "@/lib/plans";
import { cn } from "@/lib/utils";

const CYCLES: BillingCycle[] = ["monthly", "annual"];
const CHOSEN_PLAN = "pro";

// Precio de etiquetadora: el número entero grande; signo, centavos y moneda al 40 %.
function PriceFigure({ parts }: { parts: Intl.NumberFormatPart[] }) {
  return (
    <span className="inline-flex items-start font-display leading-none font-extrabold tabular-nums">
      {parts.map((part, index) => {
        if (part.type === "currency") {
          return <span key={index} className="mt-1 text-[0.4em]">{part.value}</span>;
        }
        if (part.type === "decimal" || part.type === "fraction") {
          return <span key={index} className="mt-1 text-[0.4em]">{part.value}</span>;
        }
        return <span key={index}>{part.value}</span>;
      })}
      <span className="mt-1 ml-1 self-start text-[0.4em] opacity-60">MXN</span>
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
    <section id="precios" aria-labelledby="pricing-title" className="scroll-mt-20 overflow-x-clip pt-8">
      <div className="mx-auto max-w-[72rem] px-4 sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="pricing-title" className="font-display text-[2.5rem] leading-none font-extrabold uppercase">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-[56ch] text-gris-texto">{t("subtitle")}</p>
          </div>

          <div
            role="group"
            aria-label={t("cycleLabel")}
            className="inline-flex shrink-0 self-start rounded-etiqueta border-2 border-tinta bg-etiqueta p-1 md:self-auto"
          >
            {CYCLES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={cycle === value}
                onClick={() => chooseCycle(value)}
                className={cn(
                  "flex items-center gap-2 rounded-[4px] px-4 py-2 font-display text-lg leading-none font-semibold uppercase transition-colors duration-120",
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

        <ul className="mt-6 grid gap-x-6 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          {catalog.plans.map((plan, index) => {
            const price = plan.prices[cycle];
            const chosen = plan.key === CHOSEN_PLAN;
            const nameId = `plan-${plan.key}`;
            const delay = { animationDelay: `${index * 30}ms` };
            const flip = relabeled ? "motion-safe:animate-relabel" : undefined;
            return (
              <li
                key={plan.key}
                aria-labelledby={nameId}
                className="relative pt-6 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid lg:pt-0"
              >
                <div className="pb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 id={nameId} className="font-display text-[2.5rem] leading-none font-extrabold uppercase">
                      {t(`plans.${plan.key}.name`)}
                    </h3>
                    {chosen && (
                      <p className="rounded-etiqueta border-2 border-tinta bg-oferta px-2 py-0.5 text-[0.8125rem] font-semibold tracking-[0.06em] text-tinta uppercase">
                        {t("recommended")}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-[0.9375rem] leading-snug text-gris-texto">{t(`plans.${plan.key}.desc`)}</p>
                  <p className="sr-only">{t("includes")}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
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
                </div>

                <div className="-mx-4 border-y-2 border-tinta bg-ceja px-4 py-5 sm:-mx-6 sm:px-6 lg:relative lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:before:absolute lg:before:inset-y-0 lg:before:-right-[100vmax] lg:before:-left-[100vmax] lg:before:-z-10 lg:before:border-y-2 lg:before:border-tinta lg:before:bg-ceja lg:before:content-['']">
                  <div
                    className={cn(
                      "notch flex h-full flex-col rounded-etiqueta border-2 border-tinta bg-etiqueta py-4 pr-4 pl-6 shadow-etiqueta [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)]",
                      chosen && "outline-4 outline-offset-0 outline-oferta",
                    )}
                  >
                    <div className="pb-4 [perspective:600px]">
                      <div key={cycle} style={delay} className={flip}>
                        <p className="text-[clamp(2.5rem,5vw,4rem)] leading-none">
                          <PriceFigure parts={money.formatToParts(price.amount_cents / 100)} />
                        </p>
                        <p className="mt-1 text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">
                          {t("beforeTax")} · {t(cycle === "monthly" ? "perMonthLong" : "perYearLong")}
                        </p>
                        <dl className="mt-3 space-y-1 border-t border-dashed border-tinta/40 pt-3 font-display text-lg tabular-nums">
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
                        "mt-auto rounded-etiqueta border-2 border-tinta px-4 py-2.5 text-center font-semibold text-tinta transition-colors duration-120",
                        chosen ? "bg-oferta hover:bg-oferta-hover" : "bg-etiqueta hover:bg-ceja",
                      )}
                    >
                      {t("cta")}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mx-auto max-w-[72rem] px-4 pt-4 text-sm text-gris-texto sm:px-6">{t("note", { rate: ivaPercent })}</p>
    </section>
  );
}
