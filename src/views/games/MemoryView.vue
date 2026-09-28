<template>

  <div class="memory-container">
<BackToMenu />
    <!-- BARRA SUPERIOR Y CONMUTADOR DE ROL -->
    <header class="memory-header">
      <div class="brand">
        <span class="icon">🧠</span>
        <span class="title">MemoTIC</span>
      </div>

      
    </header>

    <!-- TÍTULO PRINCIPAL -->
    <div class="hero">
      <h1>🧠 MemoTIC - Memorama Educativo</h1>

      <p>
        Encuentra las parejas asociando cada concepto de TICs
        con su definición correspondiente.
      </p>
    </div>

    <!-- PANEL DE MÉTRICAS -->
    <div class="metrics-grid">

      <div class="metric-card">
        <div class="metric-label">Puntos</div>
        <div class="metric-value">{{ puntos }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Intentos</div>
        <div class="metric-value">{{ intentos }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Parejas</div>

        <div class="metric-value">
          {{ parejas }} / {{ conceptos.length }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Progreso</div>

        <div class="metric-value">
          {{ progressPercentage }}%
        </div>
      </div>

      <div class="metric-card col-span-mobile">
        <div class="metric-label">Tiempo</div>
        <div class="metric-value">{{ formattedTime }}</div>
      </div>

    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">

      <!-- CARGANDO -->
      <div v-if="cargando" class="status-banner">
        <p>Cargando parejas desde la base de datos...</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="errorCarga" class="status-banner error-banner">
        <p>{{ errorCarga }}</p>
      </div>

      <template v-else>

        <!-- VISTA ESTUDIANTE -->
        <transition name="fade" mode="out-in">

          <div v-if="!isTeacher">

            <!-- MENSAJE -->
            <div class="status-banner">
              <p>{{ mensajeEstado }}</p>
            </div>

            <!-- SIN DATOS -->
            <div
              v-if="conceptos.length === 0"
              class="status-banner"
            >
              <p>
                No existen parejas registradas para este juego.
              </p>
            </div>

            <!-- TABLERO -->
            <div v-else class="tablero">

              <div
                v-for="carta in cartas"
                :key="carta.uid"
                class="carta"
                :class="{
                  volteada: carta.volteada,
                  encontrada: carta.encontrada,
                  inactiva: carta.encontrada
                }"
                @click="seleccionarCarta(carta)"
              >

                <div class="interior">

                  <div class="frente">
                    ❓
                  </div>

                  <div
                    class="reverso"
                    :class="{
                      'es-concepto':
                        carta.tipo === 'concepto'
                    }"
                  >

                    <span class="tipo-badge">
                      {{
                        carta.tipo === 'concepto'
                          ? 'Concepto'
                          : 'Definición'
                      }}
                    </span>

                    <p class="texto-carta">
                      {{ carta.texto }}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </transition>


      </template>

    </main>

    <!-- REINICIAR -->
    <div class="footer-actions">

      <button
        @click="reiniciarJuego"
        class="btn-secondary"
      >
        🔄 Nuevo Juego
      </button>

    </div>



  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  onUnmounted
} from 'vue'
import BackToMenu from '../../components/BackToMenu.vue'

// ========================================
// API DEL MEMORAMA
// ========================================

const API_URL =
  'http://localhost:3000/api/juegos/4/memorama'


// ========================================
// DATOS
// ========================================

// IMPORTANTE:
// Ya no existen conceptos escritos manualmente.
// Todo se obtiene de MySQL.

const conceptos = ref([])

const cargando = ref(true)

const errorCarga = ref('')


// ========================================
// ESTADO GENERAL
// ========================================



const cartas = ref([])

const primeraCarta = ref(null)

const segundaCarta = ref(null)

const bloqueado = ref(false)


// ========================================
// MÉTRICAS
// ========================================

const puntos = ref(0)

const intentos = ref(0)

const parejas = ref(0)

const segundos = ref(0)

let intervalo = null

const juegoIniciado = ref(false)

const mensajeEstado = ref(
  'Encuentra cada concepto con su definición.'
)


// ========================================
// MODAL
// ========================================

const showAddModal = ref(false)

const newForm = ref({
  nombre: '',
  definicion: ''
})


// ========================================
// CARGAR PAREJAS DESDE MYSQL
// ========================================

const fetchConceptos = async () => {

  try {

    cargando.value = true

    errorCarga.value = ''

    const res = await fetch(API_URL)

    if (!res.ok) {

      throw new Error(
        'No se pudieron obtener las parejas'
      )

    }

    const data = await res.json()

    // ====================================
    // CONVERSIÓN
    //
    // MySQL:
    // id_pareja
    // elemento_1
    // elemento_2
    //
    // Vue:
    // id
    // nombre
    // definicion
    // ====================================

    conceptos.value = data.map(item => ({

      id: item.id_pareja,

      nombre: item.elemento_1,

      definicion: item.elemento_2

    }))

    console.log(
      'Parejas cargadas desde MySQL:',
      conceptos.value
    )

    reiniciarJuego()

  } catch (error) {

    console.error(
      'Error cargando el memorama:',
      error
    )

    conceptos.value = []

    errorCarga.value =
      'No se pudieron cargar las parejas del memorama.'

  } finally {

    cargando.value = false

  }

}


// ========================================
// MEZCLAR CARTAS
// ========================================

const mezclar = (array) => {

  const copia = [...array]

  for (
    let i = copia.length - 1;
    i > 0;
    i--
  ) {

    const j = Math.floor(
      Math.random() * (i + 1)
    )

    const temporal = copia[i]

    copia[i] = copia[j]

    copia[j] = temporal

  }

  return copia
}


// ========================================
// CREAR CARTAS
// ========================================

const crearCartas = () => {

  const conceptosCartas =
    conceptos.value.map(item => ({

      uid: `concepto-${item.id}`,

      id: item.id,

      tipo: 'concepto',

      texto: item.nombre,

      volteada: false,

      encontrada: false

    }))


  const definicionesCartas =
    conceptos.value.map(item => ({

      uid: `definicion-${item.id}`,

      id: item.id,

      tipo: 'definicion',

      texto: item.definicion,

      volteada: false,

      encontrada: false

    }))


  cartas.value = mezclar([
    ...conceptosCartas,
    ...definicionesCartas
  ])

}


// ========================================
// TEMPORIZADOR
// ========================================

const iniciarTemporizador = () => {

  if (intervalo) {
    return
  }

  intervalo = setInterval(() => {

    segundos.value++

  }, 1000)

}


const formattedTime = computed(() => {

  const mins = Math
    .floor(segundos.value / 60)
    .toString()
    .padStart(2, '0')

  const secs = (
    segundos.value % 60
  )
    .toString()
    .padStart(2, '0')

  return `${mins}:${secs}`

})


// ========================================
// PROGRESO
// ========================================

const progressPercentage = computed(() => {

  if (conceptos.value.length === 0) {
    return 0
  }

  return Math.round(
    (
      parejas.value /
      conceptos.value.length
    ) * 100
  )

})


// ========================================
// SELECCIONAR CARTA
// ========================================

const seleccionarCarta = (carta) => {

  if (
    bloqueado.value ||
    carta.volteada ||
    carta.encontrada
  ) {

    return

  }


  // Iniciar reloj con la primera jugada

  if (!juegoIniciado.value) {

    juegoIniciado.value = true

    iniciarTemporizador()

  }


  carta.volteada = true


  // Primera carta

  if (!primeraCarta.value) {

    primeraCarta.value = carta

    return

  }


  // Segunda carta

  segundaCarta.value = carta

  intentos.value++

  comprobarPareja()

}


// ========================================
// COMPROBAR PAREJA
// ========================================

const comprobarPareja = () => {

  const c1 = primeraCarta.value

  const c2 = segundaCarta.value


  if (!c1 || !c2) {
    return
  }


  const mismaPareja =

    c1.id === c2.id &&

    c1.tipo !== c2.tipo


  bloqueado.value = true


  // ======================================
  // CORRECTA
  // ======================================

  if (mismaPareja) {

    puntos.value += 100

    parejas.value++


    c1.encontrada = true

    c2.encontrada = true


    mensajeEstado.value =
      '¡Correcto! Encontraste una pareja. 🎉'


    limpiarSeleccion()


    // ¿Terminó el juego?

    if (
      parejas.value ===
      conceptos.value.length
    ) {

      if (intervalo) {

        clearInterval(intervalo)

        intervalo = null

      }


      mensajeEstado.value =
        `🏆 ¡Felicidades! Completaste MemoTIC en ${formattedTime.value} con ${puntos.value} puntos.`

    }

  }

  // ======================================
  // INCORRECTA
  // ======================================

  else {

    puntos.value =
      Math.max(
        0,
        puntos.value - 10
      )


    mensajeEstado.value =
      'No coinciden. Intenta de nuevo. 🤔'


    setTimeout(() => {

      c1.volteada = false

      c2.volteada = false

      limpiarSeleccion()

    }, 850)

  }

}


// ========================================
// LIMPIAR SELECCIÓN
// ========================================

const limpiarSeleccion = () => {

  primeraCarta.value = null

  segundaCarta.value = null

  bloqueado.value = false

}


// ========================================
// REINICIAR JUEGO
// ========================================

const reiniciarJuego = () => {

  if (intervalo) {

    clearInterval(intervalo)

  }

  intervalo = null


  puntos.value = 0

  intentos.value = 0

  parejas.value = 0

  segundos.value = 0


  primeraCarta.value = null

  segundaCarta.value = null

  bloqueado.value = false


  juegoIniciado.value = false


  mensajeEstado.value =
    'Encuentra cada concepto con su definición.'


  crearCartas()

}





// ========================================
// AGREGAR LOCALMENTE
// ========================================
//
// Por ahora NO guarda en MySQL.
// Lo conectaremos cuando hagamos POST.
// ========================================

const saveNewConcepto = () => {

  const nuevoId =
    `local-${Date.now()}`


  conceptos.value.push({

    id: nuevoId,

    nombre:
      newForm.value.nombre.trim(),

    definicion:
      newForm.value.definicion.trim()

  })


  newForm.value = {

    nombre: '',

    definicion: ''

  }


  showAddModal.value = false


  reiniciarJuego()

}


// ========================================
// ELIMINAR LOCALMENTE
// ========================================
//
// Tampoco elimina todavía de MySQL.
// ========================================

const deleteConcepto = (item) => {

  conceptos.value =
    conceptos.value.filter(
      concepto =>
        concepto.id !== item.id
    )


  reiniciarJuego()

}


// ========================================
// TABLA DE PUNTUACIONES
// ========================================

const leaderboard = ref([

  {
    name: 'Estudiante Actual',

    score: computed(
      () => puntos.value
    ),

    time: computed(
      () => formattedTime.value
    )
  },

  {
    name: 'Agente Lucía',

    score: 800,

    time: '01:20'
  },

  {
    name: 'Inspector Carlos',

    score: 750,

    time: '01:45'
  }

])


// ========================================
// AL CARGAR LA VISTA
// ========================================

onMounted(() => {

  fetchConceptos()

})


// ========================================
// AL SALIR
// ========================================

onUnmounted(() => {

  if (intervalo) {

    clearInterval(intervalo)

  }

})

</script>


<style scoped>

.memory-container {
  max-width: 950px;
  margin: 0 auto;
  padding: 24px 16px;

  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;

  color: #111827;
}


/* ========================================
   HEADER
======================================== */

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-bottom: 16px;

  border-bottom: 1px solid #e5e7eb;

  margin-bottom: 24px;
}


.brand {
  display: flex;
  align-items: center;

  gap: 8px;

  font-weight: 700;

  font-size: 1.25rem;
}


/* ========================================
   HERO
======================================== */

.hero {
  text-align: center;

  margin-bottom: 24px;
}


.hero h1 {
  font-size: 2rem;

  font-weight: 800;

  margin: 0 0 8px 0;
}


.hero p {
  color: #6b7280;

  font-size: 0.9rem;

  margin: 0;
}


/* ========================================
   MÉTRICAS
======================================== */

.metrics-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(120px, 1fr)
    );

  gap: 12px;

  margin-bottom: 24px;
}


.metric-card {
  background: #f9fafb;

  border: 1px solid #e5e7eb;

  border-radius: 12px;

  padding: 12px;

  text-align: center;
}


.metric-label {
  font-size: 0.75rem;

  font-weight: 600;

  color: #4b5563;
}


.metric-value {
  font-size: 1.5rem;

  font-weight: 800;

  margin-top: 4px;
}


/* ========================================
   MENSAJE DE ESTADO
======================================== */

.status-banner {
  background: #f3f4f6;

  border: 1px solid #e5e7eb;

  border-radius: 12px;

  padding: 12px;

  text-align: center;

  font-weight: 700;

  font-size: 1rem;

  margin-bottom: 20px;

  color: #111827;
}


.error-banner {
  color: #b91c1c;

  background: #fef2f2;

  border-color: #fecaca;
}


/* ========================================
   TABLERO
======================================== */

.tablero {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 14px;

  margin-bottom: 24px;
}


/* ========================================
   CARTAS
======================================== */

.carta {
  height: 145px;

  perspective: 1000px;

  cursor: pointer;
}


.carta.inactiva {
  cursor: default;
}


.interior {
  position: relative;

  width: 100%;

  height: 100%;

  transition: transform 0.45s;

  transform-style: preserve-3d;
}


.carta.volteada .interior,
.carta.encontrada .interior {

  transform: rotateY(180deg);

}


.frente,
.reverso {

  position: absolute;

  width: 100%;

  height: 100%;

  border-radius: 14px;

  backface-visibility: hidden;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;

  padding: 12px;

  box-sizing: border-box;

  box-shadow:
    0 4px 6px -1px
    rgba(0, 0, 0, 0.05);
}


.frente {

  background: #111827;

  color: white;

  font-size: 2rem;

  border: 1px solid #1f2937;

}


.reverso {

  background: #ffffff;

  color: #111827;

  transform: rotateY(180deg);

  border: 2px solid #3b82f6;

}


.reverso.es-concepto {

  border-color: #8b5cf6;

}


.tipo-badge {

  font-size: 0.65rem;

  font-weight: 800;

  text-transform: uppercase;

  background: #f3f4f6;

  color: #4b5563;

  padding: 2px 6px;

  border-radius: 4px;

  margin-bottom: 6px;
}


.texto-carta {

  font-size: 0.85rem;

  font-weight: 600;

  margin: 0;

  line-height: 1.25;
}


.carta.encontrada .reverso {

  border-color: #10b981;

  background: #ecfdf5;

}


/* ========================================
   BOTONES
======================================== */

.btn-primary {

  background: #111827;

  color: #fff;

  border: none;

  padding: 10px 18px;

  border-radius: 10px;

  font-weight: 600;

  cursor: pointer;
}


.btn-secondary {

  background: #f3f4f6;

  color: #111827;

  border: 1px solid #e5e7eb;

  padding: 8px 14px;

  border-radius: 10px;

  font-weight: 600;

  cursor: pointer;
}


.footer-actions {

  text-align: center;

  margin-top: 32px;
}


/* ========================================
   PANEL MAESTRO
======================================== */

.case-card {

  background: #ffffff;

  border: 1px solid #e5e7eb;

  border-radius: 16px;

  padding: 24px;

  box-shadow:
    0 4px 6px -1px
    rgba(0, 0, 0, 0.05);
}


.panel-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 20px;

  gap: 16px;
}


.data-table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 12px;

  font-size: 0.85rem;
}


.data-table th,
.data-table td {

  padding: 10px;

  border-bottom:
    1px solid #e5e7eb;

  text-align: left;
}


.text-right {

  text-align: right !important;

}


.conceptos-list-section {

  margin-top: 28px;

}


.conceptos-grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px, 1fr)
    );

  gap: 12px;

  margin-top: 12px;
}


.concepto-card {

  background: #f9fafb;

  border: 1px solid #e5e7eb;

  padding: 12px;

  border-radius: 10px;

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 10px;
}


.def-text {

  font-size: 0.8rem;

  color: #4b5563;

  margin-top: 4px;
}


.badge {

  background: #e5e7eb;

  color: #111827;

  font-size: 0.75rem;

  font-weight: 700;

  padding: 2px 8px;

  border-radius: 6px;
}


.btn-danger {

  background: none;

  border: none;

  cursor: pointer;
}


/* ========================================
   MODAL
======================================== */

.modal-overlay {

  position: fixed;

  inset: 0;

  background:
    rgba(0, 0, 0, 0.4);

  backdrop-filter: blur(2px);

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 16px;

  z-index: 50;
}


.modal-card.large {

  background: #fff;

  border-radius: 16px;

  padding: 24px;

  width: 100%;

  max-width: 500px;
}


.modal-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 16px;
}


.btn-close {

  background: none;

  border: none;

  font-size: 1.2rem;

  cursor: pointer;
}


.form-grid {

  display: flex;

  flex-direction: column;

  gap: 12px;
}


.form-group {

  display: flex;

  flex-direction: column;

  gap: 4px;
}


.form-group label {

  font-size: 0.8rem;

  font-weight: 700;
}


.form-group input,
.form-group textarea {

  padding: 8px 12px;

  border:
    1px solid #d1d5db;

  border-radius: 8px;

  font-size: 0.9rem;
}


.form-actions {

  display: flex;

  justify-content: flex-end;

  gap: 8px;

  margin-top: 12px;
}


/* ========================================
   RESPONSIVE
======================================== */

@media (max-width: 700px) {

  .tablero {

    grid-template-columns:
      repeat(2, 1fr);

  }


  .panel-header {

    flex-direction: column;

    align-items: stretch;

  }

}


.fade-enter-active,
.fade-leave-active {

  transition:
    opacity 0.2s ease;

}


.fade-enter-from,
.fade-leave-to {

  opacity: 0;

}

</style>

