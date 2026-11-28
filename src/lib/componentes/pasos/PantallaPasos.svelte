<script lang="ts">
	import type { Snippet } from 'svelte';

	// Marco a pantalla completa para un asistente por pasos: no se desliza.
	let {
		paso,
		total,
		titulo,
		ayuda = '',
		cerrarHref,
		onatras,
		sinProgreso = false,
		pie,
		children
	}: {
		paso: number;
		total: number;
		titulo: string;
		ayuda?: string;
		cerrarHref: string;
		onatras?: () => void;
		/** Sin barra ni "Paso X de Y" (por ejemplo, al editar una sola parte). */
		sinProgreso?: boolean;
		pie: Snippet;
		children: Snippet;
	} = $props();

	// Mientras está abierto, la página de atrás no se mueve.
	$effect(() => {
		const html = document.documentElement;
		const antes = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = antes;
		};
	});
</script>

<div class="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-crema">
	<header class="flex items-center gap-3 px-4 pt-4">
		<button
			type="button"
			class="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-white disabled:invisible"
			aria-label="Paso anterior"
			disabled={!onatras}
			onclick={() => onatras?.()}
		>
			<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.2">
				<path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
		<div
			class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 {sinProgreso ? 'invisible' : ''}"
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={total}
			aria-valuenow={paso}
			aria-label="Paso {paso} de {total}"
		>
			<div
				class="h-full rounded-full bg-sol-500 transition-all duration-300"
				style="width: {(paso / total) * 100}%"
			></div>
		</div>
		<!-- cerrarHref ya viene armado con resolve() desde la página -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={cerrarHref}
			class="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-white"
			aria-label="Salir"
		>
			<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.2">
				<path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
			</svg>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</header>

	<div class="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pt-4">
		{#if !sinProgreso}
			<p class="text-xs font-bold tracking-wider text-sol-600 uppercase">Paso {paso} de {total}</p>
		{/if}
		<h1 class="mt-1 text-2xl leading-tight font-extrabold">{titulo}</h1>
		{#if ayuda}<p class="mt-1 text-sm text-slate-600">{ayuda}</p>{/if}
		<div class="mt-5 flex min-h-0 flex-1 flex-col">
			{@render children()}
		</div>
	</div>

	<footer class="mx-auto w-full max-w-lg px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
		{@render pie()}
	</footer>
</div>
