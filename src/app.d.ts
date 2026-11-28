// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			/** Usuario con sesión verificada, o null si no ingresó. */
			usuario: () => Promise<{ id: string; email: string | null; foto: string | null } | null>;
		}
		interface PageData {
			usuario: {
				id: string;
				email: string | null;
				foto: string | null;
				nombre: string;
			} | null;
		}
	}
}

export {};
