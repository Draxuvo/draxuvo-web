# draxuvo-web

Sitio público de **Draxuvo**: presenta el ERP y sus planes, y lleva al registro en el panel. Next.js 16 con next-intl (`es`, `en`). Parte del [workspace Draxuvo](https://github.com/bothi3119/bothi).

## Empezar

Requiere Node 22.

```bash
npm ci
npm run dev   # http://localhost:4300
```

Variables (`.env.local`):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | API de Draxuvo (por ejemplo `http://localhost:3000`) |
| `NEXT_PUBLIC_UI_URL` | Panel (por ejemplo `http://localhost:4200`); los enlaces al registro apuntan allá |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción (puerto 4300) |
| `npm run lint` | ESLint con `--max-warnings 0` |
| `npm test` | Vitest, jsdom y Testing Library |

Las pruebas viven junto al código (`*.test.ts(x)`). El CI (`.github/workflows/ci.yml`) corre lint, tipos, pruebas y compilación.

## Más información

[`AGENTS.md`](AGENTS.md) y [`CLAUDE.md`](CLAUDE.md) explican las convenciones del repo. El diseño sale de `DESIGN.md` en la raíz del workspace.

## Despliegue a producción (Cloudflare Workers)

Producción: **https://draxuvo.com** (Worker `draxuvo-web`, plan gratuito). Spec: `specs/012-deploy-produccion/` del workspace.

- **Automático**: cada push a `main` con el CI en verde ejecuta el job `deploy` de `.github/workflows/ci.yml`
  (`npm run deploy:vinext`). Secretos del repo: `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
- **Variables de build** (se fijan al compilar, no en tiempo de ejecución): `NEXT_PUBLIC_API_URL=https://api.draxuvo.com` y `NEXT_PUBLIC_UI_URL=https://app.draxuvo.com`.
- **Manual**: `NEXT_PUBLIC_API_URL=https://api.draxuvo.com NEXT_PUBLIC_UI_URL=https://app.draxuvo.com npm run deploy:vinext` (compila con vinext y despliega con `cf`; requiere `cf auth login` o `CLOUDFLARE_API_TOKEN`).
  Para validar sin desplegar: `npx vinext-cloudflare deploy --dry-run`.
- **Local con el runtime de Workers**: `npm run build:vinext && npx vite preview` (el desarrollo diario sigue siendo `npm run dev`).
- **Reversa**: `npx wrangler rollback --name draxuvo-web` (vuelve a la versión anterior; con un ID de versión, a esa) o, desde el panel de Cloudflare, Workers → `draxuvo-web` → Deployments → Rollback. No revierte los recursos enlazados (KV). Objetivo: < 15 min.
- **Configuración**: `cloudflare.config.ts` (nombre, dominio personalizado y bindings) y `vite.config.ts`.
- **Caché**: la portada se regenera cada hora (ISR, planes de la API); su caché de datos vive en un namespace de Workers KV (`VINEXT_KV_CACHE`), que `cf deploy` crea la primera vez.
- `www.draxuvo.com` redirige a `draxuvo.com` con una regla de redirección en Cloudflare (no es parte de este Worker).
