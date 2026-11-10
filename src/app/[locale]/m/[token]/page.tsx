// Menú de una mesa (spec 059). El QR imprime `/m/<token>`; el middleware de next-intl (src/proxy.ts) redirige a
// `/es/m/<token>` o `/en/m/<token>` según el idioma del teléfono. Sin encabezado, pie ni marca Draxuvo (FR-026) y
// fuera de los buscadores (FR-025). El menú lo pide el navegador directo a la API (contracts/web.md).
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicMenu } from "@/components/public-menu/public-menu";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function MenuPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 flex-col">
      <PublicMenu token={token} />
    </main>
  );
}
