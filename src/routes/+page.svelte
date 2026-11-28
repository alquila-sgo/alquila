<script lang="ts">
	import { resolve } from '$app/paths';

	const sellos = [
		{ texto: 'Gratis', icono: 'M5 13l4 4L19 7' },
		{
			texto: 'Directo por WhatsApp',
			icono:
				'M21 12c0 4.6-4 8.2-9 8.2-1.5 0-2.9-.3-4.2-.9L3 20.3l1.4-3.7A7.8 7.8 0 0 1 3 12c0-4.5 4-8.2 9-8.2s9 3.7 9 8.2Z'
		},
		{
			texto: 'Con mapa',
			icono:
				'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4.5 0c0 7.1-7.5 11.3-7.5 11.3S4.5 17.6 4.5 10.5a7.5 7.5 0 1 1 15 0Z'
		}
	];
</script>

<section class="relative overflow-hidden bg-marca-900 text-white">
	<div
		aria-hidden="true"
		class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sol-500/40 blur-3xl sm:h-96 sm:w-96"
	></div>
	<div
		class="relative mx-auto grid max-w-5xl items-center gap-6 px-4 pt-10 pb-24 md:grid-cols-2 md:pt-16"
	>
		<div class="space-y-4 text-center md:text-left">
			<h1 class="text-4xl leading-[1.05] font-extrabold sm:text-5xl">
				Alquilá fácil en <span class="text-sol-400">Santiago</span>.
			</h1>
			<ul class="flex flex-wrap justify-center gap-2 md:justify-start">
				{#each sellos as s (s.texto)}
					<li
						class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/15"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-4 w-4 text-sol-400"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d={s.icono} />
						</svg>
						{s.texto}
					</li>
				{/each}
			</ul>
		</div>
		<svg
			viewBox="0 0 400 300"
			class="mx-auto w-full max-w-[15rem] drop-shadow-2xl md:max-w-sm"
			aria-hidden="true"
		>
			<circle cx="300" cy="80" r="46" fill="#fb923c" />
			<circle cx="300" cy="80" r="66" fill="#fb923c" opacity=".18" />
			<rect x="20" y="250" width="360" height="12" rx="6" fill="#0d8a7d" />
			<!-- edificio -->
			<rect x="40" y="110" width="110" height="145" rx="10" fill="#fffbf5" />
			{#each [0, 1, 2] as fila (fila)}
				{#each [0, 1, 2] as col (col)}
					<rect
						x={56 + col * 30}
						y={128 + fila * 34}
						width="18"
						height="20"
						rx="3"
						fill={fila === 1 && col === 2 ? '#fb923c' : '#94eadb'}
					/>
				{/each}
			{/each}
			<rect x="80" y="225" width="30" height="30" rx="4" fill="#0f766e" />
			<!-- casa -->
			<path d="M175 165 255 105l80 60v90H175z" fill="#fff" />
			<path
				d="M160 172 255 98l95 74"
				fill="none"
				stroke="#f97316"
				stroke-width="14"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<rect x="200" y="185" width="34" height="30" rx="4" fill="#94eadb" />
			<rect x="275" y="195" width="32" height="60" rx="4" fill="#0f766e" />
			<circle cx="300" cy="226" r="3" fill="#fb923c" />
			<!-- cartel -->
			<rect x="350" y="200" width="6" height="55" fill="#115e59" />
			<rect x="320" y="180" width="70" height="30" rx="6" fill="#f97316" />
			<text
				x="355"
				y="200"
				text-anchor="middle"
				font-size="11"
				font-weight="800"
				fill="#fff"
				font-family="Plus Jakarta Sans Variable, sans-serif"
			>
				ALQUILO
			</text>
		</svg>
	</div>
</section>

<!-- Dos caminos, nada más -->
<section class="relative mx-auto -mt-16 grid max-w-3xl gap-3 px-4 sm:grid-cols-2">
	<a
		href={resolve('/publicar')}
		class="group flex items-center gap-4 rounded-3xl bg-sol-500 p-5 text-white shadow-xl shadow-sol-600/30 transition hover:-translate-y-0.5 hover:bg-sol-600"
	>
		<span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20">
			<svg
				viewBox="0 0 24 24"
				class="h-8 w-8"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M3 11 12 4l9 7M5 10v11h14V10M12 12v6M9 15h6" />
			</svg>
		</span>
		<span>
			<span class="block text-xl font-extrabold">Publico mi propiedad</span>
			<span class="block text-sm text-sol-50">Gratis, en pocos pasos</span>
		</span>
	</a>
	<div class="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
		<span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-marca-50 text-marca-700">
			<svg
				viewBox="0 0 24 24"
				class="h-8 w-8"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" />
			</svg>
		</span>
		<span>
			<span class="flex items-center gap-2 text-xl font-extrabold">
				Busco alquiler
				<span class="rounded-full bg-sol-100 px-2 py-0.5 text-xs font-bold text-sol-600">
					Pronto
				</span>
			</span>
			<span class="block text-sm text-slate-600">Por zona, precio y tipo</span>
		</span>
	</div>
</section>
