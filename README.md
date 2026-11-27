# Alquilá Sgo

Web para celular (PWA) de alquileres en Santiago del Estero.

- **Web:** SvelteKit + TypeScript + Tailwind, publicada en Cloudflare Workers.
- **Base de datos y cuentas:** Supabase. Las tablas y reglas de seguridad están en `supabase/migrations/`.
- **Fotos:** Cloudflare R2.
- **Mapa:** MapLibre + OpenFreeMap.

## Correrlo en tu computadora

Necesitás [Node.js](https://nodejs.org) 22 o más nuevo.

```sh
npm install
cp .env.example .env   # y completá los valores
npm run dev            # abre en http://localhost:5173
```

## Base de datos local (opcional)

Con [Docker](https://www.docker.com) instalado podés levantar un Supabase local con las tablas ya creadas:

```sh
npx supabase start -x realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

Te muestra una `API_URL` y una `PUBLISHABLE_KEY` para tu `.env`. Los emails de ingreso llegan a http://127.0.0.1:54324.

## Comandos

| Comando                           | Para qué                                           |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                             |
| `npm run build`                   | Arma la versión de producción                      |
| `npm run preview`                 | Prueba la versión de producción como en Cloudflare |
| `npm run check`                   | Revisa tipos y errores                             |
| `npm run lint` / `npm run format` | Revisa / arregla el formato del código             |

## Seguridad

Nunca subas claves al repositorio. `.env` está en `.gitignore`. Los valores de producción se cargan en Cloudflare (Workers → alquila → Settings → Variables and Secrets).

## Guías

- [Configurar el ingreso con Google y por email](docs/configurar-ingreso.md)
