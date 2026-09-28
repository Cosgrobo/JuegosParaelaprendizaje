<script setup>
import { computed, ref, onMounted } from 'vue'
import GameCard from '../components/GameCard.vue'

const juegos = ref([])
const cargando = ref(true)
const mensaje = ref('')
const iconosPorTipo = {
  'Sopa de letras': '\u{1F50D}',
  Crucigrama: '\u{1F9E9}',
  Ruleta: '\u{1F3A1}',
  Memorama: '\u{1F9E0}',
  Preguntas: '\u{2753}',
  Detective: '\u{1F575}\u{FE0F}'
}

const obtenerIcono = (tipo) => iconosPorTipo[tipo] || '\u{1F3AE}'
const definicionCategorias = [
  { id: 'palabras', titulo: 'Palabras y letras', tipos: ['Sopa de letras', 'Crucigrama'] },
  { id: 'observacion', titulo: 'Memoria y observación', tipos: ['Memorama', 'Detective'] },
  { id: 'retos', titulo: 'Preguntas y azar', tipos: ['Preguntas', 'Ruleta'] }
]
const carruseles = ref({})

const categorias = computed(() => {
  const agrupadas = definicionCategorias.map((categoria) => ({
    ...categoria,
    juegos: juegos.value.filter((juego) => categoria.tipos.includes(juego.tipo))
  })).filter((categoria) => categoria.juegos.length)

  const tiposConCategoria = definicionCategorias.flatMap((categoria) => categoria.tipos)
  const otros = juegos.value.filter((juego) => !tiposConCategoria.includes(juego.tipo))
  if (otros.length) agrupadas.push({ id: 'otros', titulo: 'Otros juegos', juegos: otros })

  return agrupadas
})

const desplazarCarrusel = (id, direccion) => {
  carruseles.value[id]?.scrollBy({ left: direccion * 320, behavior: 'smooth' })
}

const obtenerJuegos = async () => {
  try {
    const respuesta = await fetch('http://localhost:3000/api/juegos')

    if (!respuesta.ok) {
      throw new Error('No se pudieron obtener los juegos')
    }

    juegos.value = await respuesta.json()

  } catch (error) {
    console.error(error)
    mensaje.value = 'No se pudieron cargar los juegos'

  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  obtenerJuegos()
})
</script>

<template>
  <div class="home">

    <header class="navbar">
      <div class="brand">
      <h1>Juegos Educativos</h1>
      <p>Plataforma de juegos didácticos</p>
      </div>
      <nav class="nav-actions" aria-label="Navegación principal">
        <button class="profile-button" type="button" aria-label="Abrir perfil" @click="$router.push('/perfil')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.14 0-7.5 2.24-7.5 5v2h15v-2c0-2.76-3.36-5-7.5-5Z" /></svg>
        </button>
      </nav>
    </header>

    <main>

      <div class="home-heading">
        <h2>Selecciona una actividad</h2>
        <button class="create-button" @click="$router.push('/juegos/crear')">
          + Crear juego
        </button>
      </div>
<!-- Cargando -->
      <p v-if="cargando">
        Cargando juegos...
      </p>

      <!-- Error -->
      <p v-else-if="mensaje" class="error">
        {{ mensaje }}
      </p>

      <!-- Juegos -->
      <div v-else class="game-categories">
        <section v-for="categoria in categorias" :key="categoria.id" class="category-section">
          <div class="category-heading">
            <h3>{{ categoria.titulo }}</h3>
            <div class="carousel-controls" :aria-label="`Controles de ${categoria.titulo}`">
              <button type="button" :aria-label="`Anterior: ${categoria.titulo}`" @click="desplazarCarrusel(categoria.id, -1)">‹</button>
              <button type="button" :aria-label="`Siguiente: ${categoria.titulo}`" @click="desplazarCarrusel(categoria.id, 1)">›</button>
            </div>
          </div>

          <div :ref="(element) => { if (element) carruseles[categoria.id] = element }" class="games-carousel">
            <GameCard
              v-for="juego in categoria.juegos"
              :key="juego.id_juego"
              :id="juego.id_juego"
              :title="juego.nombre"
              :description="juego.descripcion"
              :icon="obtenerIcono(juego.tipo)"
              :route="
                juego.tipo === 'Sopa de letras'
                  ? `/juegos/sopa/${juego.id_juego}`
                  : juego.tipo === 'Crucigrama'
                    ? `/juegos/crucigrama/${juego.id_juego}`
                    : juego.tipo === 'Ruleta'
                      ? '/juegos/ruleta'
                      : juego.tipo === 'Memorama'
                        ? '/juegos/memorama'
                        : juego.tipo === 'Preguntas'
                          ? '/juegos/preguntas'
                          : juego.tipo === 'Detective'
                            ? '/juegos/detective'
                            : '#'
              "
            />
          </div>
        </section>
      </div>

    </main>

  </div>
</template>

<style scoped>

.home {
  min-height: 100vh;
  padding: 0 40px 40px;
  background:
    radial-gradient(circle at 88% 24%, rgba(129, 140, 248, 0.16), transparent 26rem),
    linear-gradient(145deg, #f4f6ff 0%, #f8faff 48%, #ecfeff 100%);
}

.navbar {
  min-height: 94px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 -40px 40px;
  padding: 14px 40px;
  background: linear-gradient(105deg, #312e81 0%, #4f46e5 62%, #6366f1 100%);
  box-shadow: 0 8px 24px rgba(49, 46, 129, 0.22);
}

.brand h1 {
  margin: 0 0 5px;
  color: #fff;
  letter-spacing: -0.03em;
}

.brand p {
  margin: 0;
  color: #e0e7ff;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.profile-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.profile-button svg {
  width: 23px;
  height: 23px;
  fill: currentColor;
}

.profile-button:hover {
  background: rgba(255, 255, 255, 0.26);
}


main {
  max-width: 1100px;
  margin: 0 auto;
}

.home-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 25px;
}

main h2 {
  margin: 0;
  color: #1e1b4b;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.create-button {
  padding: 11px 16px;
  border: 1px solid rgba(79, 70, 229, 0.24);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.48);
  color: #3730a3;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(49, 46, 129, 0.08);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.create-button:hover {
  transform: translateY(-1px);
  border-color: rgba(79, 70, 229, 0.45);
  background: rgba(255, 255, 255, 0.72);
}


.game-categories {
  display: grid;
  gap: 30px;
}

.category-section {
  min-width: 0;
}

.category-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.category-heading h3 {
  margin: 0;
  color: #312e81;
  font-size: 21px;
  letter-spacing: -0.02em;
}

.carousel-controls {
  display: flex;
  gap: 8px;
}

.carousel-controls button {
  width: 38px;
  height: 38px;
  border: 1px solid #c7d2fe;
  border-radius: 13px;
  background: #fff;
  color: #4338ca;
  font-size: 27px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.carousel-controls button:hover {
  transform: translateY(-1px);
  background: #eef2ff;
}

.games-carousel {
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding: 4px 4px 18px;
  scroll-snap-type: x mandatory;
  scrollbar-color: #a5b4fc transparent;
  scrollbar-width: thin;
}

.games-carousel :deep(.game-card) {
  flex: 0 0 290px;
  scroll-snap-align: start;
}

.error {
  color: #dc2626;
}

@media (max-width: 600px) {
  .home {
    padding: 0 18px 28px;
  }

  .navbar {
    margin: 0 -18px 30px;
    padding: 14px 18px;
  }

  .brand h1 {
    font-size: 20px;
  }

  main h2 {
    font-size: 23px;
  }

  .home-heading {
    flex-wrap: wrap;
  }

  .brand p {
    font-size: 13px;
  }

  
  .create-button {
    padding: 10px 12px;
    font-size: 13px;
    margin-left: auto;
  }

  .category-heading h3 {
    font-size: 18px;
  }

  .games-carousel :deep(.game-card) {
    flex-basis: min(290px, 84vw);
  }
}


</style>
