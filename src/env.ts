import { defineEnvVars } from '@sveltejs/kit/env';

// Los valores se cargan en .env (local) y en Cloudflare (producción).
// Se aceptan vacíos para que el build no falle; si faltan, la app avisa al usarlos.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		schema: (v) => v ?? '',
		description: 'URL del proyecto de Supabase (Project Settings → API)'
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		schema: (v) => v ?? '',
		description: 'Clave pública de Supabase (publishable). Es segura en el navegador.'
	}
});
