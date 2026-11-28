<script lang="ts">
	// Número con botones − y + grandes (más cómodo que tipear en el celular).
	let {
		nombre,
		etiqueta,
		valor = $bindable(''),
		min = 0,
		max = 20,
		opcional = false
	}: {
		nombre: string;
		etiqueta: string;
		valor?: string;
		min?: number;
		max?: number;
		opcional?: boolean;
	} = $props();

	const n = $derived(valor === '' ? null : Number(valor));
	function cambiar(d: number) {
		const base = n ?? (d > 0 ? min - 1 : min);
		const nuevo = Math.min(max, Math.max(min, base + d));
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
		<span class="w-8 text-center text-xl font-extrabold tabular-nums">{n ?? '–'}</span>
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
