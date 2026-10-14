import { useLocale, useTranslations } from "next-intl";
import { uiBaseUrl } from "@/lib/plans";

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();

  return (
    <section aria-labelledby="hero-title" className="border-b-2 border-tinta bg-ceja">
      <div className="mx-auto grid max-w-[72rem] gap-6 px-4 pt-8 pb-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
        <div>
          <h1
            id="hero-title"
            className="max-w-[24ch] font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[0.95] font-extrabold tracking-[-0.01em] text-balance uppercase"
          >
            {t("title")}
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg leading-snug">{t("subtitle")}</p>
        </div>
        <div>
          <div className="shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${uiBaseUrl()}/${locale}/registro`}
                className="notch rounded-etiqueta border-2 border-tinta bg-oferta py-3 pr-6 pl-8 font-display text-2xl leading-none font-extrabold text-tinta uppercase shadow-etiqueta transition-colors duration-120 [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)] hover:bg-oferta-hover"
              >
                {t("signup")}
              </a>
              <a
                href={`${uiBaseUrl()}/${locale}/login`}
                className="rounded-etiqueta border-2 border-tinta px-5 py-3 font-display text-2xl leading-none font-semibold uppercase transition-colors duration-120 hover:bg-etiqueta"
              >
                {t("login")}
              </a>
            </div>
            <p className="mt-3 text-[0.9375rem] font-medium">{t("trialNote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
