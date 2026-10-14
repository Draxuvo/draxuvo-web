import { useLocale, useTranslations } from "next-intl";
import { uiBaseUrl } from "@/lib/plans";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-tinta text-etiqueta">
      <div className="mx-auto grid max-w-[72rem] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <BrandMark withName />
          <p className="mt-2 text-sm text-etiqueta/75">{t("tagline")}</p>
        </div>
        <nav aria-label={t("nav")}>
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[0.9375rem]">
            <li><a href="#precios" className="underline-offset-4 hover:underline">{t("plans")}</a></li>
            <li><a href="#panel" className="underline-offset-4 hover:underline">{t("screens")}</a></li>
            <li><a href="#modulos" className="underline-offset-4 hover:underline">{t("modules")}</a></li>
            <li><a href={`${uiBaseUrl()}/${locale}/login`} className="underline-offset-4 hover:underline">{t("login")}</a></li>
            <li><a href={`${uiBaseUrl()}/${locale}/registro`} className="underline-offset-4 hover:underline">{t("signup")}</a></li>
          </ul>
        </nav>
        <p className="border-t border-etiqueta/20 pt-6 text-xs text-etiqueta/75 md:col-span-2">{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
