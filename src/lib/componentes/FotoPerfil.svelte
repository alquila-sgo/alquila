<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { comprimirFoto } from '#lib/imagenes.js';

	// Foto de perfil redonda: tocarla abre la galería o la cámara y la sube enseguida.
	let { foto, inicial }: { foto: string | null; inicial: string } = $props();
	let subiendo = $state(false);
	let error = $state('');
	let rota = $state('');

	async function elegir(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const archivo = input.files?.[0];
		input.value = '';
		if (!archivo) return;
		error = '';
		subiendo = true;
		try {
			const fd = new FormData();
			fd.append('archivo', await comprimirFoto(archivo, 600), 'foto');
			const r = await fetch('/api/foto-perfil', { method: 'POST', body: fd });
			if (!r.ok) {
				const cuerpo = (await r.json().catch(() => null)) as { message?: string } | null;
				error = cuerpo?.message ?? 'No se pudo subir la foto.';
			}
		} catch {
			error = 'No se pudo leer esa foto. Probá con otra.';
		}
		subiendo = false;
		await invalidateAll();
	}
</script>

<div class="flex flex-col items-center gap-2">
	<label class="relative cursor-pointer" aria-label="Cambiar foto de perfil">
		{#if foto && rota !== foto}
			<img
				src={foto}
				alt=""
				class="h-28 w-28 rounded-full object-cover shadow-md ring-4 ring-white"
				referrerpolicy="no-referrer"
				onerror={() => (rota = foto ?? '')}
			/>
		{:else}
			<span
				class="grid h-28 w-28 place-items-center rounded-full bg-marca-700 text-4xl font-bold text-white uppercase shadow-md ring-4 ring-white"
			>
				{inicial}
			</span>
		{/if}
		<span
			class="absolute right-0 bottom-0 grid h-9 w-9 place-items-center rounded-full bg-sol-500 text-white shadow ring-2 ring-white"
		>
			<svg
				viewBox="0 0 24 24"
				class="h-5 w-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
				/><circle cx="12" cy="13" r="3.5" />
			</svg>
		</span>
		<input type="file" accept="image/*" class="sr-only" disabled={subiendo} onchange={elegir} />
	</label>
	<span class="text-sm text-slate-500">{subiendo ? 'Subiendo…' : 'Foto (opcional)'}</span>
	{#if error}<span class="text-sm text-red-700">{error}</span>{/if}
</div>
