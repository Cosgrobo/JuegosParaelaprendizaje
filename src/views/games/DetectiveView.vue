<template>
  <div class="detective-container">

    <BackToMenu />

    <!-- BARRA SUPERIOR -->
    <header class="detective-header">
      <div class="brand">
        <span class="icon">🕵️‍♂️</span>
        <span class="title">Detective Escolar</span>
      </div>
    </header>

    <!-- TÍTULO PRINCIPAL -->
    <div class="hero">
      <h1>🕵️‍♂️ Detective Escolar</h1>
      <p>
        Deduce el concepto oculto utilizando las pistas antes de agotar tus intentos.
      </p>
    </div>

    <!-- PANEL DE MÉTRICAS -->
    <div class="metrics-grid">

      <div class="metric-card">
        <div class="metric-label">Aciertos</div>
        <div class="metric-value">{{ hits }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Errores</div>
        <div class="metric-value">{{ errors }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Puntuación</div>
        <div class="metric-value">{{ totalScore }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Progreso</div>
        <div class="metric-value">{{ progressPercentage }}%</div>
      </div>

      <div class="metric-card col-span-mobile">
        <div class="metric-label">Tiempo</div>
        <div class="metric-value">{{ formattedTime }}</div>
      </div>

    </div>

    <!-- MENSAJE DE CARGA -->
    <div v-if="cargando" class="status-message">
      Cargando enigmas...
    </div>

    <!-- MENSAJE DE ERROR -->
    <div v-else-if="errorCarga" class="status-message error-message">
      {{ errorCarga }}
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <main v-else class="main-content">

      <!-- SELECCIÓN Y NAVEGACIÓN -->
      <div class="filter-bar">

        <div class="filter-group">
          <label>Materia:</label>

          <select
            v-model="selectedSubjectFilter"
            class="select-input"
          >
            <option value="ALL">
              Todas las Materias
            </option>

            <option
              v-for="subj in availableSubjects"
              :key="subj"
              :value="subj"
            >
              {{ subj }}
            </option>
          </select>
        </div>

        <div class="nav-group">

          <span>
            Caso {{ currentCaseIndex + 1 }}
            de {{ filteredEnigmas.length }}
          </span>

          <button
            @click="prevCase"
            :disabled="currentCaseIndex === 0"
            class="btn-icon"
          >
            ❮
          </button>

          <button
            @click="nextCase"
            :disabled="
              currentCaseIndex >= filteredEnigmas.length - 1
            "
            class="btn-icon"
          >
            ❯
          </button>

        </div>

      </div>

      <!-- EXPEDIENTE DEL CASO -->
      <div
        v-if="activeCase"
        class="case-card"
      >

        <div class="case-header">

          <div>
            <span class="badge">
              {{ activeCase.subject }}
            </span>

            <h2 class="case-title">
              {{ activeCase.title }}
            </h2>
          </div>

          <div class="lives-container">

            <div class="lives-label">
              Intentos restantes
            </div>

            <div class="hearts">
              <span
                v-for="n in 3"
                :key="n"
                :class="[
                  'heart',
                  n <= currentLives
                    ? 'active'
                    : 'empty'
                ]"
              >
                ❤️
              </span>
            </div>

          </div>

        </div>

        <!-- ESTADO RESUELTO -->
        <div
          v-if="isSolved(activeCase.id)"
          class="solved-banner"
        >

          <div class="solved-icon">
            ✓
          </div>

          <h3>
            ¡Expediente Resuelto!
          </h3>

          <p>
            Respuesta:
            <strong>
              {{ activeCase.answer }}
            </strong>

            (+{{ getSolvedPoints(activeCase.id) }} Pts)
          </p>

        </div>

        <!-- PISTAS Y DEDUCCIÓN -->
        <div
          v-else
          class="case-body"
        >

          <div class="clues-header">

            <h3>
              Pistas del Caso:
            </h3>

            <span>
              Recompensa:
              <strong>
                {{ currentRewardPoints }} Pts
              </strong>
            </span>

          </div>

          <div class="clues-list">

            <!-- PISTA 1 -->
            <div class="clue-box active">

              <div class="clue-title">
                🔍 Pista 1
                (Contextual - 100 Pts)
              </div>

              <p>
                "{{ activeCase.clues[0] }}"
              </p>

            </div>

            <!-- PISTA 2 -->
            <div
              :class="[
                'clue-box',
                clueLevel >= 2
                  ? 'active'
                  : 'locked'
              ]"
            >

              <div class="clue-title">

                {{ clueLevel >= 2 ? '🔑' : '🔒' }}

                Pista 2
                (Dato Clave - 60 Pts)

              </div>

              <p v-if="clueLevel >= 2">
                "{{ activeCase.clues[1] }}"
              </p>

              <p
                v-else
                class="placeholder"
              >
                Desbloquea esta pista si necesitas más información.
              </p>

            </div>

            <!-- PISTA 3 -->
            <div
              :class="[
                'clue-box',
                clueLevel >= 3
                  ? 'active'
                  : 'locked'
              ]"
            >

              <div class="clue-title">

                {{ clueLevel >= 3 ? '🔑' : '🔒' }}

                Pista 3
                (Muy Reveladora - 30 Pts)

              </div>

              <p v-if="clueLevel >= 3">
                "{{ activeCase.clues[2] }}"
              </p>

              <p
                v-else
                class="placeholder"
              >
                Pista final directa para deducir la respuesta.
              </p>

            </div>

          </div>

          <!-- PEDIR PISTA -->
          <div class="action-center">

            <button
              @click="requestMoreClue"
              :disabled="clueLevel >= 3"
              class="btn-secondary"
            >
              💡 Pedir otra pista (- Puntuación)
            </button>

          </div>

          <!-- RESPUESTA -->
          <form
            @submit.prevent="submitDeduction"
            class="deduction-form"
          >

            <label for="deduction">
              Escribe tu deducción / respuesta:
            </label>

            <div class="input-group">

              <input
                v-model="deductionInput"
                id="deduction"
                type="text"
                placeholder="Ej. Fotosintesis, ADN, Teorema de Pitagoras..."
                autocomplete="off"
              >

              <button
                type="submit"
                class="btn-primary"
              >
                Comprobar
              </button>

            </div>

          </form>

        </div>

      </div>

      <!-- SIN ENIGMAS -->
      <div
        v-else
        class="status-message"
      >
        No hay enigmas disponibles.
      </div>

    </main>

    <!-- REINICIAR -->
    <div class="footer-actions">

      <button
        @click="resetCurrentGame"
        class="btn-secondary"
      >
        🔄 Reiniciar Juego
      </button>

    </div>

    <!-- MODAL FEEDBACK -->
    <div
      v-if="showModal"
      class="modal-overlay"
    >

      <div class="modal-card">

        <div
          :class="[
            'modal-icon',
            modalSuccess
              ? 'success'
              : 'error'
          ]"
        >
          {{ modalSuccess ? '✓' : '✕' }}
        </div>

        <h3>
          {{
            modalSuccess
              ? '¡Correcto!'
              : 'Respuesta Incorrecta'
          }}
        </h3>

        <p>
          {{ modalMessage }}
        </p>

        <button
          @click="showModal = false"
          class="btn-primary block"
        >
          Continuar
        </button>

      </div>

    </div>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

import BackToMenu from '../../components/BackToMenu.vue'
import { guardarResultadoPartida } from '../../utils/guardarResultadoPartida.js'

const route = useRoute()
const idJuego = computed(() => Number(route.params.id || 6))


// ========================================
// DATOS GENERALES
// ========================================

const enigmas = ref([])

const cargando = ref(true)
const errorCarga = ref('')

const selectedSubjectFilter = ref('ALL')
const currentCaseIndex = ref(0)


// ========================================
// MÉTRICAS
// ========================================

const hits = ref(0)
const errors = ref(0)
const totalScore = ref(0)

const solvedMap = ref({})


// ========================================
// ESTADO DEL CASO ACTUAL
// ========================================

const clueLevel = ref(1)
const currentLives = ref(3)
const deductionInput = ref('')


// ========================================
// TEMPORIZADOR
// ========================================

const secondsElapsed = ref(0)
const horaInicio = ref(null)
const resultadoGuardado = ref(false)

let timerInterval = null


// ========================================
// MODAL
// ========================================

const showModal = ref(false)
const modalSuccess = ref(false)
const modalMessage = ref('')


// ========================================
// REINICIAR ESTADO DEL CASO
// ========================================

const resetCaseState = () => {
  clueLevel.value = 1
  currentLives.value = 3
  deductionInput.value = ''
}


// ========================================
// OBTENER ENIGMAS DESDE MYSQL
// ========================================

const obtenerEnigmas = async () => {
  try {
    cargando.value = true
    errorCarga.value = ''

    console.log('ID DEL JUEGO:', idJuego.value)

    if (!idJuego.value) {
      throw new Error(
        'No se recibió el ID del juego Detective'
      )
    }

    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${idJuego.value}/enigmas`
    )

    if (!respuesta.ok) {
      const datosError =
        await respuesta.json().catch(() => ({}))

      throw new Error(
        datosError.mensaje ||
        'No se pudieron obtener los enigmas'
      )
    }

    const datos = await respuesta.json()

    console.log(
      'ENIGMAS RECIBIDOS DE MYSQL:',
      datos
    )

    enigmas.value = datos.map(enigma => ({
      id: enigma.id_enigma,
      subject: enigma.materia,
      title: enigma.titulo,
      answer: enigma.respuesta,
      clues: [
        enigma.pista_1,
        enigma.pista_2,
        enigma.pista_3
      ]
    }))

    selectedSubjectFilter.value = 'ALL'
    currentCaseIndex.value = 0

    resetCaseState()

  } catch (error) {
    console.error(
      'ERROR AL CARGAR ENIGMAS:',
      error
    )

    errorCarga.value =
      error.message ||
      'No se pudieron cargar los enigmas.'

  } finally {
    cargando.value = false
  }
}


// ========================================
// TEMPORIZADOR
// ========================================

const startTimer = () => {

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  horaInicio.value = new Date()

  timerInterval = setInterval(() => {
    secondsElapsed.value++
  }, 1000)

}


const formattedTime = computed(() => {

  const mins = Math
    .floor(secondsElapsed.value / 60)
    .toString()
    .padStart(2, '0')

  const secs = (
    secondsElapsed.value % 60
  )
    .toString()
    .padStart(2, '0')

  return `${mins}:${secs}`

})


// ========================================
// MATERIAS DISPONIBLES
// ========================================

const availableSubjects = computed(() => [

  ...new Set(
    enigmas.value.map(
      enigma => enigma.subject
    )
  )

])


// ========================================
// FILTRAR ENIGMAS
// ========================================

const filteredEnigmas = computed(() => {

  if (
    selectedSubjectFilter.value === 'ALL'
  ) {

    return enigmas.value

  }

  return enigmas.value.filter(
    enigma =>
      enigma.subject ===
      selectedSubjectFilter.value
  )

})


// ========================================
// CASO ACTUAL
// ========================================

const activeCase = computed(() => {

  return (
    filteredEnigmas.value[
      currentCaseIndex.value
    ]
    || filteredEnigmas.value[0]
  )

})


// ========================================
// PROGRESO
// ========================================

const progressPercentage = computed(() => {

  if (enigmas.value.length === 0) {
    return 0
  }

  return Math.round(
    (
      hits.value /
      enigmas.value.length
    ) * 100
  )

})


// ========================================
// PUNTOS SEGÚN LA PISTA
// ========================================

const currentRewardPoints = computed(() => {

  if (clueLevel.value === 1) {
    return 100
  }

  if (clueLevel.value === 2) {
    return 60
  }

  return 30

})


// ========================================
// COMPROBAR SI YA SE RESOLVIÓ
// ========================================

const isSolved = (id) => {
  return !!solvedMap.value[id]
}


const getSolvedPoints = (id) => {
  return solvedMap.value[id] || 0
}


// ========================================
// PEDIR OTRA PISTA
// ========================================

const requestMoreClue = () => {

  if (clueLevel.value < 3) {
    clueLevel.value++
  }

}


// ========================================
// NORMALIZAR RESPUESTAS
// ========================================

const normalizeString = (str) => {

  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]/g,
      ''
    )

}


// ========================================
// COMPROBAR RESPUESTA
// ========================================

const submitDeduction = () => {

  if (
    !deductionInput.value.trim()
    || !activeCase.value
  ) {
    return
  }

  const respuestaUsuario =
    normalizeString(
      deductionInput.value
    )

  const respuestaCorrecta =
    normalizeString(
      activeCase.value.answer
    )


  // =====================================
  // RESPUESTA CORRECTA
  // =====================================

  if (
    respuestaUsuario ===
    respuestaCorrecta
  ) {

    // Evitar sumar dos veces
    if (isSolved(activeCase.value.id)) {
      return
    }

    const pts =
      currentRewardPoints.value

    solvedMap.value[
      activeCase.value.id
    ] = pts

    hits.value++

    totalScore.value += pts

    modalSuccess.value = true

    modalMessage.value =
      `¡Has deducido correctamente "${activeCase.value.answer}" sumando +${pts} Pts!`

    showModal.value = true

    deductionInput.value = ''

    if (
      hits.value === enigmas.value.length &&
      enigmas.value.length > 0 &&
      !resultadoGuardado.value
    ) {
      const horaFin = new Date()
      resultadoGuardado.value = true
      clearInterval(timerInterval)
      timerInterval = null

      void guardarResultadoPartida({
        idJuego: idJuego.value,
        horaInicio: horaInicio.value || horaFin,
        horaFin,
        tiempoTranscurrido: secondsElapsed.value,
        aciertos: hits.value,
        errores: errors.value,
        puntuacion: totalScore.value
      })
    }

  } else {

    // =====================================
    // RESPUESTA INCORRECTA
    // =====================================

    errors.value++

    currentLives.value--

    modalSuccess.value = false

    if (
      currentLives.value <= 0
    ) {

      currentLives.value = 0

      modalMessage.value =
        `Sin intentos restantes. La respuesta era "${activeCase.value.answer}".`

    } else {

      modalMessage.value =
        `Incorrecto. Te quedan ${currentLives.value} intento(s).`

    }

    showModal.value = true

  }

}


// ========================================
// NAVEGACIÓN ENTRE CASOS
// ========================================

const prevCase = () => {

  if (
    currentCaseIndex.value > 0
  ) {

    currentCaseIndex.value--

    resetCaseState()

  }

}


const nextCase = () => {

  if (
    currentCaseIndex.value <
    filteredEnigmas.value.length - 1
  ) {

    currentCaseIndex.value++

    resetCaseState()

  }

}


// ========================================
// REINICIAR JUEGO
// ========================================

const resetCurrentGame = () => {

  hits.value = 0
  errors.value = 0
  totalScore.value = 0

  solvedMap.value = {}

  secondsElapsed.value = 0
  resultadoGuardado.value = false

  currentCaseIndex.value = 0

  selectedSubjectFilter.value = 'ALL'

  resetCaseState()
  startTimer()

}


// ========================================
// CAMBIO DE MATERIA
// ========================================

watch(
  selectedSubjectFilter,

  () => {

    currentCaseIndex.value = 0

    resetCaseState()

  }
)


// ========================================
// SI CAMBIA EL ID DEL JUEGO
// ========================================

watch(
  () => route.params.id,

  async (nuevoId, anteriorId) => {

    if (
      nuevoId &&
      nuevoId !== anteriorId
    ) {

      hits.value = 0
      errors.value = 0
      totalScore.value = 0

      solvedMap.value = {}

      secondsElapsed.value = 0

      await obtenerEnigmas()

    }

  }
)


// ========================================
// AL ENTRAR AL JUEGO
// ========================================

onMounted(async () => {

  await obtenerEnigmas()

  startTimer()

})


// ========================================
// AL SALIR DEL JUEGO
// ========================================

onUnmounted(() => {

  if (timerInterval) {
    clearInterval(timerInterval)
  }

})

</script>


<style scoped>

.detective-container {
  max-width: 900px;
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


/* =========================
   HEADER
========================= */

.detective-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  padding-bottom: 16px;

  border-bottom:
    1px solid #e5e7eb;

  margin-bottom: 24px;

}


.brand {

  display: flex;

  align-items: center;

  gap: 8px;

  font-weight: 700;

  font-size: 1.25rem;

}


/* =========================
   HERO
========================= */

.hero {

  text-align: center;

  margin-bottom: 24px;

}


.hero h1 {

  font-size: 2rem;

  font-weight: 800;

  margin:
    0 0 8px 0;

}


.hero p {

  color: #6b7280;

  font-size: 0.9rem;

  margin: 0;

}


/* =========================
   MÉTRICAS
========================= */

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

  border:
    1px solid #e5e7eb;

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


/* =========================
   ESTADOS
========================= */

.status-message {

  background: #f9fafb;

  border:
    1px solid #e5e7eb;

  border-radius: 12px;

  padding: 16px;

  margin-bottom: 20px;

  text-align: center;

  color: #4b5563;

}


.error-message {

  background: #fef2f2;

  color: #b91c1c;

  border-color: #fecaca;

}


/* =========================
   FILTROS
========================= */

.filter-bar {

  display: flex;

  justify-content: space-between;

  align-items: center;

  background: #f9fafb;

  border:
    1px solid #e5e7eb;

  padding: 10px 16px;

  border-radius: 12px;

  margin-bottom: 20px;

}


.select-input {

  background: #fff;

  border:
    1px solid #d1d5db;

  border-radius: 8px;

  padding: 6px 10px;

  font-size: 0.85rem;

  margin-left: 8px;

}


.nav-group {

  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 0.85rem;

  font-weight: 600;

}


/* =========================
   TARJETA DEL CASO
========================= */

.case-card {

  background: #ffffff;

  border:
    1px solid #e5e7eb;

  border-radius: 16px;

  padding: 24px;

  box-shadow:
    0 4px 6px -1px
    rgba(0, 0, 0, 0.05);

}


.case-header {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  border-bottom:
    1px solid #f3f4f6;

  padding-bottom: 16px;

  margin-bottom: 20px;

}


.badge {

  background: #f3f4f6;

  color: #374151;

  font-size: 0.7rem;

  font-weight: 700;

  padding: 4px 8px;

  border-radius: 9999px;

  text-transform: uppercase;

}


.case-title {

  font-size: 1.5rem;

  font-weight: 700;

  margin:
    8px 0 0 0;

}


.lives-container {

  text-align: right;

}


.lives-label {

  font-size: 0.75rem;

  color: #6b7280;

  margin-bottom: 4px;

}


.hearts {

  display: flex;

  gap: 4px;

}


.heart.empty {

  opacity: 0.2;

}


/* =========================
   PISTAS
========================= */

.clues-header {

  display: flex;

  justify-content: space-between;

  font-size: 0.85rem;

  margin-bottom: 12px;

}


.clues-list {

  display: flex;

  flex-direction: column;

  gap: 12px;

  margin-bottom: 16px;

}


.clue-box {

  padding: 12px 16px;

  border-radius: 12px;

  font-size: 0.9rem;

  border:
    1px solid #e5e7eb;

}


.clue-box.active {

  background: #f9fafb;

}


.clue-box.locked {

  background: #fff;

  border-style: dashed;

  opacity: 0.6;

}


.clue-title {

  font-weight: 700;

  font-size: 0.8rem;

  margin-bottom: 4px;

}


.placeholder {

  color: #9ca3af;

  font-style: italic;

  margin: 0;

}


/* =========================
   FORMULARIO
========================= */

.action-center {

  text-align: center;

  margin-bottom: 20px;

}


.deduction-form {

  border-top:
    1px solid #f3f4f6;

  padding-top: 16px;

}


.deduction-form label {

  display: block;

  font-size: 0.8rem;

  font-weight: 700;

  text-transform: uppercase;

  margin-bottom: 8px;

}


.input-group {

  display: flex;

  gap: 8px;

}


.input-group input {

  flex: 1;

  padding: 10px 14px;

  border:
    1px solid #d1d5db;

  border-radius: 10px;

  font-size: 0.9rem;

}


/* =========================
   BOTONES
========================= */

.btn-primary {

  background: #111827;

  color: #fff;

  border: none;

  padding: 10px 18px;

  border-radius: 10px;

  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s;

}


.btn-primary:hover {

  background: #1f2937;

}


.btn-secondary {

  background: #f3f4f6;

  color: #111827;

  border:
    1px solid #e5e7eb;

  padding: 8px 14px;

  border-radius: 10px;

  font-weight: 600;

  cursor: pointer;

}


.btn-secondary:disabled {

  opacity: 0.4;

  cursor: not-allowed;

}


.btn-icon {

  background: #fff;

  border:
    1px solid #d1d5db;

  border-radius: 6px;

  padding: 4px 10px;

  cursor: pointer;

}


.btn-icon:disabled {

  opacity: 0.3;

}


.footer-actions {

  text-align: center;

  margin-top: 32px;

}


/* =========================
   RESUELTO
========================= */

.solved-banner {

  background: #ecfdf5;

  border:
    1px solid #a7f3d0;

  border-radius: 12px;

  padding: 20px;

  text-align: center;

  color: #065f46;

}


.solved-icon {

  font-size: 2rem;

  font-weight: bold;

}


/* =========================
   MODAL
========================= */

.modal-overlay {

  position: fixed;

  inset: 0;

  background:
    rgba(0, 0, 0, 0.4);

  backdrop-filter:
    blur(2px);

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 16px;

  z-index: 50;

}


.modal-card {

  background: #fff;

  border-radius: 16px;

  padding: 24px;

  width: 100%;

  max-width: 360px;

  text-align: center;

  box-shadow:
    0 10px 25px -5px
    rgba(0, 0, 0, 0.1);

}


.modal-icon {

  width: 48px;

  height: 48px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  margin:
    0 auto 12px auto;

  font-weight: bold;

  font-size: 1.25rem;

}


.modal-icon.success {

  background: #ecfdf5;

  color: #059669;

}


.modal-icon.error {

  background: #fef2f2;

  color: #dc2626;

}


.block {

  width: 100%;

  margin-top: 16px;

}


/* =========================
   RESPONSIVE
========================= */

@media (
  max-width: 650px
) {

  .filter-bar {

    flex-direction: column;

    align-items: stretch;

    gap: 12px;

  }


  .filter-group {

    display: flex;

    flex-direction: column;

    gap: 6px;

  }


  .select-input {

    margin-left: 0;

  }


  .nav-group {

    justify-content:
      space-between;

  }


  .case-header {

    flex-direction: column;

    gap: 16px;

  }


  .lives-container {

    text-align: left;

  }


  .input-group {

    flex-direction: column;

  }


  .clues-header {

    flex-direction: column;

    gap: 4px;

  }

}

</style>
