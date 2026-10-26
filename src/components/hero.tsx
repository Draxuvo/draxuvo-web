import { useLocale, useTranslations } from "next-intl";
import { demoUrl, uiBaseUrl } from "@/lib/plans";

// Coreografía solo con CSS (globals.css): el titular se imprime, el resto llega después. Los
// botones y los precios están en el HTML desde el inicio: la animación solo los asienta.
export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();

  return (
    <section aria-labelledby="hero-title" className="border-b-2 border-tinta bg-ceja">
      <div className="mx-auto grid max-w-[72rem] gap-x-10 gap-y-4 px-4 pt-6 pb-5 sm:px-6 lg:grid-cols-[1fr_24rem] lg:items-center lg:py-7">
        <h1
          id="hero-title"
          className="hero-print font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.01em] text-balance uppercase"
        >
          {t("title")}
        </h1>
        <div>
          <p style={{ "--d": "350ms" } as React.CSSProperties} className="hero-rise max-w-[52ch] leading-snug lg:text-lg">
            {t("subtitle")}
          </p>
          <div style={{ "--d": "600ms" } as React.CSSProperties} className="hero-settle mt-4 flex flex-wrap items-center gap-2.5">
            <a
              href={`${uiBaseUrl()}/${locale}/registro`}
              className="press notch rounded-etiqueta border-2 border-tinta bg-oferta py-2.5 pr-5 pl-7 font-display text-xl leading-none font-extrabold text-tinta uppercase shadow-etiqueta transition-colors duration-120 [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)] hover:bg-oferta-hover lg:text-2xl"
            >
              {t("signup")}
            </a>
            <a
              href={demoUrl(locale)}
              className="press rounded-etiqueta border-2 border-tinta bg-etiqueta px-4 py-2.5 font-display text-xl leading-none font-semibold uppercase transition-colors duration-120 hover:bg-ceja lg:text-2xl"
            >
              {t("demo")}
            </a>
            <a
              href={`${uiBaseUrl()}/${locale}/login`}
              className="press rounded-etiqueta border-2 border-tinta px-4 py-2.5 font-display text-xl leading-none font-semibold uppercase transition-colors duration-120 hover:bg-etiqueta lg:text-2xl"
            >
              {t("login")}
            </a>
          </div>
          <p className="mt-2 text-sm font-medium">{t("trialNote")}</p>
        </div>
      </div>
    </section>
  );
}
