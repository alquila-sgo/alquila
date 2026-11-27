<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import MapaPin from './MapaPin.svelte';
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
		textoBoton
	}: {
		inicial: ValoresAviso;
		errores?: Record<string, string>;
		mensaje?: string;
		localidades: Localidad[];
		textoBoton: string;
	} = $props();

	// Copia editable del formulario (se reinicia si el servidor devuelve otros valores).
	// $state y no $derived: los campos se editan con bind y necesitan reactividad profunda.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let v = $state<ValoresAviso>(untrack(() => ({ ...inicial })));
	$effect.pre(() => {
		v = { ...inicial };
	});
	let enviando = $state(false);

	const campo = 'w-full rounded-lg border-slate-300';
	const etiqueta = 'text-sm font-medium';
</script>

{#snippet err(clave: string)}
	{#if errores[clave]}<span class="block text-sm text-red-700">{errores[clave]}</span>{/if}
{/snippet}

<form
	method="POST"
	class="space-y-8"
	use:enhance={() => {
		enviando = true;
		return async ({ update }) => {
			await update({ reset: false });
			enviando = false;
		};
	}}
>
	<fieldset class="space-y-4">
		<legend class="text-lg font-semibold">La propiedad</legend>

		<label class="block space-y-1">
			<span class={etiqueta}>Título del aviso</span>
			<input
				name="titulo"
				bind:value={v.titulo}
				required
				minlength="10"
				maxlength="100"
				placeholder="Ej: Departamento 2 ambientes cerca de la plaza"
				class={campo}
			/>
			{@render err('titulo')}
		</label>

		<label class="block space-y-1">
			<span class={etiqueta}>Tipo</span>
			<select name="tipo_propiedad" bind:value={v.tipo_propiedad} class={campo}>
				{#each TIPOS_PROPIEDAD as [valor, texto] (valor)}<option value={valor}>
						{texto}
					</option>{/each}
			</select>
			{@render err('tipo_propiedad')}
		</label>

		<div class="grid grid-cols-2 gap-3">
			<label class="block space-y-1">
				<span class={etiqueta}>Ambientes</span>
				<input
					name="ambientes"
					type="number"
					min="1"
					max="20"
					required
					inputmode="numeric"
					bind:value={v.ambientes}
					class={campo}
				/>
				{@render err('ambientes')}
			</label>
			<label class="block space-y-1">
				<span class={etiqueta}>Dormitorios</span>
				<input
					name="dormitorios"
					type="number"
					min="0"
					max="20"
					required
					inputmode="numeric"
					bind:value={v.dormitorios}
					class={campo}
				/>
				{@render err('dormitorios')}
			</label>
			<label class="block space-y-1">
				<span class={etiqueta}>Baños (opcional)</span>
				<input
					name="banos"
					type="number"
					min="0"
					max="10"
					inputmode="numeric"
					bind:value={v.banos}
					class={campo}
				/>
				{@render err('banos')}
			</label>
			<label class="block space-y-1">
				<span class={etiqueta}>Superficie m² (opcional)</span>
				<input
					name="superficie_m2"
					type="number"
					min="1"
					inputmode="numeric"
					bind:value={v.superficie_m2}
					class={campo}
				/>
				{@render err('superficie_m2')}
			</label>
		</div>

		<label class="block space-y-1">
			<span class={etiqueta}>Descripción</span>
			<textarea
				name="descripcion"
				bind:value={v.descripcion}
				required
				minlength="20"
				maxlength="3000"
				rows="5"
				class={campo}></textarea>
			<span class="block text-xs text-slate-500">{v.descripcion.length}/3000</span>
			{@render err('descripcion')}
		</label>

		<div class="space-y-1">
			<span class={etiqueta}>Servicios y comodidades</span>
			<div class="grid grid-cols-2 gap-2">
				{#each SERVICIOS as [valor, texto] (valor)}
					<label class="flex items-center gap-2">
						<input type="checkbox" name="servicios" value={valor} bind:group={v.servicios} />
						{texto}
					</label>
				{/each}
			</div>
		</div>
	</fieldset>

	<fieldset class="space-y-4">
		<legend class="text-lg font-semibold">Ubicación</legend>

		<label class="block space-y-1">
			<span class={etiqueta}>Localidad</span>
			<select name="localidad_id" bind:value={v.localidad_id} required class={campo}>
				<option value="" disabled>Elegí…</option>
				{#each localidades as l (l.id)}
					<option value={String(l.id)}>{l.nombre} ({l.departamento})</option>
				{/each}
			</select>
			{@render err('localidad_id')}
		</label>

		<label class="block space-y-1">
			<span class={etiqueta}>Barrio (opcional)</span>
			<input name="barrio" bind:value={v.barrio} maxlength="80" class={campo} />
			{@render err('barrio')}
		</label>

		<div class="space-y-1">
			<span class={etiqueta}>Marcá la propiedad en el mapa</span>
			<p class="text-xs text-slate-500">
				Tocá el mapa o usá el botón de ubicación. Podés arrastrar el pin para ajustarlo.
			</p>
			<MapaPin bind:lat={v.lat} bind:lng={v.lng} />
			<input type="hidden" name="lat" value={v.lat} />
			<input type="hidden" name="lng" value={v.lng} />
			{@render err('ubicacion')}
		</div>

		<label class="block space-y-1">
			<span class={etiqueta}>Dirección (opcional, no se publica)</span>
			<input name="direccion" bind:value={v.direccion} maxlength="200" class={campo} />
			{@render err('direccion')}
		</label>

		<label class="flex items-start gap-2">
			<input type="checkbox" name="mostrar_exacta" bind:checked={v.mostrar_exacta} class="mt-1" />
			<span class="text-sm">
				Mostrar la ubicación exacta. Si no lo marcás, en el aviso se ve una zona aproximada de unos
				300 m.
			</span>
		</label>
	</fieldset>

	<fieldset class="space-y-4">
		<legend class="text-lg font-semibold">Precio</legend>

		<label class="flex items-center gap-2">
			<input type="checkbox" name="consultar_precio" bind:checked={v.consultar_precio} />
			Consultar precio (no mostrarlo)
		</label>

		{#if !v.consultar_precio}
			<div class="grid grid-cols-3 gap-3">
				<label class="col-span-2 block space-y-1">
					<span class={etiqueta}>Precio mensual</span>
					<input
						name="precio"
						inputmode="decimal"
						bind:value={v.precio}
						placeholder="350.000"
						class={campo}
					/>
				</label>
				<label class="block space-y-1">
					<span class={etiqueta}>Moneda</span>
					<select name="moneda" bind:value={v.moneda} class={campo}>
						<option value="ARS">$</option>
						<option value="USD">US$</option>
					</select>
				</label>
			</div>
			{@render err('precio')}
			{@render err('moneda')}
		{/if}

		<div class="grid grid-cols-2 items-end gap-3">
			<label class="block space-y-1">
				<span class={etiqueta}>Expensas</span>
				<input
					name="expensas"
					inputmode="decimal"
					bind:value={v.expensas}
					disabled={v.sin_expensas}
					class={campo}
				/>
			</label>
			<label class="flex items-center gap-2 pb-2">
				<input type="checkbox" name="sin_expensas" bind:checked={v.sin_expensas} />
				Sin expensas
			</label>
		</div>
		{@render err('expensas')}

		<label class="block space-y-1">
			<span class={etiqueta}>Ajuste (opcional)</span>
			<input
				name="ajuste"
				bind:value={v.ajuste}
				maxlength="120"
				placeholder="Ej: cada 3 meses por IPC"
				class={campo}
			/>
			{@render err('ajuste')}
		</label>
	</fieldset>

	<fieldset class="space-y-4">
		<legend class="text-lg font-semibold">Condiciones</legend>

		<div class="grid grid-cols-2 gap-3">
			<label class="block space-y-1">
				<span class={etiqueta}>Mascotas</span>
				<select name="mascotas" bind:value={v.mascotas} class={campo}>
					{#each MASCOTAS as [valor, texto] (valor)}<option value={valor}>{texto}</option>{/each}
				</select>
			</label>
			<label class="block space-y-1">
				<span class={etiqueta}>Amueblado</span>
				<select name="amueblado" bind:value={v.amueblado} class={campo}>
					{#each AMUEBLADO as [valor, texto] (valor)}<option value={valor}>{texto}</option>{/each}
				</select>
			</label>
		</div>

		<div class="space-y-1">
			<span class={etiqueta}>Garantías que aceptás</span>
			{#each GARANTIAS as [valor, texto] (valor)}
				<label class="flex items-center gap-2">
					<input type="checkbox" name="garantias" value={valor} bind:group={v.garantias} />
					{texto}
				</label>
			{/each}
		</div>

		<div class="grid grid-cols-2 gap-3">
			<label class="block space-y-1">
				<span class={etiqueta}>Meses de depósito</span>
				<input
					name="meses_deposito"
					type="number"
					min="0"
					max="12"
					inputmode="numeric"
					bind:value={v.meses_deposito}
					class={campo}
				/>
				{@render err('meses_deposito')}
			</label>
			<label class="block space-y-1">
				<span class={etiqueta}>Disponible desde</span>
				<input name="disponible_desde" type="date" bind:value={v.disponible_desde} class={campo} />
				{@render err('disponible_desde')}
			</label>
		</div>

		<label class="block space-y-1">
			<span class={etiqueta}>Otros requisitos (opcional)</span>
			<textarea name="requisitos" bind:value={v.requisitos} maxlength="500" rows="2" class={campo}
			></textarea>
			{@render err('requisitos')}
		</label>
	</fieldset>

	<fieldset class="space-y-2">
		<legend class="text-lg font-semibold">Cómo te contactan</legend>
		<label class="flex items-center gap-2">
			<input type="checkbox" name="contacto_whatsapp" bind:checked={v.contacto_whatsapp} />
			WhatsApp (se muestra solo a personas con cuenta)
		</label>
		<label class="flex items-center gap-2">
			<input type="checkbox" name="contacto_formulario" bind:checked={v.contacto_formulario} />
			Formulario de consulta
		</label>
		{@render err('contacto')}
	</fieldset>

	{#if Object.keys(errores).length}
		<p class="rounded-lg bg-red-50 p-3 text-sm text-red-800">Revisá los campos marcados en rojo.</p>
	{/if}
	{#if mensaje}<p class="rounded-lg bg-red-50 p-3 text-sm text-red-800">{mensaje}</p>{/if}

	<button
		disabled={enviando}
		class="w-full rounded-lg bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
	>
		{enviando ? 'Guardando…' : textoBoton}
	</button>
</form>
