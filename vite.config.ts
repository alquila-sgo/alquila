import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Evita que Vite empaquete una segunda copia de SvelteKit en desarrollo
	// (si pasa, redirect() deja de funcionar y da error 500).
	ssr: { optimizeDeps: { exclude: ['@sveltejs/kit'], include: ['@supabase/ssr'] } },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
