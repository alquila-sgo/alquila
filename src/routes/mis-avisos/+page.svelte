<script lang="ts">
	import { resolve } from '$app/paths';
	import { ESTADOS } from '#lib/avisos.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Mis avisos · Alquilá Sgo</title></svelte:head>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="titulo-pagina">Mis avisos</h1>
		<a href={resolve('/publicar')} class="btn btn-acento btn-chico"> + Publicar </a>
	</div>

	{#if data.avisos.length === 0}
		<div class="tarjeta space-y-3 py-10 text-center">
			<p class="text-lg font-bold">Todavía no publicaste nada</p>
			<p class="text-slate-600">Publicar es gratis y lo hacés en pocos minutos.</p>
			<a href={resolve('/publicar')} class="btn btn-acento">Publicar mi primer aviso</a>
		</div>
	{/if}

	<ul class="space-y-3">
		{#each data.avisos as a (a.id)}
			<li>
				<a
					href={resolve('/mis-avisos/[id]', { id: a.id })}
					class="tarjeta flex gap-3 p-3! transition hover:shadow-md"
				>
					{#if a.portada}
						<img
							src="/fotos/{a.portada}"
							alt=""
							class="h-20 w-24 shrink-0 rounded-xl object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs text-slate-500"
						>
							Sin fotos
						</div>
					{/if}
					<div class="min-w-0 space-y-1">
						<p class="truncate font-medium">{a.titulo}</p>
						<p class="text-sm text-slate-600">
							{a.vencido ? 'Vencido' : (ESTADOS[a.estado] ?? a.estado)}
						</p>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>
