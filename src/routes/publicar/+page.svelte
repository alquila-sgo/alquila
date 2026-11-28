<script lang="ts">
	import AvisoFormulario from '#lib/componentes/AvisoFormulario.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Publicar aviso · Alquilá Sgo</title></svelte:head>

<section class="space-y-6">
	<div class="space-y-1">
		<h1 class="titulo-pagina">Publicar un aviso</h1>
		<p class="text-sm text-slate-600">Paso 1 de 2: los datos. Después cargás las fotos.</p>
	</div>
	<AvisoFormulario
		inicial={form?.valores ?? data.inicial}
		errores={form?.errores ?? {}}
		mensaje={form?.mensaje ?? ''}
		localidades={data.localidades}
		textoBoton="Guardar y seguir con las fotos"
	/>
</section>
