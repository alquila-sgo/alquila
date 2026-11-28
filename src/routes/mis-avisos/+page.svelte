<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { ESTADOS } from '#lib/avisos.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const icono =
		'grid h-10 w-10 place-items-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50';
	const color: Record<string, string> = {
		publicado: 'bg-marca-50 text-marca-700',
		borrador: 'bg-slate-100 text-slate-600',
		pausado: 'bg-amber-50 text-amber-700'
	};
</script>

<svelte:head><title>Mis avisos · Alquilá Sgo</title></svelte:head>

<section class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="titulo-pagina">Mis avisos</h1>
		<a href={resolve('/publicar')} class="btn btn-acento btn-chico"> + Publicar </a>
	</div>

	{#if form?.mensaje}
		<p class="aviso-error" role="alert">{form.mensaje}</p>
	{/if}

	{#if data.avisos.length === 0}
		<div class="tarjeta space-y-3 py-10 text-center">
			<p class="text-lg font-bold">Todavía no publicaste nada</p>
			<a href={resolve('/publicar')} class="btn btn-acento">Publicar mi primer aviso</a>
		</div>
	{/if}

	<ul class="space-y-3">
		{#each data.avisos as a (a.id)}
			<li class="tarjeta flex gap-3 p-3!">
				<a href={resolve('/mis-avisos/[id]', { id: a.id })} class="shrink-0">
					{#if a.portada}
						<img
							src="/fotos/{a.portada}"
							alt=""
							class="h-24 w-24 rounded-xl object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="grid h-24 w-24 place-items-center rounded-xl bg-slate-100 text-xs text-slate-500"
						>
							Sin fotos
						</div>
					{/if}
				</a>
				<div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
					<a href={resolve('/mis-avisos/[id]', { id: a.id })} class="space-y-1">
						<p class="line-clamp-2 leading-snug font-semibold">{a.titulo}</p>
						<span
							class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold {a.vencido
								? 'bg-red-50 text-red-700'
								: (color[a.estado] ?? 'bg-slate-100 text-slate-600')}"
						>
							{a.vencido ? 'Vencido' : (ESTADOS[a.estado] ?? a.estado)}
						</span>
					</a>
					<div class="flex justify-end gap-2">
						<a
							href={resolve('/mis-avisos/[id]/editar', { id: a.id })}
							class={icono}
							aria-label="Editar"
							title="Editar"
						>
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.9"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" />
							</svg>
						</a>
						<form
							method="POST"
							action="?/borrar"
							use:enhance={({ cancel }) => {
								if (!confirm(`¿Eliminar "${a.titulo}"? No se puede deshacer.`)) cancel();
							}}
						>
							<input type="hidden" name="id" value={a.id} />
							<button
								class="{icono} text-red-600 hover:bg-red-50"
								aria-label="Eliminar"
								title="Eliminar"
							>
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									stroke-width="1.9"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path
										d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
									/>
								</svg>
							</button>
						</form>
						<a
							href={resolve('/aviso/[id]', { id: a.id })}
							class={icono}
							aria-label="Ver como lo ven los demás"
							title="Ver como lo ven los demás"
						>
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.9"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle
									cx="12"
									cy="12"
									r="3"
								/>
							</svg>
						</a>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</section>
