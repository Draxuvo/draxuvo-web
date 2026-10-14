"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type BillingCycle, type PlansResponse, registrationUrl } from "@/lib/plans";
import { cn } from "@/lib/utils";

const CYCLES: BillingCycle[] = ["monthly", "annual"];

export function PricingSection({ catalog }: { catalog: PlansResponse }) {
  const t = useTranslations("pricing");
  const tm = useTranslations("modules");
  const locale = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const money = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  });
  const format = (cents: number) => money.format(cents / 100);
  const ivaPercent = Math.round(catalog.iva_rate * 100);

  return (
    <section id="precios" aria-labelledby="pricing-title" className="scroll-mt-16 bg-slate-50 py-20 text-slate-900 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="pricing-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-slate-600">{t("subtitle")}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <div role="group" aria-label={t("cycleLabel")} className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {CYCLES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={cycle === value}
                onClick={() => setCycle(value)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                  cycle === value ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {t(value)}
                {value === "annual" && (
                  <span className={cn("ml-2 text-xs", cycle === value ? "text-amber-300" : "text-amber-700")}>
                    {t("annualNote")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {catalog.plans.map((plan) => {
            const price = plan.prices[cycle];
            const recommended = plan.key === "pro";
            const nameId = `plan-${plan.key}`;
            return (
              <li
                key={plan.key}
                aria-labelledby={nameId}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm",
                  recommended ? "border-amber-400 ring-2 ring-amber-400" : "border-slate-200",
                )}
              >
                {recommended && (
                  <p className="absolute -top-3 left-8 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-slate-950">
                    {t("recommended")}
                  </p>
                )}
                <h3 id={nameId} className="text-xl font-semibold">{t(`plans.${plan.key}.name`)}</h3>
                <p className="mt-2 min-h-12 text-sm text-slate-600">{t(`plans.${plan.key}.desc`)}</p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{format(price.amount_cents)}</span>
                  <span className="text-sm text-slate-500">{t(cycle === "monthly" ? "perMonth" : "perYear")}</span>
                </p>
                <dl className="mt-3 space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <dt>{t("iva", { rate: ivaPercent })}</dt>
                    <dd>{format(price.iva_cents)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900">
                    <dt>{t("total")}</dt>
                    <dd>{format(price.total_cents)}</dd>
                  </div>
                </dl>

                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("includes")}</p>
                <ul className="mt-3 flex-1 space-y-2 text-sm">
                  {plan.modules.map((module) => (
                    <li key={module} className="flex items-start gap-2">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {tm(`items.${module}.title`)}
                    </li>
                  ))}
                </ul>

                <a
                  href={registrationUrl(locale, plan.key, cycle)}
                  aria-describedby={nameId}
                  className={cn(
                    "mt-8 rounded-full px-5 py-3 text-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                    recommended
                      ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                      : "bg-slate-950 text-white hover:bg-slate-800",
                  )}
                >
                  {t("cta")}
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-sm text-slate-500">{t("note", { rate: ivaPercent })}</p>
      </div>
    </section>
  );
}
