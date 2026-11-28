<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ESTADOS, MAX_FOTOS, MIN_FOTOS } from '#lib/avisos.js';
	import { comprimirFoto } from '#lib/imagenes.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let a = $derived(data.aviso);
	let subiendo = $state('');
	let errorFotos = $state('');

	async function subir(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const archivos = [...(input.files ?? [])];
		input.value = '';
		errorFotos = '';
		const lugar = MAX_FOTOS - a.fotos.length;
		if (archivos.length > lugar) {
			errorFotos = `Podés subir ${lugar} foto${lugar === 1 ? '' : 's'} más.`;
			archivos.length = Math.max(lugar, 0);
		}
		for (const [i, archivo] of archivos.entries()) {
			subiendo = `Subiendo foto ${i + 1} de ${archivos.length}…`;
			try {
				const blob = await comprimirFoto(archivo);
				const fd = new FormData();
				fd.append('aviso_id', a.id);
				fd.append('archivo', blob, 'foto');
				const r = await fetch('/api/fotos', { method: 'POST', body: fd });
				if (!r.ok) {
					const cuerpo = (await r.json().catch(() => null)) as { message?: string } | null;
					errorFotos = cuerpo?.message ?? 'No se pudo subir una foto.';
					break;
				}
			} catch {
				errorFotos = `No se pudo leer "${archivo.name}". Probá con otra foto.`;
				break;
			}
		}
		subiendo = '';
		await invalidateAll();
	}

	const boton = 'btn btn-chico';
</script>

<svelte:head><title>{a.titulo} · Mis avisos</title></svelte:head>

<section class="space-y-6">
	<a href={resolve('/mis-avisos')} class="text-sm text-marca-700">← Mis avisos</a>

	<div class="space-y-1">
		<h1 class="titulo-pagina">{a.titulo}</h1>
		<p class="text-sm text-slate-600">
			Estado: <strong>{data.vencido ? 'Vencido' : (ESTADOS[a.estado] ?? a.estado)}</strong>
			{#if a.estado === 'publicado' && a.vence_el && !data.vencido}
				· vence el {new Date(a.vence_el).toLocaleDateString('es-AR')}
			{/if}
		</p>
	</div>

	{#if data.nuevo}
		<p class="aviso-ok">
			Datos guardados. Paso 2 de 2: subí al menos {MIN_FOTOS} fotos y tocá "Publicar".
		</p>
	{/if}
	{#if a.estado === 'oculto'}
		<p class="aviso-alerta">
			Este aviso recibió denuncias y está en revisión. Te vamos a contactar.
		</p>
	{/if}

	<div class="space-y-3">
		<h2 class="text-lg font-bold">Fotos ({a.fotos.length}/{MAX_FOTOS})</h2>
		<p class="text-xs text-slate-500">
			Mínimo {MIN_FOTOS}. La primera es la portada. Usá fotos tuyas de la propiedad.
		</p>

		<ul class="grid grid-cols-3 gap-2">
			{#each a.fotos as f, i (f.id)}
				<li class="relative">
					<img src="/fotos/{f.clave}" alt="" class="aspect-square w-full rounded-xl object-cover" />
					{#if i === 0}
						<span
							class="absolute top-1 left-1 rounded-md bg-sol-500 px-1.5 text-xs font-semibold text-white"
						>
							Portada
						</span>
					{/if}
					<div class="mt-1 flex justify-between text-xs">
						{#if i > 0}
							<form method="POST" action="?/portada" use:enhance>
								<input type="hidden" name="foto_id" value={f.id} />
								<button class="text-marca-700">Portada</button>
							</form>
						{:else}<span></span>{/if}
						<form method="POST" action="?/borrarFoto" use:enhance>
							<input type="hidden" name="foto_id" value={f.id} />
							<button class="text-red-700">Quitar</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>

		{#if a.fotos.length < MAX_FOTOS}
			<label
				class="block cursor-pointer rounded-2xl border-2 border-dashed border-marca-200 bg-marca-50/50 p-6 text-center text-sm font-semibold text-marca-800 text-slate-600 hover:bg-slate-50"
			>
				{subiendo || '+ Agregar fotos'}
				<input
					type="file"
					accept="image/*"
					multiple
					class="sr-only"
					disabled={!!subiendo}
					onchange={subir}
				/>
			</label>
		{/if}
		{#if errorFotos}<p class="text-sm text-red-700">{errorFotos}</p>{/if}
	</div>

	{#if form?.mensaje}
		<p class="aviso-error">{form.mensaje}</p>
	{/if}

	{#if !data.tieneWhatsapp}
		<p class="aviso-alerta">
			No cargaste tu WhatsApp. <a href={resolve('/cuenta')} class="underline">
				Cargalo en Mi cuenta
			</a> o desactivá ese contacto al editar el aviso.
		</p>
	{/if}

	<div class="flex flex-wrap gap-2">
		{#if a.estado === 'borrador' || a.estado === 'pausado'}
			<form method="POST" action="?/publicar" use:enhance>
				<button class="{boton} btn-primario">Publicar</button>
			</form>
		{/if}
		{#if a.estado === 'publicado'}
			<form method="POST" action="?/renovar" use:enhance>
				<button class="{boton} btn-primario">Renovar 30 días</button>
			</form>
			<form method="POST" action="?/pausar" use:enhance>
				<button class="{boton} btn-secundario">Pausar</button>
			</form>
			<form method="POST" action="?/alquilado" use:enhance>
				<button class="{boton} btn-secundario">Ya se alquiló</button>
			</form>
		{/if}
		{#if a.estado !== 'oculto' && a.estado !== 'rechazado'}
			<a href={resolve('/mis-avisos/[id]/editar', { id: a.id })} class="{boton} btn-secundario">
				Editar datos
			</a>
		{/if}
	</div>

	<form
		method="POST"
		action="?/borrar"
		use:enhance={({ cancel }) => {
			if (!confirm('¿Borrar este aviso y sus fotos? No se puede deshacer.')) cancel();
		}}
	>
		<button class="text-sm text-red-700 underline">Borrar aviso</button>
	</form>
</section>
