<script setup>
import {
  computed,
  ref,
  onMounted
} from 'vue'

import GameCard from '../components/GameCard.vue'
import AppIcon from '../components/AppIcon.vue'


const juegos = ref([])
const cargando = ref(true)
const mensaje = ref('')


const iconosPorTipo = {
  'Sopa de letras': 'search',
  Crucigrama: 'grid',
  Ruleta: 'wheel',
  Memorama: 'cards',
  Quiz: 'question',
  Preguntas: 'question',
  Detective: 'detective'
}


const obtenerIcono = (tipo) => {
  return iconosPorTipo[tipo] || 'controller'
}


const definicionCategorias = [
  {
    id: 'palabras',

    titulo: 'Palabras y letras',

    descripcion:
      'Sopas de letras, crucigramas y actividades de vocabulario.',

    tipos: [
      'Sopa de letras',
      'Crucigrama'
    ]
  },

  {
    id: 'observacion',

    titulo: 'Memoria y observación',

    descripcion:
      'Entrena memoria, atención y capacidad de deducción.',

    tipos: [
      'Memorama',
      'Detective'
    ]
  },

  {
    id: 'retos',

    titulo: 'Preguntas y azar',

    descripcion:
      'Responde preguntas y pon a prueba tus conocimientos.',

    tipos: [
      'Quiz',
      'Preguntas',
      'Ruleta'
    ]
  }
]


const carruseles = ref({})


const categorias = computed(() => {

  const agrupadas =
    definicionCategorias
      .map((categoria) => ({
        ...categoria,

        juegos:
          juegos.value.filter(
            (juego) =>
              categoria.tipos.includes(
                juego.tipo
              )
          )
      }))
      .filter(
        (categoria) =>
          categoria.juegos.length
      )


  const tiposConCategoria =
    definicionCategorias.flatMap(
      (categoria) =>
        categoria.tipos
    )


  const otros =
    juegos.value.filter(
      (juego) =>
        !tiposConCategoria.includes(
          juego.tipo
        )
    )


  if (otros.length) {
    agrupadas.push({
      id: 'otros',
      titulo: 'Otros juegos',
      descripcion: 'Más actividades disponibles.',
      juegos: otros
    })
  }


  return agrupadas
})


const totalJuegos = computed(
  () => juegos.value.length
)


const desplazarCarrusel = (
  id,
  direccion
) => {

  carruseles.value[id]
    ?.scrollBy({
      left: direccion * 320,
      behavior: 'smooth'
    })
}


const rutaJuego = (juego) => {

  if (
    juego.tipo ===
    'Sopa de letras'
  ) {
    return `/juegos/sopa/${juego.id_juego}`
  }


  if (
    juego.tipo ===
    'Crucigrama'
  ) {
    return `/juegos/crucigrama/${juego.id_juego}`
  }


  if (
    juego.tipo ===
    'Ruleta'
  ) {
    return `/juegos/ruleta/${juego.id_juego}`
  }


  if (
    juego.tipo ===
    'Memorama'
  ) {
    return `/juegos/memorama/${juego.id_juego}`
  }


  if (
    [
      'Quiz',
      'Preguntas'
    ].includes(
      juego.tipo
    )
  ) {
    return `/juegos/preguntas/${juego.id_juego}`
  }


  if (
    juego.tipo ===
    'Detective'
  ) {
    return `/juegos/detective/${juego.id_juego}`
  }


  return '#'
}


const obtenerJuegos = async () => {

  try {

    const respuesta =
      await fetch(
        'http://localhost:3000/api/juegos'
      )


    if (!respuesta.ok) {

      throw new Error(
        'No se pudieron obtener los juegos'
      )

    }


    juegos.value =
      await respuesta.json()


  } catch (error) {

    console.error(error)

    mensaje.value =
      'No se pudieron cargar los juegos'


  } finally {

    cargando.value =
      false
  }
}


onMounted(() => {
  obtenerJuegos()
})
</script>


<template>

  <div class="home">

    <!-- HEADER -->

    <header class="topbar">

      <div class="brand">

        <div class="brand-symbol">

          <AppIcon
            name="controller"
            :size="25"
          />

        </div>


        <div>

          <strong>
            Juegos Educativos
          </strong>

          <span>
            Aprende mientras juegas
          </span>

        </div>

      </div>


      <div class="top-actions">

        <button
          class="create-button top-create"
          @click="
            $router.push(
              '/juegos/crear'
            )
          "
        >

          <span>＋</span>

          Crear juego

        </button>


        <button
          class="profile-button"
          aria-label="Mi perfil"
          title="Mi perfil"
          @click="
            $router.push(
              '/perfil'
            )
          "
        >

          <AppIcon
            name="user"
            :size="20"
          />

        </button>

      </div>

    </header>


    <main>

      <!-- PRESENTACIÓN -->

      <section class="hero">

        <div class="hero-content">

          <span class="eyebrow">
            PLATAFORMA INTERACTIVA
          </span>


          <h1>
            ¿Qué quieres
            practicar hoy?
          </h1>


          <p>
            Elige una actividad,
            juega y aprende
            a tu propio ritmo.
          </p>


          <div class="hero-footer">

            <div class="hero-stat">

              <strong>
                {{ totalJuegos }}
              </strong>

              <span>
                juegos disponibles
              </span>

            </div>


            <div class="hero-stat">

              <strong>
                {{ categorias.length }}
              </strong>

              <span>
                categorías
              </span>

            </div>


            <button
              class="create-button hero-create"
              @click="
                $router.push(
                  '/juegos/crear'
                )
              "
            >

              ＋ Crear juego

            </button>

          </div>

        </div>

      </section>


      <div
        v-if="cargando"
        class="status-card"
      >
        Cargando juegos...
      </div>


      <div
        v-else-if="mensaje"
        class="status-card error"
      >
        {{ mensaje }}
      </div>


      <!-- CATEGORÍAS -->

      <div
        v-else
        class="categories"
      >

        <section
          v-for="
            categoria
            in categorias
          "
          :key="
            categoria.id
          "
          class="category"
        >

          <header
            class="category-header"
          >

            <div>

              <div
                class="category-title"
              >

                <span
                  class="category-line"
                ></span>


                <h2>
                  {{ categoria.titulo }}
                </h2>


                <span
                  class="count"
                >
                  {{
                    categoria
                      .juegos
                      .length
                  }}
                </span>

              </div>


              <p>
                {{
                  categoria.descripcion
                }}
              </p>

            </div>


            <div
              class="carousel-buttons"
            >

              <button
                type="button"
                aria-label="Anterior"
                @click="
                  desplazarCarrusel(
                    categoria.id,
                    -1
                  )
                "
              >
                ‹
              </button>


              <button
                type="button"
                aria-label="Siguiente"
                @click="
                  desplazarCarrusel(
                    categoria.id,
                    1
                  )
                "
              >
                ›
              </button>

            </div>

          </header>


          <div class="carousel-window">

            <div
              :ref="
                (element) => {

                  if (element) {

                    carruseles[
                      categoria.id
                    ] = element

                  }

                }
              "
              class="carousel"
            >

              <GameCard
                v-for="
                  juego
                  in categoria.juegos
                "

                :key="
                  juego.id_juego
                "

                :id="
                  juego.id_juego
                "

                :title="
                  juego.nombre
                "

                :description="
                  juego.descripcion
                "

                :icon="
                  obtenerIcono(
                    juego.tipo
                  )
                "

                :unit="
                  juego.unidad
                "

                :kind="
                  juego.tipo
                "

                :route="
                  rutaJuego(juego)
                "
              />

            </div>

          </div>

        </section>

      </div>

    </main>

  </div>

</template>


<style scoped>
.home {
  min-height: 100vh;

  padding:
    24px 22px 60px;

  background:
    transparent;
}


/* ==========================================================
   HEADER LIQUID GLASS
========================================================== */

.topbar {
  position: sticky;

  top: 14px;

  z-index: 20;

  width:
    min(1180px, 100%);

  min-height: 70px;

  margin:
    0 auto 28px;

  padding:
    12px 15px 12px 17px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.38
    );

  border-radius:
    24px;

  background:
    linear-gradient(
      135deg,
      rgba(
        29,
        53,
        72,
        0.82
      ),
      rgba(
        41,
        76,
        96,
        0.74
      ),
      rgba(
        62,
        105,
        122,
        0.62
      )
    );

  box-shadow:
    0 18px 40px
    rgba(
      15,
      23,
      42,
      0.14
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.25
    ),

    inset
    0 -1px 0
    rgba(
      255,
      255,
      255,
      0.08
    );

  backdrop-filter:
    blur(20px)
    saturate(125%);

  -webkit-backdrop-filter:
    blur(20px)
    saturate(125%);
}


.brand {
  display: flex;

  align-items: center;

  gap: 12px;
}


.brand-symbol {
  width: 46px;

  height: 46px;

  display: grid;

  place-items: center;

  border-radius: 15px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.30
    );

  background:
    rgba(
      255,
      255,
      255,
      0.10
    );

  color: white;

  box-shadow:
    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.15
    );
}


.brand strong,
.brand span {
  display: block;
}


.brand strong {
  color: white;

  font-size: 16px;
}


.brand span {
  margin-top: 3px;

  color:
    rgba(
      226,
      232,
      240,
      0.90
    );

  font-size: 13px;
}


.top-actions {
  display: flex;

  align-items: center;

  gap: 10px;
}


.create-button {
  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.28
    );

  border-radius: 14px;

  font-weight: 800;

  cursor: pointer;

  transition:
    transform
    0.16s ease,
    background
    0.16s ease;
}


.top-create {
  padding:
    11px 15px;

  color: white;

  background:
    rgba(
      255,
      255,
      255,
      0.10
    );
}


.top-create:hover {
  transform:
    translateY(-1px);

  background:
    rgba(
      255,
      255,
      255,
      0.18
    );
}


.profile-button {
  width: 44px;

  height: 44px;

  display: grid;

  place-items: center;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.28
    );

  border-radius: 14px;

  background:
    rgba(
      255,
      255,
      255,
      0.10
    );

  color: white;

  cursor: pointer;

  box-shadow:
    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.14
    );

  transition:
    background
    0.16s ease,
    transform
    0.16s ease;
}


.profile-button:hover {
  transform:
    translateY(-1px);

  background:
    rgba(
      255,
      255,
      255,
      0.18
    );
}


/* ==========================================================
   MAIN
========================================================== */

main {
  width: 100%;

  max-width: 1180px;

  min-width: 0;

  margin:
    0 auto;
}


main > * {
  min-width: 0;
}


/* ==========================================================
   HERO
========================================================== */

.hero {
  width: 100%;

  margin:
    0 auto 28px;

  padding:
    38px 38px 35px;

  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.64
    );

  border-radius: 31px;

  background:
    linear-gradient(
      145deg,
      rgba(
        255,
        255,
        255,
        0.72
      ),
      rgba(
        255,
        255,
        255,
        0.50
      )
    );

  box-shadow:
    0 20px 42px
    rgba(
      30,
      41,
      59,
      0.07
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.85
    );

  backdrop-filter:
    blur(17px)
    saturate(140%);

  -webkit-backdrop-filter:
    blur(17px)
    saturate(140%);
}


.hero-content {
  max-width: 700px;
}


.eyebrow {
  display: block;

  margin-bottom: 13px;

  color: #52758a;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.13em;
}


.hero h1 {
  max-width: 600px;

  margin: 0;

  color: #172554;

  font-size:
    clamp(
      35px,
      5vw,
      53px
    );

  line-height: 1.03;

  letter-spacing:
    -0.055em;
}


.hero p {
  margin:
    13px 0 0;

  color: #64748b;

  font-size: 16px;

  line-height: 1.6;
}


.hero-footer {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 12px;

  margin-top: 26px;
}


.hero-stat {
  min-width: 140px;

  padding:
    12px 15px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.68
    );

  border-radius: 17px;

  background:
    rgba(
      255,
      255,
      255,
      0.54
    );
}


.hero-stat strong,
.hero-stat span {
  display: block;
}


.hero-stat strong {
  color: #172554;

  font-size: 21px;
}


.hero-stat span {
  margin-top: 2px;

  color: #64748b;

  font-size: 12px;
}


.hero-create {
  display: none;

  padding:
    12px 16px;

  color: white;

  border-color: transparent;

  background:
    linear-gradient(
      135deg,
      #294c60,
      #3e697a
    );
}


/* ==========================================================
   CATEGORÍAS
========================================================== */

.categories {
  width: 100%;

  max-width: 1180px;

  min-width: 0;

  margin:
    0 auto;

  display: flex;

  flex-direction: column;

  gap: 26px;
}


.category {
  position: relative;

  width: 100%;

  max-width: 1180px;

  min-width: 0;

  margin:
    0 auto;

  padding:
    25px 24px 27px;

  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.66
    );

  border-radius: 29px;

  background:
    linear-gradient(
      145deg,
      rgba(
        255,
        255,
        255,
        0.68
      ),
      rgba(
        255,
        255,
        255,
        0.48
      )
    );

  box-shadow:
    0 18px 38px
    rgba(
      30,
      41,
      59,
      0.06
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.82
    );

  backdrop-filter:
    blur(15px)
    saturate(135%);

  -webkit-backdrop-filter:
    blur(15px)
    saturate(135%);
}


.category::before {
  content: '';

  position: absolute;

  top: 0;

  left: 12%;

  width: 46%;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(
        255,
        255,
        255,
        0.95
      ),
      transparent
    );

  pointer-events: none;
}


/* ==========================================================
   CABECERA CATEGORÍA
========================================================== */

.category-header {
  position: relative;

  z-index: 3;

  width: 100%;

  display: flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap: 18px;

  margin-bottom: 20px;
}


.category-header > div:first-child {
  min-width: 0;

  flex: 1;
}


.category-title {
  display: flex;

  align-items: center;

  gap: 10px;
}


.category-title h2 {
  margin: 0;

  color: #1e293b;

  font-size: 22px;

  letter-spacing:
    -0.035em;
}


.category-line {
  width: 4px;

  height: 26px;

  flex-shrink: 0;

  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #3e697a,
      #63a8b8
    );
}


.count {
  display: grid;

  place-items: center;

  min-width: 27px;

  height: 27px;

  padding:
    0 8px;

  flex-shrink: 0;

  border-radius: 999px;

  background:
    #eef5f7;

  color:
    #365d6e;

  font-size: 12px;

  font-weight: 900;
}


.category-header p {
  max-width: 650px;

  margin:
    8px 0 0 14px;

  color: #64748b;

  font-size: 14px;

  line-height: 1.5;
}


/* ==========================================================
   BOTONES DEL CARRUSEL
========================================================== */

.carousel-buttons {
  flex-shrink: 0;

  display: flex;

  gap: 8px;
}


.carousel-buttons button {
  width: 40px;

  height: 40px;

  display: grid;

  place-items: center;

  padding: 0;

  border:
    1px solid
    rgba(
      148,
      163,
      184,
      0.20
    );

  border-radius: 13px;

  background:
    rgba(
      255,
      255,
      255,
      0.66
    );

  color:
    #475569;

  font-size: 23px;

  line-height: 1;

  cursor: pointer;

  box-shadow:
    0 6px 14px
    rgba(
      30,
      41,
      59,
      0.04
    );

  backdrop-filter:
    blur(10px);

  -webkit-backdrop-filter:
    blur(10px);

  transition:
    transform
    0.16s ease,
    background
    0.16s ease,
    color
    0.16s ease,
    border-color
    0.16s ease;
}


.carousel-buttons button:hover {
  transform:
    translateY(-2px);

  color:
    #365d6e;

  border-color:
    rgba(
      62,
      105,
      122,
      0.30
    );

  background:
    #f4f8fa;
}


/* ==========================================================
   VENTANA DEL CARRUSEL
========================================================== */

.carousel-window {
  position: relative;

  width: 100%;

  max-width: 100%;

  min-width: 0;

  overflow: hidden;

  border-radius: 22px;
}


.carousel-window::after {
  content: '';

  position: absolute;

  z-index: 5;

  top: 0;

  right: 0;

  bottom: 0;

  width: 35px;

  pointer-events: none;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(
        248,
        250,
        255,
        0.75
      )
    );
}


/* ==========================================================
   CARRUSEL
========================================================== */

.carousel {
  width: 100%;

  max-width: 100%;

  min-width: 0;

  display: grid;

  grid-auto-flow: column;

  grid-auto-columns: 285px;

  gap: 18px;

  overflow-x: auto;

  overflow-y: hidden;

  padding:
    5px 3px 12px;

  scroll-behavior: smooth;

  scroll-snap-type:
    x proximity;

  scrollbar-width: none;

  overscroll-behavior-inline:
    contain;
}


.carousel > * {
  min-width: 0;

  scroll-snap-align:
    start;
}


.carousel::-webkit-scrollbar {
  display: none;
}


/* ==========================================================
   ESTADOS
========================================================== */

.status-card {
  padding: 20px;

  border-radius: 20px;

  background:
    rgba(
      255,
      255,
      255,
      0.62
    );

  text-align: center;
}


.status-card.error {
  color: #b91c1c;
}


/* ==========================================================
   RESPONSIVE
========================================================== */

@media (max-width: 760px) {

  .home {
    padding:
      14px 12px 40px;
  }


  .topbar {
    top: 8px;

    margin-bottom: 18px;

    border-radius: 20px;
  }


  .brand span {
    display: none;
  }


  .top-create {
    display: none;
  }


  .hero {
    padding:
      26px 22px;

    border-radius: 24px;
  }


  .hero h1 {
    font-size: 37px;
  }


  .hero-create {
    display: inline-flex;
  }


  .categories {
    gap: 19px;
  }


  .category {
    padding:
      19px 16px 21px;

    border-radius: 23px;
  }


  .category-header {
    gap: 12px;
  }


  .category-title h2 {
    font-size: 19px;
  }


  .category-header p {
    margin-left: 0;
  }


  .carousel-buttons {
    align-self: flex-end;
  }


  .carousel-buttons button {
    width: 36px;

    height: 36px;
  }


  .carousel {
    grid-auto-columns:
      min(
        260px,
        82vw
      );

    gap: 14px;
  }

}
</style>