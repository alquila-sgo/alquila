<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { ESTADOS } from '#lib/avisos.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Aviso que se está por eliminar: abre la ventana de confirmación propia.
	let aBorrar = $state<{ id: string; titulo: string } | null>(null);
	let borrando = $state(false);

	const boton = 'flex items-center justify-center gap-2 py-3 font-semibold transition';
	const color: Record<string, string> = {
		publicado: 'bg-marca-50 text-marca-700',
		borrador: 'bg-slate-100 text-slate-600',
		pausado: 'bg-amber-50 text-amber-700'
	};
</script>

<svelte:head><title>Mis avisos · Alquilá Sgo</title></svelte:head>

{#if aBorrar}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="titulo-borrar"
	>
		<form
			method="POST"
			action="?/borrar"
			class="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 text-center shadow-xl"
			use:enhance={() => {
				borrando = true;
				return async ({ update }) => {
					await update();
					borrando = false;
					aBorrar = null;
				};
			}}
		>
			<div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
				<svg
					viewBox="0 0 24 24"
					class="h-7 w-7"
					fill="none"
					stroke="currentColor"
					stroke-width="1.9"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
				</svg>
			</div>
			<div class="space-y-1">
				<h2 id="titulo-borrar" class="text-xl font-extrabold">¿Estás seguro?</h2>
				<p class="text-slate-600">No hay vuelta atrás.</p>
				<p class="line-clamp-2 text-sm font-semibold text-slate-500">"{aBorrar.titulo}"</p>
			</div>
			<input type="hidden" name="id" value={aBorrar.id} />
			<div class="grid grid-cols-2 gap-3">
				<button
					type="button"
					class="btn btn-secundario py-3"
					disabled={borrando}
					onclick={() => (aBorrar = null)}
				>
					Cancelar
				</button>
				<button class="btn bg-red-600 py-3 text-white hover:bg-red-700" disabled={borrando}>
					{borrando ? 'Eliminando…' : 'Eliminar'}
				</button>
			</div>
		</form>
	</div>
{/if}

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
			<li class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
				<!-- Tocar la tarjeta lleva directo a editar. -->
				<a
					href={resolve('/mis-avisos/[id]/editar', { id: a.id })}
					class="block p-3 transition hover:bg-slate-50"
				>
					<div class="flex gap-3">
						{#if a.portada}
							<img
								src="/fotos/{a.portada}"
								alt=""
								class="h-24 w-24 shrink-0 rounded-xl object-cover"
								loading="lazy"
							/>
						{:else}
							<div
								class="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs text-slate-500"
							>
								Sin fotos
							</div>
						{/if}
						<div class="min-w-0 flex-1 space-y-1">
							<p class="line-clamp-2 leading-snug font-semibold">{a.titulo}</p>
							<span
								class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold {a.vencido
									? 'bg-red-50 text-red-700'
									: (color[a.estado] ?? 'bg-slate-100 text-slate-600')}"
							>
								{a.vencido ? 'Vencido' : (ESTADOS[a.estado] ?? a.estado)}
							</span>
						</div>
					</div>
					<span
						class="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold text-marca-700"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" />
						</svg>
						Editar
					</span>
				</a>
				<div class="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 text-sm">
					<div>
						<button
							type="button"
							class="{boton} w-full bg-red-50 text-red-700 hover:bg-red-100"
							onclick={() => (aBorrar = { id: a.id, titulo: a.titulo })}
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
							Eliminar
						</button>
					</div>
					<a
						href={resolve('/aviso/[id]', { id: a.id })}
						class="{boton} text-marca-700 hover:bg-marca-50"
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
						Vista previa
					</a>
				</div>
			</li>
		{/each}
	</ul>
</section>
