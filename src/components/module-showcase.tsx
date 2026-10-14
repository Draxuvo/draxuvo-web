import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { BUSINESS_TYPES, MODULE_ICONS, modulesWithPlan } from "@/lib/modules";
import { type PlansResponse, uiBaseUrl } from "@/lib/plans";
import { Reveal } from "./reveal";

const labelClass = "text-[0.8125rem] font-semibold tracking-[0.06em] text-gris-texto uppercase";

export function ModuleShowcase({ catalog }: { catalog: PlansResponse }) {
  const t = useTranslations("modules");
  const tp = useTranslations("pricing");
  const locale = useLocale();
  const modules = modulesWithPlan(catalog);

  return (
    <section id="modulos" aria-labelledby="modules-title" className="giros scroll-mt-16 pt-16 sm:pt-24">
      <div className="mx-auto max-w-[72rem] px-4 sm:px-6">
        <h2 id="modules-title" className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-gris-texto">{t("subtitle")}</p>

        <nav aria-label={t("title")} className="mt-6">
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

      <div className="sticky top-16 z-30 mt-8 border-y-2 border-tinta bg-anaquel">
        <fieldset className="mx-auto flex max-w-[72rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <legend className="float-left font-display text-lg leading-none font-semibold uppercase">{t("switchLabel")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {BUSINESS_TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input type="radio" name="giro" value={type} defaultChecked={type === "restaurant"} className="peer sr-only" />
                <span className="inline-block rounded-etiqueta border-2 border-tinta bg-etiqueta px-3 py-1 text-sm font-semibold transition-colors duration-120 peer-checked:bg-tinta peer-checked:text-etiqueta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta hover:bg-ceja peer-checked:hover:bg-tinta">
                  {t(`businessTypes.${type}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-10">
        {modules.map(({ key, plan }) => {
          const Icon = MODULE_ICONS[key];
          const features = t.raw(`items.${key}.features`) as string[];
          const titleId = `modulo-${key}-title`;
          return (
            <article key={key} id={`modulo-${key}`} aria-labelledby={titleId} className="scroll-mt-32">
              <div className="border-y-2 border-tinta bg-ceja">
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

              <div className="mx-auto grid max-w-[72rem] gap-6 px-4 pt-6 pb-12 sm:px-6 md:grid-cols-3 md:gap-10 md:pb-16">
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
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 transition-colors duration-120 hover:decoration-oferta"
                  >
                    {t("signup")}
                    <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
