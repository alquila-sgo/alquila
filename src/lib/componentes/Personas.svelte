<script lang="ts">
	// Máximo de personas: muñequitos (hasta 2 adultos arriba y 2 niños abajo) + texto.
	let {
		adultos,
		ninos,
		sinLimite
	}: { adultos: number | null; ninos: number | null; sinLimite: boolean } = $props();

	const iconosAdultos = $derived(sinLimite ? 2 : Math.min(adultos ?? 0, 2));
	const iconosNinos = $derived(sinLimite ? 2 : Math.min(ninos ?? 0, 2));
	const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
	const texto = $derived(
		sinLimite
			? 'Sin límite de personas'
			: `Máx. ${plural(adultos ?? 0, 'adulto', 'adultos')}${
					ninos ? ` y ${plural(ninos, 'niño', 'niños')}` : ', sin niños'
				}`
	);
</script>

{#snippet persona(clase: string)}
	<svg viewBox="0 0 24 24" class={clase} fill="currentColor" aria-hidden="true">
		<circle cx="12" cy="6.5" r="4" />
		<path d="M4 22v-2.5a8 8 0 0 1 16 0V22Z" />
	</svg>
{/snippet}

<div class="flex items-center gap-3">
	<div class="flex w-10 shrink-0 flex-col items-center text-marca-700">
		<div class="flex -space-x-1">
			{#each Array.from({ length: iconosAdultos }, (_, i) => i) as i (i)}{@render persona(
					'h-6 w-6'
				)}{/each}
		</div>
		{#if iconosNinos}
			<div class="-mt-0.5 flex -space-x-0.5 text-sol-500">
				{#each Array.from({ length: iconosNinos }, (_, i) => i) as i (i)}{@render persona(
						'h-4 w-4'
					)}{/each}
			</div>
		{/if}
	</div>
	<p class="font-semibold text-slate-700">{texto}</p>
</div>
