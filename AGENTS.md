<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Pruebas

`npm test` (Vitest + jsdom + Testing Library), `npm run lint` (`--max-warnings 0`) y `npx tsc --noEmit`. Las pruebas viven junto al código (`*.test.ts(x)`); `src/test/render.tsx` pinta con los mensajes reales de `messages/es.json` y `src/test/setup.ts` simula `matchMedia`, `motion/react` y `<dialog>`. CI en `.github/workflows/ci.yml`. Para gestos de arrastre (carrusel, visor) las pruebas usan `src/test/motion-drag.tsx`, que sustituye `motion/react` y deja disparar `onDragEnd` a mano.
