<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import MapaPin from './MapaPin.svelte';
	import Contador from './pasos/Contador.svelte';
	import PantallaPasos from './pasos/PantallaPasos.svelte';
	import {
		AMUEBLADO,
		GARANTIAS,
		MASCOTAS,
		SERVICIOS,
		TIPOS_PROPIEDAD,
		type Localidad,
		type ValoresAviso
	} from '#lib/avisos.js';

	let {
		inicial,
		errores = {},
		mensaje = '',
		localidades,
		textoBoton,
		cerrarHref,
		totalPasos
	}: {
		inicial: ValoresAviso;
		errores?: Record<string, string>;
		mensaje?: string;
		localidades: Localidad[];
		textoBoton: string;
		cerrarHref: string;
		/** Total que se muestra en la barra (por ejemplo, +1 si después vienen las fotos). */
		totalPasos?: number;
	} = $props();

	// Copia editable del formulario (se reinicia si el servidor devuelve otros valores).
	// $state y no $derived: los campos se editan con bind y necesitan reactividad profunda.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let v = $state<ValoresAviso>(untrack(() => ({ ...inicial })));
	$effect.pre(() => {
		v = { ...inicial };
	});

	let paso = $state(0);
	let aviso = $state('');
	let enviando = $state(false);

	/** Cada paso: título, ayuda, campos del servidor que le corresponden y chequeo propio. */
	const PASOS: { titulo: string; ayuda?: string; campos: string[]; chequeo: () => string }[] = [
		{ titulo: '¿Qué vas a alquilar?', campos: ['tipo_propiedad'], chequeo: () => '' },
		{
			titulo: '¿En qué localidad está?',
			campos: ['localidad_id', 'barrio'],
			chequeo: () => (v.localidad_id ? '' : 'Elegí la localidad.')
		},
		{
			titulo: 'Marcá el lugar en el mapa',
			ayuda: 'Tocá el mapa o usá tu ubicación. Podés arrastrar el pin.',
			campos: ['ubicacion'],
			chequeo: () => (v.lat && v.lng ? '' : 'Tocá el mapa para poner el pin.')
		},
		{
			titulo: '¿Qué ven los interesados?',
			campos: ['direccion'],
			chequeo: () => ''
		},
		{
			titulo: '¿Cómo es por dentro?',
			campos: ['ambientes', 'dormitorios', 'banos', 'superficie_m2'],
			chequeo: () =>
				!v.ambientes ? 'Indicá los ambientes.' : !v.dormitorios ? 'Indicá los dormitorios.' : ''
		},
		{
			titulo: '¿Qué tiene?',
			ayuda: 'Tocá todo lo que corresponda.',
			campos: [],
			chequeo: () => ''
		},
		{
			titulo: '¿Cuánto sale por mes?',
			campos: ['precio', 'moneda'],
			chequeo: () =>
				v.consultar_precio || /\d/.test(v.precio) ? '' : 'Escribí el precio o elegí "Consultar".'
		},
		{
			titulo: 'Expensas y ajuste',
			campos: ['expensas', 'ajuste'],
			chequeo: () => ''
		},
		{
			titulo: 'Condiciones',
			campos: ['mascotas', 'amueblado', 'disponible_desde'],
			chequeo: () => ''
		},
		{
			titulo: '¿Qué pedís para alquilar?',
			campos: ['meses_deposito', 'requisitos'],
			chequeo: () => ''
		},
		{
			titulo: 'Ponele nombre y contalo',
			campos: ['titulo', 'descripcion'],
			chequeo: () =>
				v.titulo.trim().length < 10
					? 'El título necesita al menos 10 letras.'
					: v.descripcion.trim().length < 20
						? 'La descripción necesita al menos 20 letras.'
						: ''
		},
		{
			titulo: '¿Cómo te contactan?',
			campos: ['contacto'],
			chequeo: () =>
				v.contacto_whatsapp || v.contacto_formulario ? '' : 'Elegí al menos una opción.'
		}
	];
	const ultimo = PASOS.length - 1;
	const total = $derived(totalPasos ?? PASOS.length);
	const actual = $derived(PASOS[paso]);

	// Si el servidor rechaza algo, vamos directo al primer paso con error.
	$effect(() => {
		const claves = Object.keys(errores);
		if (!claves.length) return;
		const i = PASOS.findIndex((p) => p.campos.some((c) => claves.includes(c)));
		if (i >= 0) untrack(() => (paso = i));
	});

	const errorDelPaso = $derived(
		actual.campos.map((c) => errores[c]).find((e) => e) ?? (paso === ultimo ? mensaje : '')
	);

	function siguiente() {
		aviso = actual.chequeo();
		if (aviso) return;
		paso = Math.min(paso + 1, ultimo);
	}
	function atras() {
		aviso = '';
		paso = Math.max(paso - 1, 0);
	}

	const ICONOS: Record<string, string> = {
		departamento: 'M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3',
		casa: 'M3 11 12 4l9 7M5 10v11h14V10M10 21v-6h4v6',
		duplex: 'M3 10 9 5l6 5M15 10l3-3 3 3M5 9v12h14V9M9 21v-5h3v5M8 11h2M15 13h2',
		habitacion: 'M3 18V8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3M7 11.5a1.5 1.5 0 1 0 0-.01',
		otro: 'M5 12h.01M12 12h.01M19 12h.01'
	};

	const chip =
		'rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition has-[:checked]:border-marca-600 has-[:checked]:bg-marca-600 has-[:checked]:text-white border-slate-300 bg-white text-slate-700';
	const opcion =
		'flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 font-semibold transition has-[:checked]:border-marca-600 has-[:checked]:bg-marca-50';
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
	method="POST"
	novalidate
	onkeydown={(e) => {
		// Enter en un campo pasa al paso siguiente en vez de enviar todo.
		if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement) && paso < ultimo) {
			e.preventDefault();
			siguiente();
		}
	}}
	use:enhance={() => {
		enviando = true;
		return async ({ update }) => {
			await update({ reset: false });
			enviando = false;
		};
	}}
>
	<PantallaPasos
		paso={paso + 1}
		{total}
		titulo={actual.titulo}
		ayuda={actual.ayuda}
		{cerrarHref}
		onatras={paso > 0 ? atras : undefined}
	>
		<!-- 1. Tipo -->
		<div hidden={paso !== 0} class="grid grid-cols-2 gap-3">
			{#each TIPOS_PROPIEDAD as [valor, texto] (valor)}
				<label
					class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-5 font-bold transition last:col-span-2 last:flex-row last:py-4 has-[:checked]:border-marca-600 has-[:checked]:bg-marca-50 has-[:checked]:text-marca-800"
				>
					<input
						type="radio"
						name="tipo_propiedad"
						value={valor}
						bind:group={v.tipo_propiedad}
						class="sr-only"
					/>
					<svg
						viewBox="0 0 24 24"
						class="h-9 w-9 text-marca-700"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d={ICONOS[valor]} />
					</svg>
					{texto}
				</label>
			{/each}
		</div>

		<!-- 2. Localidad -->
		<div hidden={paso !== 1} class="space-y-5">
			<label class="block space-y-2">
				<span class="etiqueta">Localidad</span>
				<select name="localidad_id" bind:value={v.localidad_id} class="campo py-3.5 text-lg">
					<option value="" disabled>Elegí…</option>
					{#each localidades as l (l.id)}
						<option value={String(l.id)}>{l.nombre} ({l.departamento})</option>
					{/each}
				</select>
			</label>
			<label class="block space-y-2">
				<span class="etiqueta">
					Barrio <span class="font-normal text-slate-500">(opcional)</span>
				</span>
				<input
					name="barrio"
					bind:value={v.barrio}
					maxlength="80"
					placeholder="Ej: Centro"
					class="campo py-3.5 text-lg"
				/>
			</label>
		</div>

		<!-- 3. Mapa (se monta solo al llegar, para que tome bien el tamaño) -->
		{#if paso === 2}
			<MapaPin bind:lat={v.lat} bind:lng={v.lng} alto="min-h-0 flex-1" />
		{/if}
		<input type="hidden" name="lat" value={v.lat} />
		<input type="hidden" name="lng" value={v.lng} />

		<!-- 4. Privacidad -->
		<div hidden={paso !== 3} class="space-y-3">
			<label class={opcion}>
				<input type="radio" bind:group={v.mostrar_exacta} value={false} class="h-5 w-5" />
				<span>
					Una zona aproximada
					<span class="block text-sm font-normal text-slate-600">Recomendado. Unos 300 m.</span>
				</span>
			</label>
			<label class={opcion}>
				<input type="radio" bind:group={v.mostrar_exacta} value={true} class="h-5 w-5" />
				<span>
					El lugar exacto
					<span class="block text-sm font-normal text-slate-600">Con el pin donde lo pusiste.</span>
				</span>
			</label>
			{#if v.mostrar_exacta}<input type="hidden" name="mostrar_exacta" value="on" />{/if}
			<label class="block space-y-2 pt-3">
				<span class="etiqueta">
					Dirección <span class="font-normal text-slate-500">(opcional, no se publica)</span>
				</span>
				<input
					name="direccion"
					bind:value={v.direccion}
					maxlength="200"
					placeholder="Para recordarla vos"
					class="campo py-3"
				/>
			</label>
		</div>

		<!-- 5. Ambientes -->
		<div hidden={paso !== 4} class="divide-y divide-slate-200">
			<Contador nombre="ambientes" etiqueta="Ambientes" bind:valor={v.ambientes} min={1} />
			<Contador nombre="dormitorios" etiqueta="Dormitorios" bind:valor={v.dormitorios} />
			<Contador nombre="banos" etiqueta="Baños" bind:valor={v.banos} max={10} opcional />
			<label class="flex items-center justify-between gap-3 py-3">
				<span class="font-semibold">
					Superficie <span class="text-sm font-normal text-slate-500">(opcional)</span>
				</span>
				<span class="flex items-center gap-2">
					<input
						name="superficie_m2"
						inputmode="numeric"
						bind:value={v.superficie_m2}
						class="campo w-24 text-right"
					/>
					m²
				</span>
			</label>
		</div>

		<!-- 6. Comodidades -->
		<div hidden={paso !== 5} class="flex flex-wrap content-start gap-2.5">
			{#each SERVICIOS as [valor, texto] (valor)}
				<label class={chip}>
					<input
						type="checkbox"
						name="servicios"
						value={valor}
						bind:group={v.servicios}
						class="sr-only"
					/>
					{texto}
				</label>
			{/each}
		</div>

		<!-- 7. Precio -->
		<div hidden={paso !== 6} class="space-y-5">
			<div class="flex rounded-2xl bg-slate-200/70 p-1 font-semibold">
				{#each [['ARS', '$ Pesos'], ['USD', 'US$ Dólares']] as [valor, texto] (valor)}
					<label
						class="flex-1 cursor-pointer rounded-xl py-2.5 text-center text-slate-600 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm"
					>
						<input
							type="radio"
							name="moneda"
							value={valor}
							bind:group={v.moneda}
							disabled={v.consultar_precio}
							class="sr-only"
						/>
						{texto}
					</label>
				{/each}
			</div>
			<input
				name="precio"
				inputmode="decimal"
				bind:value={v.precio}
				disabled={v.consultar_precio}
				placeholder="350.000"
				aria-label="Precio mensual"
				class="w-full border-0 border-b-2 border-slate-300 bg-transparent px-0 py-2 text-center text-4xl font-extrabold focus:border-marca-600 focus:ring-0 disabled:opacity-40"
			/>
			<label class={opcion}>
				<input
					type="checkbox"
					name="consultar_precio"
					bind:checked={v.consultar_precio}
					class="h-5 w-5"
				/>
				Prefiero no mostrarlo ("Consultar")
			</label>
		</div>

		<!-- 8. Expensas y ajuste -->
		<div hidden={paso !== 7} class="space-y-5">
			<label class="block space-y-2">
				<span class="etiqueta">Expensas por mes</span>
				<input
					name="expensas"
					inputmode="decimal"
					bind:value={v.expensas}
					disabled={v.sin_expensas}
					placeholder="0"
					class="campo py-3 text-lg disabled:opacity-40"
				/>
			</label>
			<label class={opcion}>
				<input type="checkbox" name="sin_expensas" bind:checked={v.sin_expensas} class="h-5 w-5" />
				No tiene expensas
			</label>
			<label class="block space-y-2">
				<span class="etiqueta">
					Ajuste <span class="font-normal text-slate-500">(opcional)</span>
				</span>
				<input
					name="ajuste"
					bind:value={v.ajuste}
					maxlength="120"
					placeholder="Ej: cada 3 meses por IPC"
					class="campo py-3"
				/>
			</label>
		</div>

		<!-- 9. Condiciones -->
		<div hidden={paso !== 8} class="space-y-6">
			<fieldset class="space-y-2">
				<legend class="etiqueta mb-2">¿Acepta mascotas?</legend>
				<div class="flex flex-wrap gap-2">
					{#each MASCOTAS as [valor, texto] (valor)}
						<label class={chip}>
							<input
								type="radio"
								name="mascotas"
								value={valor}
								bind:group={v.mascotas}
								class="sr-only"
							/>{texto}
						</label>
					{/each}
				</div>
			</fieldset>
			<fieldset class="space-y-2">
				<legend class="etiqueta mb-2">¿Está amueblado?</legend>
				<div class="flex flex-wrap gap-2">
					{#each AMUEBLADO as [valor, texto] (valor)}
						<label class={chip}>
							<input
								type="radio"
								name="amueblado"
								value={valor}
								bind:group={v.amueblado}
								class="sr-only"
							/>{texto}
						</label>
					{/each}
				</div>
			</fieldset>
			<label class="block space-y-2">
				<span class="etiqueta">Disponible desde</span>
				<input
					name="disponible_desde"
					type="date"
					bind:value={v.disponible_desde}
					class="campo py-3"
				/>
			</label>
		</div>

		<!-- 10. Requisitos -->
		<div hidden={paso !== 9} class="space-y-3">
			<div class="flex flex-wrap gap-2">
				{#each GARANTIAS as [valor, texto] (valor)}
					<label class={chip}>
						<input
							type="checkbox"
							name="garantias"
							value={valor}
							bind:group={v.garantias}
							class="sr-only"
						/>{texto}
					</label>
				{/each}
			</div>
			<Contador
				nombre="meses_deposito"
				etiqueta="Meses de depósito"
				bind:valor={v.meses_deposito}
				max={12}
				opcional
			/>
			<input
				name="requisitos"
				bind:value={v.requisitos}
				maxlength="500"
				placeholder="Otros requisitos (opcional)"
				class="campo py-3"
			/>
		</div>

		<!-- 11. Título y descripción -->
		<div hidden={paso !== 10} class="flex min-h-0 flex-1 flex-col gap-4">
			<input
				name="titulo"
				bind:value={v.titulo}
				maxlength="100"
				placeholder="Ej: Depto 2 ambientes cerca de la plaza"
				aria-label="Título del aviso"
				class="campo py-3.5 text-lg font-semibold"
			/>
			<div class="relative flex min-h-0 flex-1 flex-col">
				<textarea
					name="descripcion"
					bind:value={v.descripcion}
					maxlength="3000"
					placeholder="Contá cómo es: luz, ruido, cercanía a colegios, colectivos…"
					aria-label="Descripción"
					class="campo min-h-24 flex-1 resize-none"></textarea>
				<span class="absolute right-3 bottom-2 text-xs text-slate-400">
					{v.descripcion.length}/3000
				</span>
			</div>
		</div>

		<!-- 12. Contacto -->
		<div hidden={paso !== 11} class="space-y-3">
			<label class={opcion}>
				<input
					type="checkbox"
					name="contacto_whatsapp"
					bind:checked={v.contacto_whatsapp}
					class="h-5 w-5"
				/>
				<span>
					WhatsApp
					<span class="block text-sm font-normal text-slate-600">
						Solo lo ven personas con cuenta.
					</span>
				</span>
			</label>
			<label class={opcion}>
				<input
					type="checkbox"
					name="contacto_formulario"
					bind:checked={v.contacto_formulario}
					class="h-5 w-5"
				/>
				<span>
					Mensaje por la app
					<span class="block text-sm font-normal text-slate-600">Te llega la consulta.</span>
				</span>
			</label>
		</div>

		{#snippet pie()}
			{#if aviso || errorDelPaso}
				<p class="aviso-error mb-3" role="alert">{aviso || errorDelPaso}</p>
			{/if}
			{#if paso < ultimo}
				<button type="button" class="btn btn-primario w-full py-4 text-lg" onclick={siguiente}>
					Siguiente
				</button>
			{:else}
				<button
					disabled={enviando}
					class="btn btn-acento w-full py-4 text-lg"
					onclick={(e) => {
						aviso = actual.chequeo();
						if (aviso) e.preventDefault();
					}}
				>
					{enviando ? 'Guardando…' : textoBoton}
				</button>
			{/if}
		{/snippet}
	</PantallaPasos>
</form>
