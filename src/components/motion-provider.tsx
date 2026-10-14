"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// Carga las funciones de motion (con arrastre) en diferido y respeta "reducir movimiento" del sistema.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={() => import("./motion-features").then((module) => module.default)} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
