"use client";

import { useTranslations } from "next-intl";
import { m, useScroll, useSpring } from "motion/react";

// Cinta de etiquetadora pegada arriba: avanza con el scroll y lleva una muesca cada 10 %.
// Con "reducir movimiento" se omite. Es decorativa.
export function ReadingProgress() {
  const t = useTranslations("progress");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 });

  return (
    <div aria-hidden="true" data-label={t("label")} className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5 motion-reduce:hidden">
      <m.div
        style={{ scaleX }}
        className="h-full origin-left bg-oferta [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_calc(10%-2px),var(--color-tinta)_calc(10%-2px),var(--color-tinta)_10%)]"
      />
    </div>
  );
}
