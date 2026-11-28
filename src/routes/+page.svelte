<script lang="ts">
	import { resolve } from '$app/paths';

	const beneficios = [
		{
			titulo: 'Publicar es gratis',
			texto: 'Subí tu departamento, casa o habitación sin pagar comisiones ni suscripciones.',
			icono:
				'M12 6v12m-3-2.8.9.6c1.2.9 3 .9 4.2 0 1.2-.9 1.2-2.3 0-3.2-.6-.5-1.4-.7-2.1-.7-.7 0-1.4-.2-1.9-.7-1.1-.9-1.1-2.3 0-3.2s2.8-.9 3.9 0l.4.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
		},
		{
			titulo: 'Contacto directo',
			texto: 'Hablás con el dueño o la inmobiliaria por WhatsApp o con un mensaje, sin vueltas.',
			icono:
				'M8.6 12h.01M12 12h.01M15.4 12h.01M21 12c0 4.6-4 8.2-9 8.2-1.5 0-2.9-.3-4.2-.9L3 20.3l1.4-3.7A7.8 7.8 0 0 1 3 12c0-4.5 4-8.2 9-8.2s9 3.7 9 8.2Z'
		},
		{
			titulo: 'Ubicación en el mapa',
			texto:
				'Cada aviso muestra la zona en el mapa. El dueño elige si mostrar la dirección exacta.',
			icono:
				'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4.5 0c0 7.1-7.5 11.3-7.5 11.3S4.5 17.6 4.5 10.5a7.5 7.5 0 1 1 15 0Z'
		},
		{
			titulo: 'Avisos cuidados',
			texto:
				'Los avisos vencen a los 30 días si no se renuevan: menos propiedades que ya se alquilaron.',
			icono:
				'M9 12.75 11.25 15 15 9.75m-3-7.04A11.96 11.96 0 0 1 3.6 6 12 12 0 0 0 3 9.75c0 5.6 3.82 10.3 9 11.6 5.18-1.3 9-6 9-11.6 0-1.3-.2-2.6-.6-3.75h-.15c-3.2 0-6.1-1.25-8.25-3.29Z'
		}
	];

	const pasos = [
		{ titulo: 'Entrá con Google', texto: 'O con tu email. Tarda menos de un minuto.' },
		{ titulo: 'Contá cómo es', texto: 'Precio, ambientes, condiciones y el pin en el mapa.' },
		{ titulo: 'Subí las fotos', texto: 'Mínimo 3. Se achican solas para cargar rápido.' }
	];

	const localidades = ['Capital', 'La Banda', 'Termas de Río Hondo', 'Añatuya', 'Frías'];
</script>

<!-- Portada -->
<section class="relative overflow-hidden bg-marca-900 text-white">
	<div
		aria-hidden="true"
		class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sol-500/40 blur-3xl sm:h-96 sm:w-96"
	></div>
	<div
		aria-hidden="true"
		class="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-marca-600/50 blur-3xl"
	></div>

	<div
		class="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pt-12 pb-16 sm:pt-16 md:grid-cols-2"
	>
		<div class="space-y-6">
			<p
				class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-marca-100 ring-1 ring-white/15"
			>
				<span class="h-2 w-2 rounded-full bg-sol-400"></span>
				Hecho en Santiago del Estero
			</p>
			<h1 class="text-4xl leading-[1.05] font-extrabold sm:text-5xl">
				Tu próximo hogar en <span class="text-sol-400">Santiago</span>, sin vueltas.
			</h1>
			<p class="max-w-md text-lg text-marca-100">
				Departamentos, casas y habitaciones en alquiler, publicados por dueños e inmobiliarias de
				toda la provincia.
			</p>
			<div class="flex flex-col gap-3 sm:flex-row">
				<a href={resolve('/publicar')} class="btn btn-acento text-base">
					Publicá tu propiedad gratis
				</a>
				<a
					href="#como-funciona"
					class="btn bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"
				>
					Cómo funciona
				</a>
			</div>
		</div>

		<!-- Ilustración: casas al sol -->
		<div class="relative mx-auto w-full max-w-sm md:max-w-none">
			<svg viewBox="0 0 400 300" class="w-full drop-shadow-2xl" aria-hidden="true">
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
	</div>
</section>

<!-- Buscador (anticipo honesto) -->
<section class="relative mx-auto -mt-8 max-w-5xl px-4">
	<div class="tarjeta flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="space-y-1">
			<p class="flex items-center gap-2 font-bold">
				¿Buscás alquiler?
				<span class="rounded-full bg-sol-100 px-2 py-0.5 text-xs font-bold text-sol-600">
					Muy pronto
				</span>
			</p>
			<p class="text-sm text-slate-600">
				Vas a poder buscar por localidad, precio y tipo de propiedad.
			</p>
		</div>
		<ul class="flex flex-wrap gap-2">
			{#each localidades as l (l)}
				<li
					class="rounded-full bg-marca-50 px-3 py-1.5 text-sm font-medium text-marca-800 ring-1 ring-marca-100"
				>
					{l}
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- Beneficios -->
<section class="mx-auto max-w-5xl px-4 pt-16">
	<h2 class="text-center text-2xl font-extrabold sm:text-3xl">Alquilar puede ser simple</h2>
	<p class="mx-auto mt-2 max-w-xl text-center text-slate-600">
		Pensada para Santiago: rápida en el celular y clara desde el primer vistazo.
	</p>
	<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each beneficios as b (b.titulo)}
			<li class="tarjeta space-y-3 transition hover:-translate-y-0.5 hover:shadow-md">
				<span class="grid h-11 w-11 place-items-center rounded-xl bg-marca-50 text-marca-700">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-6 w-6"
						aria-hidden="true"
					>
						<path d={b.icono} />
					</svg>
				</span>
				<h3 class="font-bold">{b.titulo}</h3>
				<p class="text-sm text-slate-600">{b.texto}</p>
			</li>
		{/each}
	</ul>
</section>

<!-- Cómo funciona -->
<section id="como-funciona" class="mx-auto max-w-5xl scroll-mt-20 px-4 pt-16">
	<div class="tarjeta grid gap-8 bg-gradient-to-br from-white to-sol-50 md:grid-cols-[1fr_1.4fr]">
		<div class="space-y-3">
			<p class="text-sm font-bold tracking-wide text-sol-600 uppercase">Para dueños</p>
			<h2 class="text-2xl font-extrabold sm:text-3xl">Publicá en 3 pasos</h2>
			<p class="text-slate-600">
				Sin papeles ni llamadas. Lo hacés desde el celular y lo podés pausar cuando lo alquiles.
			</p>
			<a href={resolve('/publicar')} class="btn btn-primario">Empezar ahora</a>
		</div>
		<ol class="space-y-4">
			{#each pasos as p, i (p.titulo)}
				<li class="flex gap-4">
					<span
						class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sol-500 font-extrabold text-white"
					>
						{i + 1}
					</span>
					<div>
						<p class="font-bold">{p.titulo}</p>
						<p class="text-sm text-slate-600">{p.texto}</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- Llamada final -->
<section class="mx-auto max-w-5xl px-4 pt-16">
	<div
		class="relative overflow-hidden rounded-3xl bg-sol-500 px-6 py-10 text-center text-white sm:px-12"
	>
		<div
			aria-hidden="true"
			class="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/15"
		></div>
		<h2 class="relative text-2xl font-extrabold sm:text-3xl">¿Tenés algo para alquilar?</h2>
		<p class="relative mx-auto mt-2 max-w-md text-sol-50">
			Llegá a gente de toda la provincia que está buscando dónde vivir.
		</p>
		<a
			href={resolve('/publicar')}
			class="btn relative mt-6 bg-white text-sol-600 shadow-lg hover:bg-sol-50"
		>
			Publicar gratis
		</a>
	</div>
</section>
