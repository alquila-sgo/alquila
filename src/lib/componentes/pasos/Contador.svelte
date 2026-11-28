<script lang="ts">
	// Número con botones − y + grandes (más cómodo que tipear en el celular).
	let {
		nombre,
		etiqueta,
		valor = $bindable(''),
		min = 0,
		max = 20,
		paso = 1,
		inicio,
		unidad = '',
		opcional = false
	}: {
		nombre: string;
		etiqueta: string;
		valor?: string;
		min?: number;
		max?: number;
		/** De a cuánto suma o resta cada toque. */
		paso?: number;
		/** Valor del primer toque en + cuando está vacío (por defecto, el mínimo). */
		inicio?: number;
		unidad?: string;
		opcional?: boolean;
	} = $props();

	const n = $derived(valor === '' ? null : Number(valor));
	function cambiar(d: number) {
		if (n === null) {
			valor = String(d > 0 ? (inicio ?? min) : min);
			return;
		}
		const nuevo = Math.min(max, Math.max(min, n + d * paso));
		valor = String(nuevo);
	}
</script>

<div class="flex items-center justify-between gap-3 py-1.5">
	<span class="font-semibold">
		{etiqueta}
		{#if opcional}<span class="text-sm font-normal text-slate-500">(opcional)</span>{/if}
	</span>
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="grid h-11 w-11 place-items-center rounded-full border-2 border-slate-300 text-xl font-bold text-slate-700 disabled:opacity-30"
			disabled={n === null || n <= min}
			aria-label="Menos {etiqueta}"
			onclick={() => cambiar(-1)}
		>
			−
		</button>
		<span class="min-w-8 text-center text-xl font-extrabold tabular-nums">
			{n ?? '–'}{#if unidad && n !== null}<span class="text-sm font-semibold"> {unidad}</span>{/if}
		</span>
		<button
			type="button"
			class="grid h-11 w-11 place-items-center rounded-full border-2 border-marca-600 text-xl font-bold text-marca-700 disabled:opacity-30"
			disabled={n !== null && n >= max}
			aria-label="Más {etiqueta}"
			onclick={() => cambiar(1)}
		>
			+
		</button>
	</div>
	<input type="hidden" name={nombre} value={valor} />
</div>
