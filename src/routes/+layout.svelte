<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	const enInicio = $derived(page.url.pathname === '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Alquilá Sgo · Alquileres en Santiago del Estero</title>
	<meta
		name="description"
		content="Encontrá y publicá alquileres en Santiago del Estero. Gratis, directo con el dueño y con la ubicación en el mapa."
	/>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header class="sticky top-0 z-20 border-b border-slate-200/70 bg-crema/85 backdrop-blur-md">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
			<a href={resolve('/')} class="flex items-center gap-2" aria-label="Alquilá Sgo, inicio">
				<img src={favicon} alt="" class="h-9 w-9" />
				<span class="text-lg font-extrabold tracking-tight text-marca-800">
					Alquilá<span class="text-sol-500">Sgo</span>
				</span>
			</a>
			<nav class="flex items-center gap-1 text-sm font-semibold text-slate-700 sm:gap-2">
				{#if data.usuario}
					<a href={resolve('/mis-avisos')} class="rounded-lg px-2.5 py-2 hover:bg-white">
						Mis avisos
					</a>
					<a href={resolve('/cuenta')} class="rounded-lg px-2.5 py-2 hover:bg-white">Mi cuenta</a>
				{:else}
					<a href={resolve('/ingresar')} class="rounded-lg px-2.5 py-2 hover:bg-white">Ingresar</a>
					<a href={resolve('/publicar')} class="btn btn-acento btn-chico hidden sm:inline-flex">
						Publicar gratis
					</a>
				{/if}
			</nav>
		</div>
	</header>

	<main class={['flex-1', !enInicio && 'mx-auto w-full max-w-3xl px-4 py-8']}>
		{@render children()}
	</main>

	<footer class="mt-16 bg-marca-900 text-marca-100">
		<div class="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-2">
			<div class="space-y-2">
				<p class="text-lg font-extrabold text-white">
					Alquilá<span class="text-sol-400">Sgo</span>
				</p>
				<p class="max-w-xs text-sm text-marca-200">
					Alquileres en toda la provincia de Santiago del Estero, directo con dueños e
					inmobiliarias.
				</p>
			</div>
			<nav class="flex flex-col gap-2 text-sm sm:items-end">
				<a href={resolve('/publicar')} class="hover:text-white">Publicar un aviso</a>
				<a href={resolve('/mis-avisos')} class="hover:text-white">Mis avisos</a>
				<a href={resolve('/cuenta')} class="hover:text-white">Mi cuenta</a>
			</nav>
		</div>
		<p class="border-t border-white/10 py-4 text-center text-xs text-marca-200">
			Hecho en Santiago del Estero · © {new Date().getFullYear()} Alquilá Sgo
		</p>
	</footer>
</div>
