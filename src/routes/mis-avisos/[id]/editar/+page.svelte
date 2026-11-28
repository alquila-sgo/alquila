<script lang="ts">
	import { resolve } from '$app/paths';
	import AvisoFormulario from '#lib/componentes/AvisoFormulario.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Editar aviso · Alquilá Sgo</title></svelte:head>

<AvisoFormulario
	inicial={form?.valores ?? data.inicial}
	errores={form?.errores ?? {}}
	mensaje={form?.mensaje ?? ''}
	localidades={data.localidades}
	textoBoton="Guardar cambios"
	cerrarHref={resolve('/mis-avisos/[id]', { id: data.id })}
/>
