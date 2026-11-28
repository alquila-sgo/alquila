<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let enviando = $state(false);
	let ver = $state(false);
</script>

<svelte:head><title>Creá tu contraseña · Alquilá Sgo</title></svelte:head>

<section class="tarjeta mx-auto max-w-sm space-y-6">
	<div class="space-y-1 text-center">
		<h1 class="titulo-pagina">Creá tu contraseña</h1>
		{#if data.email}<p class="text-sm text-slate-600">{data.email}</p>{/if}
	</div>

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
		<input type="hidden" name="token_hash" value={data.tokenHash} />
		<input type="hidden" name="tipo" value={data.tipo} />
		{#if data.email}
			<!-- Para que el celular la guarde junto al email. -->
			<input type="email" name="usuario" value={data.email} autocomplete="username" hidden />
		{/if}
		<label class="block space-y-1">
			<span class="etiqueta">Contraseña</span>
			<input
				type={ver ? 'text' : 'password'}
				name="clave"
				required
				minlength="8"
				maxlength="72"
				autocomplete="new-password"
				class="campo py-3 text-lg"
			/>
			<span class="block text-xs text-slate-500">Al menos 8 caracteres.</span>
		</label>
		<label class="block space-y-1">
			<span class="etiqueta">Repetila</span>
			<input
				type={ver ? 'text' : 'password'}
				name="repetida"
				required
				minlength="8"
				maxlength="72"
				autocomplete="new-password"
				class="campo py-3 text-lg"
			/>
		</label>
		<label class="flex items-center gap-2 text-sm text-slate-600">
			<input type="checkbox" bind:checked={ver} /> Mostrar contraseña
		</label>
		{#if form?.mensaje}
			<p class="aviso-error" role="alert">
				{form.mensaje}
				{#if form && 'vencido' in form}
					<a href={resolve('/ingresar')} class="font-semibold underline">Ir a Ingresar</a>
				{/if}
			</p>
		{/if}
		<button class="btn btn-acento w-full py-4 text-lg" disabled={enviando}>
			{enviando ? 'Guardando…' : 'Continuar'}
		</button>
	</form>
</section>
