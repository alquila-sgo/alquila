<script lang="ts">
	// Fotos a pantalla completa: se deslizan de costado, y con doble toque, el botón
	// de lupa o pellizcando se hace zoom (con zoom, se mueve arrastrando).
	let {
		fotos,
		inicio = 0,
		oncerrar
	}: { fotos: string[]; inicio?: number; oncerrar: () => void } = $props();

	let carril: HTMLDivElement;
	let actual = $state(0);
	let zoom = $state(false);

	$effect(() => {
		actual = inicio;
		carril.scrollLeft = inicio * carril.clientWidth;
		const html = document.documentElement;
		const antes = html.style.overflow;
		html.style.overflow = 'hidden';
		const tecla = (e: KeyboardEvent) => {
			if (e.key === 'Escape') oncerrar();
			if (e.key === 'ArrowRight') ir(actual + 1);
			if (e.key === 'ArrowLeft') ir(actual - 1);
		};
		window.addEventListener('keydown', tecla);
		return () => {
			html.style.overflow = antes;
			window.removeEventListener('keydown', tecla);
		};
	});

	function ir(i: number) {
		if (i < 0 || i >= fotos.length) return;
		zoom = false;
		carril.scrollTo({ left: i * carril.clientWidth, behavior: 'smooth' });
	}

	function alDeslizar() {
		if (!zoom) actual = Math.round(carril.scrollLeft / carril.clientWidth);
	}

	/** Zoom x2.5 centrado donde se tocó. */
	function alternarZoom(ev?: MouseEvent) {
		zoom = !zoom;
		const marco = carril.children[actual] as HTMLElement | undefined;
		if (!marco) return;
		requestAnimationFrame(() => {
			if (zoom) {
				const r = marco.getBoundingClientRect();
				const fx = ev ? (ev.clientX - r.left) / r.width : 0.5;
				const fy = ev ? (ev.clientY - r.top) / r.height : 0.5;
				marco.scrollLeft = fx * marco.scrollWidth - r.width / 2;
				marco.scrollTop = fy * marco.scrollHeight - r.height / 2;
			} else {
				marco.scrollLeft = 0;
				marco.scrollTop = 0;
			}
		});
	}

	const boton =
		'grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-30';
</script>

<div
	class="fixed inset-0 z-50 flex flex-col bg-black"
	role="dialog"
	aria-modal="true"
	aria-label="Fotos"
>
	<div class="flex items-center justify-between p-3 text-white">
		<span class="text-sm font-semibold">{actual + 1} / {fotos.length}</span>
		<div class="flex gap-2">
			<button
				type="button"
				class={boton}
				aria-label={zoom ? 'Alejar' : 'Acercar'}
				onclick={() => alternarZoom()}
			>
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M8 11h6" />
					{#if !zoom}<path d="M11 8v6" />{/if}
				</svg>
			</button>
			<button type="button" class={boton} aria-label="Cerrar" onclick={oncerrar}>
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M6 6l12 12M18 6 6 18" />
				</svg>
			</button>
		</div>
	</div>

	<div
		bind:this={carril}
		onscroll={alDeslizar}
		class={[
			'flex min-h-0 flex-1',
			zoom ? 'overflow-hidden' : 'snap-x snap-mandatory overflow-x-auto'
		]}
		style="scrollbar-width: none"
	>
		{#each fotos as src, i (src)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class={[
					'h-full w-full shrink-0 snap-center',
					zoom && i === actual ? 'overflow-auto' : 'grid place-items-center overflow-hidden'
				]}
				style="touch-action: {zoom && i === actual ? 'pan-x pan-y' : 'pan-x pinch-zoom'}"
				ondblclick={alternarZoom}
			>
				<img
					{src}
					alt="Foto {i + 1} de {fotos.length}"
					draggable="false"
					class={zoom && i === actual
						? 'max-w-none'
						: 'max-h-full max-w-full object-contain select-none'}
					style={zoom && i === actual ? 'width: 250%; height: auto' : ''}
					loading={Math.abs(i - inicio) <= 1 ? 'eager' : 'lazy'}
				/>
			</div>
		{/each}
	</div>

	{#if fotos.length > 1}
		<div class="hidden justify-center gap-4 p-3 sm:flex">
			<button
				type="button"
				class={boton}
				aria-label="Anterior"
				disabled={actual === 0}
				onclick={() => ir(actual - 1)}
			>
				‹
			</button>
			<button
				type="button"
				class={boton}
				aria-label="Siguiente"
				disabled={actual === fotos.length - 1}
				onclick={() => ir(actual + 1)}
			>
				›
			</button>
		</div>
	{/if}
</div>
