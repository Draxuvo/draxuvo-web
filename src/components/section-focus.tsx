"use client";

import { useEffect } from "react";

// Al saltar a una sección por su ancla, el foco pasa al título de esa sección para que el
// teclado y los lectores de pantalla sigan desde ahí. No cambia el scroll.
export function SectionFocus() {
  useEffect(() => {
    function focusTarget(hash: string) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const heading = target.matches("h1,h2,h3,h4") ? target : target.querySelector<HTMLElement>("h1,h2,h3");
      const el = heading ?? target;
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (link) window.setTimeout(() => focusTarget(link.hash), 0);
    };
    const onHash = () => focusTarget(window.location.hash);
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  return null;
}
