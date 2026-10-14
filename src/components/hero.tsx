import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-amber-500/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 size-72 rounded-full bg-orange-700/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">{t("tagline")}</p>
        <h1 id="hero-title" className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{t("subtitle")}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#precios"
            className="rounded-full bg-amber-400 px-6 py-3 text-center font-semibold text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            {t("ctaPrimary")}
          </a>
          <a
            href="#modulos"
            className="rounded-full border border-white/20 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t("ctaSecondary")}
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-400">{t("trialNote")}</p>
      </div>
    </section>
  );
}
