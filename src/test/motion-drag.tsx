import { createElement, forwardRef } from "react";

type DragInfo = { offset: { x: number; y: number }; velocity: { x: number; y: number } };
export type DragSpy = {
  // Un manejador por eje (drag="x" o "y"): el carrusel y el visor conviven en la misma página.
  onDragEnd: Partial<Record<string, (event: unknown, info: DragInfo) => void>>;
  starts: number;
  animations: number[];
  values: number[];
};

const DROP = new Set([
  "drag", "dragControls", "dragListener", "dragConstraints", "dragElastic", "dragMomentum", "onDragEnd",
  "initial", "animate", "exit", "variants", "transition", "whileHover", "whileTap", "whileInView", "viewport",
]);

// Sustituto de motion/react que deja disparar onDragEnd a mano: jsdom no tiene gestos de arrastre.
export function motionDragMock(spy: DragSpy, reduced = false) {
  const cache = new Map<string, unknown>();
  const m = new Proxy({} as Record<string, unknown>, {
    get(_, tag: string) {
      if (cache.has(tag)) return cache.get(tag);
      const component = forwardRef<unknown, Record<string, unknown>>(function MotionStub(props, ref) {
        if (typeof props.onDragEnd === "function" && typeof props.drag === "string") spy.onDragEnd[props.drag] = props.onDragEnd as never;
        const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !DROP.has(key)));
        if (rest.style && typeof rest.style === "object") {
          rest.style = Object.fromEntries(Object.entries(rest.style).filter(([, v]) => typeof v !== "object" || v === null));
        }
        return createElement(tag, { ...rest, ref });
      });
      cache.set(tag, component);
      return component;
    },
  });
  return {
    m,
    motion: m,
    useDragControls: () => ({ start: () => { spy.starts += 1; } }),
    useMotionValue: (initial: number) => ({ get: () => initial, set: (value: number) => { spy.values.push(value); } }),
    useReducedMotion: () => reduced,
    animate: (_: unknown, target: number) => { spy.animations.push(target); return { stop: () => {} }; },
  };
}

export const newDragSpy = (): DragSpy => ({ onDragEnd: {}, starts: 0, animations: [], values: [] });
