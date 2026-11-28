<script lang="ts">
	import { GARANTIAS, SERVICIOS, TIPOS_PROPIEDAD, type AvisoPublico } from '#lib/avisos.js';
	import MapaPin from '#lib/componentes/MapaPin.svelte';

	// El aviso tal como lo ven los demás. Con `lapiz`, cada parte suma un lápiz para editarla.
	let {
		aviso: a,
		onfoto,
		lapiz
	}: {
		aviso: AvisoPublico;
		onfoto?: (i: number) => void;
		/** Devuelve el enlace (ya resuelto) para editar esa parte. */
		lapiz?: (parte: Parte) => string;
	} = $props();

	type Parte =
		| 'fotos'
		| 'tipo'
		| 'localidad'
		| 'mapa'
		| 'privacidad'
		| 'ambientes'
		| 'servicios'
		| 'precio'
		| 'expensas'
		| 'requisitos'
		| 'titulo'
		| 'contacto';

	const etiqueta = (lista: readonly (readonly [string, string])[], v: string | null) =>
		lista.find(([k]) => k === v)?.[1] ?? '';
	const plata = (n: number, moneda: string | null) =>
		`${moneda === 'USD' ? 'US$' : '$'} ${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

	// "B° Centro"; si ya lo escribió con B°, Bº, Bo. o "Barrio", no se repite.
	const barrio = (b: string | null) => {
		const t = (b ?? '').trim();
		if (!t) return '';
		return `B° ${t.replace(/^(b[°º]\s*|bo\.\s*|bo\s+|barrio\s+)/i, '')}`;
	};
	const lugar = $derived(
		[barrio(a.barrio), a.localidades?.nombre ?? a.localidad_otra].filter(Boolean).join(', ')
	);
	const tipo = $derived(
		a.tipo_propiedad === 'duplex'
			? 'Dúplex'
			: a.tipo_propiedad === 'otro' && a.tipo_otro
				? a.tipo_otro
				: etiqueta(TIPOS_PROPIEDAD, a.tipo_propiedad)
	);
	// Cuadro destacado: número grande + nombre.
	const ambientes = $derived(
		[
			{ n: a.dormitorios, uno: 'Dormitorio', varios: 'Dormitorios' },
			{ n: a.banos, uno: 'Baño', varios: 'Baños' },
			{ n: a.cocina, uno: 'Cocina', varios: 'Cocinas' },
			{ n: a.cocina_comedor, uno: 'Cocina-comedor', varios: 'Cocinas-comedor' },
			{ n: a.comedor, uno: 'Comedor', varios: 'Comedores' }
		]
			.filter((x): x is { n: number; uno: string; varios: string } => !!x.n)
			.map((x) => ({ n: String(x.n), texto: x.n === 1 ? x.uno : x.varios }))
	);
	const servicios = $derived(
		SERVICIOS.filter(([k]) => a[k as keyof typeof a] === true).map(([, t]) => t)
	);
	const garantias = $derived(a.garantias.map((g) => etiqueta(GARANTIAS, g)).filter(Boolean));
	const editando = $derived(!!lapiz);
	// Primer ítem de Servicios.
	const textoAmoblado = $derived(
		a.amueblado === 'si'
			? 'Amoblado'
			: a.amueblado === 'parcial'
				? 'Amoblado parcial'
				: a.amueblado === 'no'
					? 'Sin amoblar'
					: ''
	);
	const itemsServicios = $derived(
		[textoAmoblado, ...servicios, a.otros_servicios ?? ''].filter(Boolean)
	);
	// Lo que piden para entrar: garantías, depósito y otros requisitos escritos.
	const itemsRequisitos = $derived(
		[
			...garantias,
			a.meses_deposito
				? `Depósito: ${a.meses_deposito} mes${a.meses_deposito === 1 ? '' : 'es'}`
				: '',
			a.requisitos ?? ''
		].filter(Boolean)
	);

	let foto = $state(0);
	function alDeslizar(ev: Event) {
		const el = ev.currentTarget as HTMLElement;
		foto = Math.round(el.scrollLeft / el.clientWidth);
	}

	const claseLapiz =
		'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-marca-700 shadow ring-1 ring-slate-200 transition hover:bg-marca-50';
</script>

<!-- Los enlaces de los lápices ya vienen armados con resolve() desde la página. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet lapizDe(parte: Parte, texto: string, clase = '')}
	{#if lapiz}
		<a href={lapiz(parte)} class="{claseLapiz} {clase}" aria-label="Editar {texto}" title="Editar">
			<svg
				viewBox="0 0 24 24"
				class="h-4.5 w-4.5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" />
			</svg>
		</a>
	{/if}
{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<div class="space-y-5">
	<div class="flex items-start justify-between gap-3">
		<h1 class="text-2xl leading-snug font-bold">{a.titulo}</h1>
		{@render lapizDe('titulo', 'el título')}
	</div>
	{#if a.fotos.length}
		<div class="relative -mx-4 sm:mx-0">
			<div
				class="flex snap-x snap-mandatory overflow-x-auto sm:rounded-3xl"
				style="scrollbar-width: none"
				onscroll={alDeslizar}
			>
				{#each a.fotos as f, i (f.id)}
					<!-- Foto entera dentro del marco; el fondo es la misma foto desenfocada. -->
					<button
						type="button"
						class="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden bg-slate-900"
						aria-label="Ver foto {i + 1} en pantalla completa"
						onclick={() => onfoto?.(i)}
					>
						<img
							src="/fotos/{f.clave}"
							alt=""
							aria-hidden="true"
							class="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
							loading={i === 0 ? 'eager' : 'lazy'}
						/>
						<img
							src="/fotos/{f.clave}"
							alt="Foto {i + 1} de {a.fotos.length}"
							class="relative h-full w-full object-contain"
							loading={i === 0 ? 'eager' : 'lazy'}
						/>
					</button>
				{/each}
			</div>
			<span
				class="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
			>
				{foto + 1} / {a.fotos.length}
			</span>
			{@render lapizDe('fotos', 'las fotos', 'absolute top-3 right-3')}
		</div>
	{:else if editando}
		<div class="flex items-center justify-between rounded-3xl bg-slate-100 p-5 text-slate-600">
			Sin fotos
			{@render lapizDe('fotos', 'las fotos')}
		</div>
	{/if}

	<header class="space-y-2">
		<div class="flex items-start justify-between gap-3">
			<p class="text-3xl font-extrabold text-marca-800">
				{a.consultar_precio || a.precio == null ? 'Consultar precio' : plata(a.precio, a.moneda)}
				{#if !a.consultar_precio}<span class="text-base font-semibold text-slate-500">
						/ mes
					</span>{/if}
			</p>
			{@render lapizDe('precio', 'el precio')}
		</div>
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm text-slate-600">
				{#if a.sin_expensas}Sin expensas{:else if a.expensas}+ {plata(a.expensas, 'ARS')} de expensas{/if}
			</p>
			{@render lapizDe('expensas', 'las expensas')}
		</div>
		{#if lugar}
			<div class="flex items-center justify-between gap-3">
				<p class="flex items-center gap-1 text-slate-600">
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4 text-sol-500"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4.5 0c0 7.1-7.5 11.3-7.5 11.3S4.5 17.6 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
						/>
					</svg>
					{lugar}
				</p>
				{@render lapizDe('localidad', 'la localidad')}
			</div>
		{/if}
	</header>

	<section class="rounded-3xl bg-marca-700 p-5 text-white shadow-lg shadow-marca-900/20">
		<div class="mb-3 flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<h2 class="text-lg font-bold">{tipo}</h2>
				{@render lapizDe('tipo', 'el tipo de propiedad')}
			</div>
			<div class="flex items-center gap-2">
				{#if a.superficie_m2}
					<span class="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
						{a.superficie_m2} m² aprox.
					</span>
				{/if}
				{@render lapizDe('ambientes', 'cocina, comedor, baños y dormitorios')}
			</div>
		</div>
		{#if ambientes.length}
			<ul class="grid grid-cols-3 gap-2 text-center">
				{#each ambientes as x (x.texto)}
					<li class="rounded-2xl bg-white/10 px-2 py-3">
						<span class="block text-4xl font-extrabold text-sol-400">{x.n}</span>
						<span class="block text-sm font-semibold">{x.texto}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if a.descripcion || editando}
		<div class="flex items-start justify-between gap-3">
			{#if a.descripcion}
				<p class="whitespace-pre-line text-slate-700">{a.descripcion}</p>
			{:else}
				<p class="text-sm text-slate-500 italic">Sin descripción.</p>
			{/if}
			{@render lapizDe('titulo', 'la descripción')}
		</div>
	{/if}

	<!-- Servicios y Condiciones: desplegables, cerrados por defecto (abiertos al editar). -->
	{#snippet titulo(texto: string, parte: Parte, nombre: string)}
		<summary
			class="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden"
		>
			<span class="flex items-center gap-2 text-lg font-bold">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5 text-marca-700 transition group-open:rotate-90"
					fill="none"
					stroke="currentColor"
					stroke-width="2.4"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m9 6 6 6-6 6" />
				</svg>
				{texto}
			</span>
			{@render lapizDe(parte, nombre)}
		</summary>
	{/snippet}

	{#if itemsServicios.length || editando}
		<details class="tarjeta group" open={editando}>
			{@render titulo('Servicios', 'servicios', 'los servicios')}
			<ul class="mt-3 space-y-1 text-sm">
				{#each itemsServicios as s (s)}
					<li>– {s}</li>
				{/each}
				{#if !itemsServicios.length}
					<li class="text-slate-500 italic">Ninguno marcado.</li>
				{/if}
			</ul>
		</details>
	{/if}

	{#if itemsRequisitos.length || editando}
		<details class="tarjeta group" open={editando}>
			{@render titulo('Requisitos', 'requisitos', 'los requisitos')}
			<ul class="mt-3 space-y-1 text-sm">
				{#each itemsRequisitos as r (r)}
					<li>– {r}</li>
				{/each}
				{#if !itemsRequisitos.length}
					<li class="text-slate-500 italic">Sin requisitos.</li>
				{/if}
			</ul>
		</details>
	{/if}

	{#if a.lat_publica != null && a.lng_publica != null}
		<section class="space-y-2">
			<div class="flex items-center justify-between gap-3">
				<h2 class="font-bold">Ubicación{a.ubicacion_exacta ? '' : ' aproximada'}</h2>
				<div class="flex gap-2">
					{@render lapizDe('mapa', 'el lugar en el mapa')}
				</div>
			</div>
			<div class="overflow-hidden rounded-2xl">
				<MapaPin
					lat={String(a.lat_publica)}
					lng={String(a.lng_publica)}
					editable={false}
					radioMetros={a.ubicacion_exacta ? 0 : 300}
					alto="h-60"
				/>
			</div>
			{#if editando}
				<div class="flex items-center justify-between gap-3 text-sm">
					<p>
						Se muestra: <strong>
							{a.ubicacion_exacta ? 'el lugar exacto' : 'una zona aproximada'}
						</strong>
					</p>
					{@render lapizDe('privacidad', 'qué se muestra del lugar')}
				</div>
			{/if}
		</section>
	{:else if editando}
		<section class="tarjeta flex items-center justify-between gap-3 text-sm">
			<p>Ubicación en el mapa</p>
			{@render lapizDe('mapa', 'el lugar en el mapa')}
		</section>
	{/if}

	{#if editando}
		<section class="tarjeta flex items-center justify-between gap-3 text-sm">
			<p>
				Te contactan por:
				<strong>
					{[a.contacto_whatsapp && 'WhatsApp', a.contacto_formulario && 'formulario']
						.filter(Boolean)
						.join(' y ')}
				</strong>
			</p>
			{@render lapizDe('contacto', 'la forma de contacto')}
		</section>
	{/if}
</div>
