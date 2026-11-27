<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { CENTRO_CAPITAL, LIMITES_PROVINCIA } from '#lib/avisos.js';

	// lat y lng vienen como texto ('' si todavía no hay pin), igual que en el formulario.
	let {
		lat = $bindable(''),
		lng = $bindable(''),
		editable = true,
		radioMetros = 0
	}: { lat?: string; lng?: string; editable?: boolean; radioMetros?: number } = $props();

	let contenedor: HTMLDivElement;
	let error = $state('');

	onMount(() => {
		let destruir = () => {};
		void (async () => {
			try {
				// Se carga solo en el navegador: MapLibre necesita WebGL.
				const ml = await import('maplibre-gl');
				const { default: workerUrl } = await import('maplibre-gl/dist/maplibre-gl-worker.mjs?url');
				ml.setWorkerUrl(workerUrl);

				const L = LIMITES_PROVINCIA;
				const hayPin = lat !== '' && lng !== '';
				const centro: [number, number] = hayPin
					? [Number(lng), Number(lat)]
					: [CENTRO_CAPITAL.lng, CENTRO_CAPITAL.lat];

				const mapa = new ml.Map({
					container: contenedor,
					style: 'https://tiles.openfreemap.org/styles/liberty',
					center: centro,
					zoom: hayPin ? 15 : 12,
					maxBounds: [
						[L.lngMin - 1, L.latMin - 1],
						[L.lngMax + 1, L.latMax + 1]
					],
					cooperativeGestures: !editable
				});
				mapa.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
				destruir = () => mapa.remove();

				if (radioMetros > 0 && hayPin) {
					// Zona aproximada: un círculo en vez del punto exacto.
					mapa.on('load', () => {
						mapa.addSource('zona', {
							type: 'geojson',
							data: circulo(Number(lng), Number(lat), radioMetros)
						});
						mapa.addLayer({
							id: 'zona',
							type: 'fill',
							source: 'zona',
							paint: { 'fill-color': '#0f766e', 'fill-opacity': 0.2 }
						});
						mapa.addLayer({
							id: 'zona-borde',
							type: 'line',
							source: 'zona',
							paint: { 'line-color': '#0f766e', 'line-width': 2 }
						});
					});
					return;
				}

				const marcador = new ml.Marker({ color: '#0f766e', draggable: editable });
				if (hayPin) marcador.setLngLat(centro).addTo(mapa);

				if (!editable) return;

				const fijar = (lo: number, la: number) => {
					lng = lo.toFixed(6);
					lat = la.toFixed(6);
					marcador.setLngLat([lo, la]).addTo(mapa);
				};
				mapa.on('click', (ev) => fijar(ev.lngLat.lng, ev.lngLat.lat));
				marcador.on('dragend', () => {
					const p = marcador.getLngLat();
					fijar(p.lng, p.lat);
				});

				const geo = new ml.GeolocateControl({ positionOptions: { enableHighAccuracy: true } });
				mapa.addControl(geo, 'top-right');
				geo.on('geolocate', (pos) => fijar(pos.coords.longitude, pos.coords.latitude));
			} catch {
				error = 'No se pudo cargar el mapa. Revisá tu conexión y recargá la página.';
			}
		})();
		return () => destruir();
	});

	function circulo(lo: number, la: number, metros: number) {
		const puntos: [number, number][] = [];
		for (let i = 0; i <= 48; i++) {
			const a = (i / 48) * 2 * Math.PI;
			puntos.push([
				lo + (metros * Math.cos(a)) / (111320 * Math.cos((la * Math.PI) / 180)),
				la + (metros * Math.sin(a)) / 111320
			]);
		}
		return {
			type: 'Feature' as const,
			properties: {},
			geometry: { type: 'Polygon' as const, coordinates: [puntos] }
		};
	}
</script>

<div class="relative overflow-hidden rounded-lg border border-slate-300">
	<div bind:this={contenedor} class="h-72 w-full bg-slate-100"></div>
	{#if error}
		<p class="absolute inset-0 grid place-items-center bg-white/90 p-4 text-center text-sm">
			{error}
		</p>
	{/if}
</div>
