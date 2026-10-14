import Link from "next/link";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { uiBaseUrl } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b-2 border-tinta bg-anaquel">
      <div className="mx-auto flex h-16 max-w-[72rem] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href={`/${locale}`} aria-label={t("home")} className="flex shrink-0 items-center rounded-etiqueta">
          <BrandMark />
          <span className="ml-2 hidden font-display text-2xl leading-none font-extrabold uppercase min-[440px]:inline">
            Draxuvo
          </span>
        </Link>

        <nav aria-label={t("main")} className="hidden items-center gap-6 text-[0.9375rem] font-medium lg:flex">
          <a href="#precios" className="underline-offset-4 hover:underline">{t("plans")}</a>
          <a href="#panel" className="underline-offset-4 hover:underline">{t("screens")}</a>
          <a href="#modulos" className="underline-offset-4 hover:underline">{t("modules")}</a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <nav aria-label={t("language")} className="flex text-xs font-semibold">
            {routing.locales.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? "page" : undefined}
                aria-label={t(`languages.${code}`)}
                className={cn(
                  "grid h-8 w-7 place-items-center rounded-etiqueta uppercase transition-colors duration-120",
                  code === locale ? "bg-tinta text-etiqueta" : "text-gris-texto hover:text-tinta",
                )}
              >
                {code}
              </Link>
            ))}
          </nav>
          <a
            href={`${uiBaseUrl()}/${locale}/login`}
            className="rounded-etiqueta border-2 border-tinta px-2 py-1.5 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-120 hover:bg-etiqueta sm:px-3 sm:text-sm"
          >
            {t("login")}
          </a>
          <a
            href={`${uiBaseUrl()}/${locale}/registro`}
            className="notch notch-sm rounded-etiqueta border-2 border-tinta bg-oferta py-1.5 pr-2 pl-3 text-[0.8125rem] font-semibold whitespace-nowrap text-tinta transition-colors duration-120 [--notch-line:var(--color-tinta)] hover:bg-oferta-hover sm:pr-3 sm:pl-4 sm:text-sm"
          >
            {t("signup")}
          </a>
        </div>
      </div>
    </header>
  );
}
