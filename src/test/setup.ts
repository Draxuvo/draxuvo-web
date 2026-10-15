import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement, forwardRef } from "react";
import { afterEach, beforeEach, vi } from "vitest";

// matchMedia conmutable por consulta: setMediaMatches("(prefers-reduced-motion: reduce)", true).
const mediaMatches = new Map<string, boolean>();
const mediaListeners = new Map<string, Set<(e: MediaQueryListEvent) => void>>();

export function setMediaMatches(query: string, matches: boolean) {
  mediaMatches.set(query, matches);
  mediaListeners.get(query)?.forEach((listener) => listener({ matches, media: query } as MediaQueryListEvent));
}

beforeEach(() => {
  mediaMatches.clear();
  mediaListeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return mediaMatches.get(query) ?? false;
    },
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
      if (!mediaListeners.has(query)) mediaListeners.set(query, new Set());
      mediaListeners.get(query)!.add(listener);
    },
    removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
      mediaListeners.get(query)?.delete(listener);
    },
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
window.scrollTo = (() => {}) as typeof window.scrollTo;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute("open");
};

// motion/react: `m.<tag>` pinta el elemento plano, sin props de animación.
const MOTION_PROPS = new Set([
  "initial", "animate", "exit", "variants", "transition", "whileHover", "whileTap", "whileInView",
  "whileFocus", "whileDrag", "viewport", "layout", "layoutId", "drag", "dragControls",
  "dragConstraints", "dragElastic", "dragMomentum", "onDragStart", "onDrag", "onDragEnd",
  "onAnimationComplete", "onViewportEnter", "onViewportLeave", "custom",
]);

vi.mock("motion/react", () => {
  const motionValue = (value: unknown) => ({ get: () => value, set: () => {}, on: () => () => {} });
  const cache = new Map<string, unknown>();
  const m = new Proxy({} as Record<string, unknown>, {
    get(_, tag: string) {
      if (!cache.has(tag)) {
        cache.set(
          tag,
          forwardRef<unknown, Record<string, unknown>>(function MotionStub(props, ref) {
            const rest: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(props)) if (!MOTION_PROPS.has(key)) rest[key] = value;
            if (rest.style && typeof rest.style === "object") {
              rest.style = Object.fromEntries(
                Object.entries(rest.style as object).filter(([, v]) => typeof v !== "object" || v === null),
              );
            }
            return createElement(tag, { ...rest, ref });
          }),
        );
      }
      return cache.get(tag);
    },
  });
  const passthrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    m,
    motion: m,
    LazyMotion: passthrough,
    MotionConfig: passthrough,
    AnimatePresence: passthrough,
    domAnimation: {},
    domMax: {},
    useScroll: () => ({ scrollX: motionValue(0), scrollY: motionValue(0), scrollXProgress: motionValue(0), scrollYProgress: motionValue(0) }),
    useTransform: (_: unknown, __?: unknown, output?: unknown[]) => motionValue(output?.[0] ?? 0),
    useSpring: (value: unknown) => motionValue(typeof value === "number" ? value : 0),
    useMotionValue: (value: unknown) => motionValue(value),
    useMotionValueEvent: () => {},
    useDragControls: () => ({ start: () => {} }),
    useReducedMotion: () => false,
    animate: () => ({ stop: () => {}, then: (fn: () => void) => fn() }),
  };
});

afterEach(() => {
  cleanup();
});
