import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Draxuvo</h1>
      <p className="text-lg text-neutral-600">{t("tagline")}</p>
    </main>
  );
}
