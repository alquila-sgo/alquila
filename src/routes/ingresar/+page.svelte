<script lang="ts">
	import { enhance } from '$app/forms';
	import favicon from '#lib/assets/favicon.svg';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let enviando = $state(false);
</script>

<svelte:head><title>Ingresar · Alquilá Sgo</title></svelte:head>

<section class="tarjeta mx-auto max-w-sm space-y-6">
	<div class="space-y-2 text-center">
		<img src={favicon} alt="" class="mx-auto h-12 w-12" />
		<h1 class="titulo-pagina">¡Hola! Ingresá</h1>
		<p class="text-slate-600">Para publicar, guardar favoritos y contactar anunciantes.</p>
	</div>

	{#if data.error === 'enlace'}
		<p class="aviso-error">El enlace venció o ya se usó. Pedí uno nuevo.</p>
	{/if}

	{#if form?.enviado}
		<p class="aviso-ok">
			Te mandamos un enlace a <strong>{form.enviado}</strong>. Abrilo desde este mismo celular para
			entrar.
		</p>
	{:else}
		<form method="POST" action="?/google">
			<input type="hidden" name="next" value={data.next} />
			<button class="btn btn-secundario flex w-full items-center justify-center gap-3">
				<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5">
					<path
						fill="#4285F4"
						d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8"
					/><path
						fill="#34A853"
						d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24"
					/><path
						fill="#FBBC05"
						d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z"
					/><path
						fill="#EA4335"
						d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8"
					/>
				</svg>
				Continuar con Google
			</button>
		</form>

		<div class="flex items-center gap-3 text-sm text-slate-500">
			<span class="h-px flex-1 bg-slate-200"></span>o con tu email<span
				class="h-px flex-1 bg-slate-200"
			></span>
		</div>

		<form
			method="POST"
			action="?/email"
			class="space-y-3"
			use:enhance={() => {
				enviando = true;
				return async ({ update }) => {
					await update();
					enviando = false;
				};
			}}
		>
			<input type="hidden" name="next" value={data.next} />
			<label class="block space-y-1">
				<span class="etiqueta">Email</span>
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					value={form?.email ?? ''}
					class="campo"
				/>
			</label>
			<button disabled={enviando} class="btn btn-primario w-full">
				{enviando ? 'Enviando…' : 'Enviarme un enlace para entrar'}
			</button>
		</form>
	{/if}

	{#if form?.mensaje}
		<p class="aviso-error">{form.mensaje}</p>
	{/if}
</section>
