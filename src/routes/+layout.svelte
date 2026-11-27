<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Alquilá Sgo · Alquileres en Santiago del Estero</title>
	<meta name="description" content="Buscá y publicá alquileres en Santiago del Estero." />
</svelte:head>

<div class="min-h-dvh bg-white text-slate-900">
	<header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
			<a href={resolve('/')} class="flex items-center gap-2 font-bold text-teal-700">
				<img src={favicon} alt="" class="h-8 w-8" />
				Alquilá Sgo
			</a>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-6">
		{@render children()}
	</main>
</div>
