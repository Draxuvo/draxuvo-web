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
