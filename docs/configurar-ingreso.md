# Configurar el ingreso con Google y por email

Pasos que se hacen una sola vez en los paneles. Los nombres de los menús pueden cambiar un poco con el tiempo.

**Nunca pegues claves ni contraseñas en el chat ni en el código.** Van solo en los paneles.

## 1. Datos de tu proyecto de Supabase

Supabase → tu proyecto → **Project Settings → API** (o **Data API**). Anotá:

- **Project URL** (algo como `https://abcd1234.supabase.co`)
- **Publishable key** (empieza con `sb_publishable_`; si no aparece, la `anon` key)

Las dos son públicas (van al navegador). Se cargan en tu archivo `.env` local y en Cloudflare.

## 2. Credenciales de Google

1. Entrá a [console.cloud.google.com](https://console.cloud.google.com) con tu cuenta de Google y creá un proyecto (por ejemplo "Alquila Sgo").
2. **APIs y servicios → Pantalla de consentimiento de OAuth** (o **Google Auth Platform**): tipo **Externo**, nombre de la app "Alquilá Sgo", tu email de soporte. Guardá.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo: **Aplicación web**
   - **URI de redireccionamiento autorizados**: `https://TU-PROYECTO.supabase.co/auth/v1/callback` (tu Project URL + `/auth/v1/callback`)
4. Google te muestra un **ID de cliente** y un **Secreto del cliente**. No los cierres todavía.

## 3. Activar Google en Supabase

Supabase → **Authentication → Sign In / Providers → Google**: activalo y pegá ahí el ID de cliente y el secreto. Guardá.

## 4. Direcciones permitidas para volver a la app

Supabase → **Authentication → URL Configuration**:

- **Site URL**: la dirección de la app publicada (por ahora la de Cloudflare, tipo `https://alquila.TU-USUARIO.workers.dev`).
- **Redirect URLs**: agregá estas dos:
  - `http://localhost:5173/auth/callback**`
  - `https://alquila.TU-USUARIO.workers.dev/auth/callback**`

Cuando tengas el dominio propio, se agrega también `https://alquilasgo.com.ar/auth/callback**`.

## 5. Email

El ingreso por enlace al email funciona con el servicio de email que trae Supabase, que tiene un límite bajo de envíos por hora (pensado para pruebas). Antes del lanzamiento conviene conectar un servicio de envío propio (SMTP) en **Authentication → Emails / SMTP Settings**.

## 6. Probarlo en tu computadora

```sh
cp .env.example .env   # completá PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Abrí http://localhost:5173/ingresar.
