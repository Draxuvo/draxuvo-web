import Link from "next/link";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { uiBaseUrl } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">Draxuvo</span>
        </Link>

        <nav aria-label={t("main")} className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#modulos" className="hover:text-white">{t("modules")}</a>
          <a href="#precios" className="hover:text-white">{t("pricing")}</a>
          <a href={`${uiBaseUrl()}/${locale}/login`} className="hover:text-white">{t("login")}</a>
        </nav>

        <div className="flex items-center gap-3">
          <nav aria-label={t("language")} className="flex rounded-full border border-white/15 p-0.5 text-xs font-medium">
            {routing.locales.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? "page" : undefined}
                aria-label={t(`languages.${code}`)}
                className={cn(
                  "rounded-full px-2.5 py-1 uppercase transition-colors",
                  code === locale ? "bg-white text-slate-950" : "text-slate-300 hover:text-white",
                )}
              >
                {code}
              </Link>
            ))}
          </nav>
          <a
            href="#precios"
            className="hidden rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 sm:inline-block"
          >
            {t("start")}
          </a>
        </div>
      </div>
    </header>
  );
}
