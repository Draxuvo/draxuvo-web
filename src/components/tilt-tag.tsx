"use client";

import { type CSSProperties, type ElementType, type ReactNode, useEffect, useRef } from "react";

type TiltTagProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  "aria-labelledby"?: string;
};

const MAX_TILT = 6;

// Etiqueta que se inclina hacia el cursor (puntero fino) o hacia donde se inclina el teléfono
// (donde el navegador no pide permiso). Escribe variables CSS directo en el nodo: React no vuelve
// a pintar. Con "reducir movimiento" no hace nada y la etiqueta queda plana.
export function TiltTag({ children, as: Tag = "div", className, ...rest }: TiltTagProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = (rx: number, ry: number) => {
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--sx", String(-ry * 0.8));
      el.style.setProperty("--sy", String(rx * 0.8));
    };
    const cleanups: Array<() => void> = [];

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      el.dataset.tilt = "on";
      const onMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        set(-py * MAX_TILT * 2, px * MAX_TILT * 2);
      };
      const onLeave = () => set(0, 0);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    } else if (
      window.matchMedia("(pointer: coarse)").matches &&
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
    ) {
      el.dataset.tilt = "on";
      const onTilt = (event: DeviceOrientationEvent) => {
        const clamp = (value: number) => Math.max(-4, Math.min(4, value / 8));
        set(clamp((event.beta ?? 45) - 45), clamp(event.gamma ?? 0));
      };
      window.addEventListener("deviceorientation", onTilt);
      cleanups.push(() => window.removeEventListener("deviceorientation", onTilt));
    }

    return () => {
      cleanups.forEach((fn) => fn());
      delete el.dataset.tilt;
    };
  }, []);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
