<script lang="ts">
	import { resolve } from '$app/paths';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import AvisoVista from '#lib/componentes/AvisoVista.svelte';
	import VisorFotos from '#lib/componentes/VisorFotos.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const a = $derived(data.aviso);
	// El visor abierto vive en el historial: el botón Atrás lo cierra y queda en el aviso.
	const visor = $derived(page.state.visor ?? null);
</script>

<svelte:head><title>{a.titulo} · Alquilá Sgo</title></svelte:head>

{#if visor !== null}
	<VisorFotos
		fotos={a.fotos.map((f) => `/fotos/${f.clave}`)}
		inicio={visor}
		oncerrar={() => history.back()}
	/>
{/if}

<article class="space-y-5 pb-24">
	{#if data.esMio}
		<div class="aviso-ok flex items-center justify-between gap-3">
			<span>
				{data.visible
					? 'Así ven tu aviso las demás personas.'
					: 'Vista previa: este aviso todavía no lo ve nadie más.'}
			</span>
			<a href={resolve('/mis-avisos')} class="shrink-0 font-semibold underline">Mis avisos</a>
		</div>
	{/if}

	<AvisoVista aviso={a} onfoto={(i: number) => pushState('', { visor: i })} />
</article>

{#if a.contacto_whatsapp}
	<div
		class="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur"
	>
		<div class="mx-auto max-w-3xl space-y-2">
			{#if form?.mensaje}<p class="aviso-error">{form.mensaje}</p>{/if}
			<form method="POST" action="?/whatsapp">
				<button class="btn w-full bg-[#25D366] py-3.5 text-lg text-white hover:bg-[#1ebe5b]">
					<svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor" aria-hidden="true">
						<path
							d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.2.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.2Z"
						/>
					</svg>
					Escribir por WhatsApp
				</button>
			</form>
		</div>
	</div>
{/if}
