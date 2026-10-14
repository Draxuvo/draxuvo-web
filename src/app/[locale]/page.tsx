import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { ModulesSection } from "@/components/modules-section";
import { PricingSection } from "@/components/pricing-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPlans } from "@/lib/plans";

// La tabla de precios se regenera cada hora con GET /api/v1/plans.
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const catalog = await getPlans();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <Hero />
        <ModulesSection />
        <PricingSection catalog={catalog} />
      </main>
      <SiteFooter />
    </>
  );
}
