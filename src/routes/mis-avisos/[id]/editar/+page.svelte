<script lang="ts">
	import { resolve } from '$app/paths';
	import AvisoFormulario from '#lib/componentes/AvisoFormulario.svelte';
	import AvisoVista from '#lib/componentes/AvisoVista.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Cada lápiz abre el paso del asistente que corresponde a esa parte.
	const PASO: Record<string, number> = {
		tipo: 0,
		localidad: 1,
		mapa: 2,
		privacidad: 3,
		ambientes: 4,
		servicios: 5,
		precio: 6,
		expensas: 7,
		requisitos: 8,
		titulo: 9,
		contacto: 10
	};
	const editarHref = $derived(resolve('/mis-avisos/[id]/editar', { id: data.id }));
	function lapiz(parte: string) {
		if (parte === 'fotos') return `${resolve('/mis-avisos/[id]', { id: data.id })}?fotos=1`;
		return `${editarHref}?paso=${PASO[parte]}`;
	}
</script>

<svelte:head><title>Editar aviso · Alquilá Sgo</title></svelte:head>

{#if data.paso !== null || form}
	{#key data.paso}
		<AvisoFormulario
			inicial={form?.valores ?? data.inicial}
			errores={form?.errores ?? {}}
			mensaje={form?.mensaje ?? ''}
			localidades={data.localidades}
			textoBoton="Guardar"
			cerrarHref={editarHref}
			soloPaso={data.paso ?? 0}
		/>
	{/key}
{:else}
	<section class="space-y-5 pb-10">
		<div class="flex items-center justify-between gap-3">
			<h1 class="titulo-pagina">Editar aviso</h1>
			<a href={resolve('/mis-avisos')} class="btn btn-acento btn-chico">Listo</a>
		</div>
		<p class="aviso-ok">Tocá el lápiz de lo que quieras cambiar.</p>
		<AvisoVista aviso={data.aviso} {lapiz} />
	</section>
{/if}
