<script lang="ts">
	import { enhance } from '$app/forms';
	import { mostrarWhatsapp } from '#lib/whatsapp.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let tipo = $derived(data.perfil.tipo);
	let guardando = $state(false);
</script>

<svelte:head><title>Mi cuenta · Alquilá Sgo</title></svelte:head>

<section class="tarjeta mx-auto max-w-md space-y-6">
	<div class="space-y-1">
		<h1 class="titulo-pagina">Mi cuenta</h1>
		<p class="text-sm text-slate-600">{data.usuario?.email}</p>
		{#if data.perfil.verificado}
			<p class="inline-block rounded bg-marca-100 px-2 py-0.5 text-xs font-medium text-marca-800">
				Verificado
			</p>
		{/if}
	</div>

	<form
		method="POST"
		class="space-y-4"
		use:enhance={() => {
			guardando = true;
			return async ({ update }) => {
				await update({ reset: false });
				guardando = false;
			};
		}}
	>
		<label class="block space-y-1">
			<span class="etiqueta">Nombre</span>
			<input
				name="nombre"
				required
				maxlength="80"
				autocomplete="name"
				value={data.perfil.nombre}
				class="campo"
			/>
			{#if form?.errores?.nombre}<span class="text-sm text-red-700">
					{form.errores.nombre}
				</span>{/if}
		</label>

		<label class="block space-y-1">
			<span class="etiqueta">WhatsApp</span>
			<input
				name="whatsapp"
				inputmode="tel"
				autocomplete="tel-national"
				placeholder="385 4123456"
				value={mostrarWhatsapp(data.perfil.whatsapp)}
				class="campo"
			/>
			<span class="block text-xs text-slate-500">
				Código de área sin 0 y número sin 15. Solo lo ven personas con cuenta que consultan tu
				aviso.
			</span>
			{#if form?.errores?.whatsapp}<span class="text-sm text-red-700">
					{form.errores.whatsapp}
				</span>{/if}
		</label>

		<fieldset class="tarjeta space-y-2">
			<legend class="etiqueta">Publico como</legend>
			<label class="flex items-center gap-2">
				<input type="radio" name="tipo" value="particular" bind:group={tipo} /> Particular (dueño)
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" name="tipo" value="inmobiliaria" bind:group={tipo} /> Inmobiliaria
			</label>
		</fieldset>

		{#if tipo === 'inmobiliaria'}
			<label class="block space-y-1">
				<span class="etiqueta">Nombre de la inmobiliaria</span>
				<input
					name="nombre_comercial"
					maxlength="100"
					value={data.perfil.nombre_comercial ?? ''}
					class="campo"
				/>
				{#if form?.errores?.nombre_comercial}<span class="text-sm text-red-700">
						{form.errores.nombre_comercial}
					</span>{/if}
			</label>
			<label class="block space-y-1">
				<span class="etiqueta">Matrícula del corredor (opcional)</span>
				<input name="matricula" maxlength="50" value={data.perfil.matricula ?? ''} class="campo" />
			</label>
		{/if}

		<button disabled={guardando} class="btn btn-primario w-full">
			{guardando ? 'Guardando…' : 'Guardar'}
		</button>
		{#if form?.guardado}<p class="text-sm text-marca-800">Listo, guardado.</p>{/if}
		{#if form?.mensaje}<p class="text-sm text-red-700">{form.mensaje}</p>{/if}
	</form>

	<form method="POST" action="/salir">
		<button class="text-sm text-slate-600 underline">Salir</button>
	</form>
</section>
