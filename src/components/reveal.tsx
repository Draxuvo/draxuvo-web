"use client";

import { type ElementType, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  // Posición entre hermanas: cada una entra 40 ms después de la anterior.
  index?: number;
};

// Entrada al hacer scroll. Sin JavaScript el contenido se ve tal cual: el estado oculto solo se
// aplica después de montar, y solo a lo que todavía no está en pantalla. Las clases de transición
// y de estado oculto viven bajo motion-safe, así que con "reducir movimiento" nada se mueve.
export function Reveal({ children, as: Tag = "div", className, index = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={index ? { transitionDelay: `${index * 40}ms` } : undefined}
      className={cn(
        "motion-safe:transition-[opacity,translate] motion-safe:duration-180 motion-safe:ease-etiqueta",
        "motion-safe:data-[reveal=pending]:-translate-y-1.5 motion-safe:data-[reveal=pending]:opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
