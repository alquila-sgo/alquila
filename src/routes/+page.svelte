<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<section class="space-y-4">
	<h1 class="text-2xl font-bold">Alquileres en Santiago del Estero</h1>
	<p class="text-slate-600">
		Departamentos, casas y habitaciones en alquiler, publicados por dueños e inmobiliarias.
	</p>
	<a
		href={resolve('/publicar')}
		class="inline-block rounded-lg bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800"
	>
		Publicar un aviso gratis
	</a>
	<p class="rounded-lg bg-teal-50 p-4 text-sm text-teal-900">
		Estamos construyendo la app. Muy pronto vas a poder buscar avisos acá.
	</p>
</section>
