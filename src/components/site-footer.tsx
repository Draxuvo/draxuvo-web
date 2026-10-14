import { useTranslations } from "next-intl";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-7" />
          <div>
            <p className="font-semibold text-white">Draxuvo</p>
            <p className="text-xs">{t("tagline")}</p>
          </div>
        </div>
        <nav aria-label={t("nav")} className="flex gap-6 text-sm">
          <a href="#modulos" className="hover:text-white">{t("modules")}</a>
          <a href="#precios" className="hover:text-white">{t("pricing")}</a>
        </nav>
        <p className="text-xs">{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
