<script lang="ts">
	import { resolve } from '$app/paths';
	import AvisoFormulario from '#lib/componentes/AvisoFormulario.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Editar aviso · Alquilá Sgo</title></svelte:head>

<section class="space-y-6">
	<a href={resolve('/mis-avisos/[id]', { id: data.id })} class="text-sm text-marca-700">← Volver</a>
	<h1 class="titulo-pagina">Editar aviso</h1>
	<AvisoFormulario
		inicial={form?.valores ?? data.inicial}
		errores={form?.errores ?? {}}
		mensaje={form?.mensaje ?? ''}
		localidades={data.localidades}
		textoBoton="Guardar cambios"
	/>
</section>
