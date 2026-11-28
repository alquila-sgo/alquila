<script lang="ts">
	import { resolve } from '$app/paths';
	import { AMUEBLADO, GARANTIAS, MASCOTAS, SERVICIOS, TIPOS_PROPIEDAD } from '#lib/avisos.js';
	import MapaPin from '#lib/componentes/MapaPin.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const a = $derived(data.aviso);

	const etiqueta = (lista: readonly (readonly [string, string])[], v: string | null) =>
		lista.find(([k]) => k === v)?.[1] ?? '';
	const plata = (n: number, moneda: string | null) =>
		`${moneda === 'USD' ? 'US$' : '$'} ${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

	const lugar = $derived(
		[a.barrio, a.localidades?.nombre ?? a.localidad_otra].filter(Boolean).join(', ')
	);
	const datos = $derived(
		[
			a.tipo_propiedad === 'duplex' ? 'Dúplex' : etiqueta(TIPOS_PROPIEDAD, a.tipo_propiedad),
			`${a.ambientes} amb.`,
			`${a.dormitorios} dorm.`,
			a.banos != null && `${a.banos} baño${a.banos === 1 ? '' : 's'}`,
			a.superficie_m2 && `${a.superficie_m2} m² aprox.`
		].filter((x): x is string => !!x)
	);
	const servicios = $derived(
		SERVICIOS.filter(([k]) => a[k as keyof typeof a] === true).map(([, t]) => t)
	);
	const garantias = $derived(a.garantias.map((g) => etiqueta(GARANTIAS, g)).filter(Boolean));
	const amoblado = $derived(etiqueta(AMUEBLADO, a.amueblado));

	let foto = $state(0);
	function alDeslizar(ev: Event) {
		const el = ev.currentTarget as HTMLElement;
		foto = Math.round(el.scrollLeft / el.clientWidth);
	}
</script>

<svelte:head><title>{a.titulo} · Alquilá Sgo</title></svelte:head>

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

	{#if a.fotos.length}
		<div class="relative -mx-4 sm:mx-0">
			<div
				class="flex snap-x snap-mandatory overflow-x-auto sm:rounded-3xl"
				style="scrollbar-width: none"
				onscroll={alDeslizar}
			>
				{#each a.fotos as f, i (f.id)}
					<img
						src="/fotos/{f.clave}"
						alt="Foto {i + 1} de {a.fotos.length}"
						class="aspect-[4/3] w-full shrink-0 snap-center object-cover"
						loading={i === 0 ? 'eager' : 'lazy'}
					/>
				{/each}
			</div>
			<span
				class="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
			>
				{foto + 1} / {a.fotos.length}
			</span>
		</div>
	{/if}

	<header class="space-y-2">
		<p class="text-3xl font-extrabold text-marca-800">
			{a.consultar_precio || a.precio == null ? 'Consultar precio' : plata(a.precio, a.moneda)}
			{#if !a.consultar_precio}<span class="text-base font-semibold text-slate-500">
					/ mes
				</span>{/if}
		</p>
		<p class="text-sm text-slate-600">
			{#if a.sin_expensas}Sin expensas{:else if a.expensas}+ {plata(a.expensas, 'ARS')} de expensas{/if}
		</p>
		<h1 class="text-xl leading-snug font-bold">{a.titulo}</h1>
		{#if lugar}
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
		{/if}
	</header>

	<ul class="flex flex-wrap gap-2">
		{#each datos as d (d)}
			<li class="rounded-full bg-marca-50 px-3 py-1.5 text-sm font-semibold text-marca-800">{d}</li>
		{/each}
	</ul>

	{#if a.descripcion}
		<p class="whitespace-pre-line text-slate-700">{a.descripcion}</p>
	{/if}

	{#if servicios.length || a.otros_servicios}
		<section class="tarjeta space-y-2">
			<h2 class="font-bold">Tiene</h2>
			<ul class="flex flex-wrap gap-2 text-sm">
				{#each servicios as s (s)}
					<li class="rounded-full bg-slate-100 px-3 py-1">{s}</li>
				{/each}
				{#if a.otros_servicios}<li class="rounded-full bg-slate-100 px-3 py-1">
						{a.otros_servicios}
					</li>{/if}
			</ul>
		</section>
	{/if}

	<section class="tarjeta space-y-1 text-sm">
		<h2 class="mb-2 font-bold">Condiciones</h2>
		<p>Mascotas: <strong>{etiqueta(MASCOTAS, a.mascotas)}</strong></p>
		{#if amoblado}<p>Amoblado: <strong>{amoblado}</strong></p>{/if}
		{#if garantias.length}<p>Requisitos: <strong>{garantias.join(', ')}</strong></p>{/if}
		{#if a.meses_deposito}
			<p>Depósito: <strong>{a.meses_deposito} mes{a.meses_deposito === 1 ? '' : 'es'}</strong></p>
		{/if}
		{#if a.requisitos}<p class="text-slate-700">{a.requisitos}</p>{/if}
	</section>

	{#if a.lat_publica != null && a.lng_publica != null}
		<section class="space-y-2">
			<h2 class="font-bold">Ubicación{a.ubicacion_exacta ? '' : ' aproximada'}</h2>
			<div class="overflow-hidden rounded-2xl">
				<MapaPin
					lat={String(a.lat_publica)}
					lng={String(a.lng_publica)}
					editable={false}
					radioMetros={a.ubicacion_exacta ? 0 : 300}
					alto="h-60"
				/>
			</div>
		</section>
	{/if}
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
