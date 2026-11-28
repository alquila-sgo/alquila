<script lang="ts">
	// Festejo a pantalla completa cuando se publica un aviso. Se queda unos
	// 2 segundos después de la animación y sigue solo (o antes, con un toque).
	let { onlisto, duracion = 3400 }: { onlisto: () => void; duracion?: number } = $props();

	$effect(() => {
		const t = setTimeout(() => onlisto(), duracion);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const html = document.documentElement;
		const antes = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = antes;
		};
	});
</script>

<!-- Un toque en cualquier lado sigue antes de tiempo (el teclado no hace falta: sigue solo). -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
	onclick={onlisto}
	class="exito fixed inset-0 z-50 flex h-dvh flex-col items-center justify-center gap-8 bg-emerald-500 px-6 text-center text-white"
	role="status"
	aria-live="polite"
>
	<svg viewBox="0 0 120 120" class="h-40 w-40" aria-hidden="true">
		<circle class="circulo" cx="60" cy="60" r="54" fill="white" fill-opacity="0.18" />
		<circle
			class="aro"
			cx="60"
			cy="60"
			r="54"
			fill="none"
			stroke="white"
			stroke-width="6"
			stroke-linecap="round"
		/>
		<path
			class="tilde"
			d="M36 62 53 79 86 44"
			fill="none"
			stroke="white"
			stroke-width="9"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	<div class="texto space-y-2">
		<h1 class="text-3xl font-extrabold">¡Publicación exitosa!</h1>
		<p class="text-lg text-emerald-50">Tu aviso ya se puede ver.</p>
	</div>
</div>

<style>
	.exito {
		animation: entrar 0.35s ease-out both;
	}
	.circulo {
		transform-origin: center;
		animation: crecer 0.5s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.aro {
		stroke-dasharray: 340;
		stroke-dashoffset: 340;
		transform: rotate(-90deg);
		transform-origin: center;
		animation: dibujar 0.6s 0.3s ease-out forwards;
	}
	.tilde {
		stroke-dasharray: 80;
		stroke-dashoffset: 80;
		animation: dibujar 0.4s 0.8s ease-out forwards;
	}
	.texto {
		animation: subir 0.4s 1s ease-out both;
	}
	@keyframes entrar {
		from {
			opacity: 0;
			transform: scale(1.05);
		}
	}
	@keyframes crecer {
		from {
			transform: scale(0);
		}
	}
	@keyframes dibujar {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes subir {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.exito,
		.circulo,
		.aro,
		.tilde,
		.texto {
			animation-duration: 0.01s;
			animation-delay: 0s;
		}
	}
</style>
