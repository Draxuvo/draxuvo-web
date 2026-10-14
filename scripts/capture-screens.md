# Capturas del panel para el carrusel

Las imágenes de `public/screens/` son pantallas reales del panel (`draxuvo-ui`) con los datos de demo.
Se toman de nuevo cuando cambia el diseño del panel. Nunca se capturan cuentas con datos reales.

| Archivo | Ruta del panel | Tamaño |
|---|---|---|
| `dashboard-{desktop,mobile}.png` | `/es/dashboard` | 1440×900 y 390×844 |
| `ordenes-{desktop,mobile}.png` | `/es/ordenes` | 1440×900 y 390×844 |
| `inventario-{desktop,mobile}.png` | `/es/inventario?low_stock=true` | 1440×900 y 390×844 |
| `asistencia-{desktop,mobile}.png` | `/es/asistencia` | 1440×900 y 390×844 |
| `suscripcion-{desktop,mobile}.png` | `/es/suscripcion` | 1440×900 y 390×844 |

## Requisitos

1. API y panel corriendo con los seeds de demo: desde la raíz del workspace, `scripts/dev api ui`
   (API en `:3000`, panel en `:4200`).
2. `playwright-cli` instalado (`~/.local/bin/playwright-cli`) con Chromium de Playwright.
3. Cuenta de demo: `dueno@volta.demo` / `Demo12345*` (dueño de Electricidad Volta, plan Pro).

## Pasos

1. Guarda este script como `capture.js` **fuera** del repo (por ejemplo en `/tmp/capture.js`):

```js
async page => {
  const OUT = '<ruta absoluta a>/src/draxuvo-web/public/screens';
  const BASE = 'http://localhost:4200/es';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', 'dueno@volta.demo');
  await page.fill('#password', 'Demo12345*');
  await page.click('button[type=submit]');
  await page.waitForURL(u => !u.pathname.endsWith('/login'), { timeout: 20000 });
  const shots = [
    ['dashboard', '/dashboard'],
    ['ordenes', '/ordenes'],
    ['inventario', '/inventario?low_stock=true'],
    ['asistencia', '/asistencia'],
    ['suscripcion', '/suscripcion'],
  ];
  const sizes = [['desktop', 1440, 900], ['mobile', 390, 844]];
  for (const [label, w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    for (const [id, path] of shots) {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      // Oculta el indicador de Next.js del modo desarrollo.
      await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/${id}-${label}.png` });
    }
  }
  return 'ok';
}
```

2. Ejecuta desde un directorio fuera del repo (playwright-cli guarda sus snapshots en `.playwright-cli/`
   del directorio actual):

```bash
cd /tmp
playwright-cli -s=capturas open --browser=chromium http://localhost:4200/es/login
playwright-cli -s=capturas run-code --filename=/tmp/capture.js
playwright-cli -s=capturas close
```

3. Revisa cada imagen: que no aparezcan datos reales, overlays de desarrollo ni pantallas a medio cargar.
4. Si cambian los nombres o las rutas, actualiza `SLIDES` en `src/components/product-carousel.tsx`
   y los textos `carousel.slides.<id>` en `messages/{es,en}.json`.

`next/image` sirve las capturas optimizadas (WebP y tamaños responsivos), así que los PNG se
guardan tal cual.
