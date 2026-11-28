<script lang="ts">
	import { enhance } from '$app/forms';
	import FotoPerfil from '#lib/componentes/FotoPerfil.svelte';
	import { mostrarWhatsapp } from '#lib/whatsapp.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let enviando = $state(false);
	const inicial = $derived((data.nombre || data.usuario?.email || '?').charAt(0));
</script>

<svelte:head><title>Tus datos · Alquilá Sgo</title></svelte:head>

<section class="mx-auto max-w-sm space-y-6">
	<div class="space-y-1 text-center">
		<h1 class="titulo-pagina">¡Hola! Contanos quién sos</h1>
		<p class="text-slate-600">Solo el nombre es obligatorio.</p>
	</div>

	<FotoPerfil foto={data.usuario?.foto ?? null} {inicial} />

	<form
		method="POST"
		class="space-y-4"
		use:enhance={() => {
			enviando = true;
			return async ({ update }) => {
				await update({ reset: false });
				enviando = false;
			};
		}}
	>
		<input type="hidden" name="next" value={data.next} />
		<label class="block space-y-1">
			<span class="etiqueta">Nombre</span>
			<input
				name="nombre"
				required
				maxlength="80"
				autocomplete="name"
				value={form?.nombre ?? data.nombre}
				class="campo py-3 text-lg"
			/>
			{#if form?.errores?.nombre}<span class="text-sm text-red-700">
					{form.errores.nombre}
				</span>{/if}
		</label>
		<label class="block space-y-1">
			<span class="etiqueta">
				WhatsApp <span class="font-normal text-slate-500">(opcional)</span>
			</span>
			<input
				name="whatsapp"
				inputmode="tel"
				autocomplete="tel-national"
				placeholder="385 4123456"
				value={form?.whatsappTexto ?? mostrarWhatsapp(data.whatsapp)}
				class="campo py-3 text-lg"
			/>
			<span class="block text-xs text-slate-500">Código de área sin 0 y número sin 15.</span>
			{#if form?.errores?.whatsapp}<span class="text-sm text-red-700">
					{form.errores.whatsapp}
				</span>{/if}
		</label>
		{#if form?.mensaje}<p class="aviso-error">{form.mensaje}</p>{/if}
		<button class="btn btn-acento w-full py-4 text-lg" disabled={enviando}>
			{enviando ? 'Guardando…' : 'Continuar'}
		</button>
	</form>
</section>
