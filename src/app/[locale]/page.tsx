import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlowDemo } from "@/components/flow-demo";
import { Hero } from "@/components/hero";
import { ModuleShowcase } from "@/components/module-showcase";
import { MotionProvider } from "@/components/motion-provider";
import { PricingSection } from "@/components/pricing-section";
import { ProductCarousel } from "@/components/product-carousel";
import { ReadingProgress } from "@/components/reading-progress";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPlans, uiBaseUrl } from "@/lib/plans";

// La tabla de precios se regenera cada hora con GET /api/v1/plans.
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const catalog = await getPlans();
  const tc = await getTranslations("carousel");
  const tz = await getTranslations("closing");

  return (
    <MotionProvider>
      <ReadingProgress />
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <Hero />
        <PricingSection catalog={catalog} />

        <section id="panel" aria-labelledby="panel-title" className="scroll-mt-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-[72rem] px-4 sm:px-6">
            <h2 id="panel-title" className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-5xl">
              {tc("title")}
            </h2>
            <p className="mt-3 max-w-[60ch] text-gris-texto">{tc("subtitle")}</p>
          </div>
          <div className="mt-8 border-y-2 border-tinta bg-ceja">
            <div className="mx-auto max-w-[72rem] px-4 py-6 sm:px-6 sm:py-8">
              <ProductCarousel />
            </div>
          </div>
          <FlowDemo />
        </section>

        <ModuleShowcase catalog={catalog} />

        <section aria-labelledby="closing-title" className="border-y-2 border-tinta bg-ceja">
          <div className="mx-auto flex max-w-[72rem] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="closing-title" className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] font-extrabold text-balance uppercase">
                {tz("title")}
              </h2>
              <p className="mt-3 max-w-[52ch] text-lg leading-snug">{tz("subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`${uiBaseUrl()}/${locale}/registro`}
                className="press notch rounded-etiqueta border-2 border-tinta bg-oferta py-3 pr-6 pl-8 font-display text-2xl leading-none font-extrabold text-tinta uppercase shadow-etiqueta transition-colors duration-120 [--notch-bg:var(--color-ceja)] [--notch-line:var(--color-tinta)] hover:bg-oferta-hover"
              >
                {tz("signup")}
              </a>
              <a href="#precios" className="font-semibold underline decoration-2 underline-offset-4">
                {tz("plans")}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
