import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { BUSINESS_TYPES, MODULE_ICONS, modulesWithPlan } from "@/lib/modules";
import { type PlansResponse, uiBaseUrl } from "@/lib/plans";
import { Reveal } from "./reveal";

export function ModuleShowcase({ catalog }: { catalog: PlansResponse }) {
  const t = useTranslations("modules");
  const tp = useTranslations("pricing");
  const locale = useLocale();
  const modules = modulesWithPlan(catalog);

  return (
    <section id="modulos" aria-labelledby="modules-title" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-[72rem] px-4 sm:px-6">
        <h2 id="modules-title" className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-gris-texto">{t("subtitle")}</p>

        <nav aria-label={t("title")} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {modules.map(({ key }) => {
              const Icon = MODULE_ICONS[key];
              return (
                <li key={key}>
                  <a
                    href={`#modulo-${key}`}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-etiqueta px-3 py-1.5 text-sm font-semibold transition-colors duration-120 hover:bg-ceja"
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

      <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
        {modules.map(({ key, plan }) => {
          const Icon = MODULE_ICONS[key];
          const features = t.raw(`items.${key}.features`) as string[];
          const titleId = `modulo-${key}-title`;
          return (
            <article key={key} id={`modulo-${key}`} aria-labelledby={titleId} className="scroll-mt-20">
              <div className="mx-auto grid max-w-[72rem] gap-6 px-4 pb-6 sm:px-6 md:grid-cols-[17rem_1fr] md:gap-10 lg:grid-cols-[17rem_1fr_1fr]">
                <Reveal className="md:row-span-2 lg:row-span-1">
                  <div className="notch rounded-etiqueta border-2 border-tinta bg-etiqueta p-5 pl-7 shadow-etiqueta [--notch-line:var(--color-tinta)]">
                    <Icon className="size-7" strokeWidth={1.75} aria-hidden="true" />
                    <h3 id={titleId} className="mt-3 font-display text-[2rem] leading-none font-extrabold uppercase">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-snug text-gris-texto">{t(`items.${key}.desc`)}</p>
                    {plan && (
                      <p className="mt-4 inline-flex rounded-full bg-sello px-3 py-1 text-[0.8125rem] font-semibold text-etiqueta">
                        {t("planLabel", { plan: tp(`plans.${plan}.name`) })}
                      </p>
                    )}
                  </div>
                  <a
                    href={`${uiBaseUrl()}/${locale}/registro`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 transition-colors duration-120 hover:decoration-oferta"
                  >
                    {t("signup")}
                    <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </Reveal>

                <div>
                  <h4 className="text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">{t("problemLabel")}</h4>
                  <p className="mt-1.5 max-w-[60ch]">{t(`items.${key}.problem`)}</p>
                  <h4 className="mt-6 text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">{t("featuresLabel")}</h4>
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
                  <h4 className="text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase">{t("examplesLabel")}</h4>
                  <dl className="mt-2 divide-y divide-anaquel-borde border-y border-anaquel-borde">
                    {BUSINESS_TYPES.map((type) => (
                      <div key={type} className="py-3">
                        <dt className="font-display text-lg leading-tight font-semibold uppercase">{t(`businessTypes.${type}`)}</dt>
                        <dd className="mt-0.5 text-[0.9375rem] leading-snug text-gris-texto">{t(`items.${key}.examples.${type}`)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div aria-hidden="true" className="h-3 border-y-2 border-tinta bg-ceja" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
