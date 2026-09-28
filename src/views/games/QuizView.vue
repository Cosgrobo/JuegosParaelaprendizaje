<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToMenu from '../../components/BackToMenu.vue'
import { guardarResultadoPartida } from '../../utils/guardarResultadoPartida.js'

const router = useRouter()
const route = useRoute()
const idJuego = computed(() => Number(route.params.id || 5))

// ===============================
// PREGUNTAS
// Después estas vendrán desde MySQL
// ===============================

const preguntas = ref([])
const nombreJuego = ref('')
const cargando = ref(true)
const errorCarga = ref('')

const obtenerPreguntas = async () => {
  try {
    cargando.value = true
    errorCarga.value = ''

    const [respuestaJuego, respuestaPreguntas] = await Promise.all([
      fetch(`http://localhost:3000/api/juegos/${idJuego.value}`),
      fetch(`http://localhost:3000/api/juegos/${idJuego.value}/preguntas`)
    ])

    if (!respuestaJuego.ok || !respuestaPreguntas.ok) {
      throw new Error('No se pudieron obtener los datos del Quiz')
    }

    const [datosJuego, datosPreguntas] = await Promise.all([
      respuestaJuego.json(),
      respuestaPreguntas.json()
    ])

    nombreJuego.value = datosJuego.nombre
    preguntas.value = datosPreguntas

  } catch (error) {
    console.error('Error al cargar preguntas:', error)

    errorCarga.value =
      'No se pudieron cargar las preguntas.'

  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  obtenerPreguntas()
})
// ===============================
// ESTADO DEL JUEGO
// ===============================

const preguntaActual = ref(0)
const respuestaSeleccionada = ref('')
const respondida = ref(false)

const aciertos = ref(0)
const errores = ref(0)
const puntuacion = ref(0)

const juegoTerminado = ref(false)
const horaInicio = ref(null)
const resultadoGuardado = ref(false)

// ===============================
// PREGUNTA ACTUAL
// ===============================

const pregunta = computed(() => {
  return preguntas.value[preguntaActual.value]
})

// ===============================
// OPCIONES
// ===============================

const opciones = computed(() => {
  if (!pregunta.value) return []

  return [
    {
      letra: 'A',
      texto: pregunta.value.opcion_a
    },
    {
      letra: 'B',
      texto: pregunta.value.opcion_b
    },
    {
      letra: 'C',
      texto: pregunta.value.opcion_c
    },
    {
      letra: 'D',
      texto: pregunta.value.opcion_d
    }
  ]
})

// ===============================
// PROGRESO
// ===============================

const progreso = computed(() => {
  if (preguntas.value.length === 0) return 0

  return (
    ((preguntaActual.value + 1) / preguntas.value.length) *
    100
  )
})

// ===============================
// RESPONDER
// ===============================

const seleccionarRespuesta = (letra) => {
  if (respondida.value) return

  if (!horaInicio.value) {
    horaInicio.value = new Date()
  }

  respuestaSeleccionada.value = letra
  respondida.value = true

  if (letra === pregunta.value.respuesta_correcta) {
    aciertos.value++
    puntuacion.value += 100
  } else {
    errores.value++
  }
}

// ===============================
// COLOR / ESTADO DE RESPUESTA
// ===============================

const claseOpcion = (letra) => {
  if (!respondida.value) {
    return ''
  }

  // Respuesta correcta
  if (letra === pregunta.value.respuesta_correcta) {
    return 'correcta'
  }

  // Respuesta incorrecta seleccionada
  if (
    letra === respuestaSeleccionada.value &&
    letra !== pregunta.value.respuesta_correcta
  ) {
    return 'incorrecta'
  }

  return 'deshabilitada'
}

// ===============================
// SIGUIENTE PREGUNTA
// ===============================

const siguientePregunta = () => {
  if (preguntaActual.value < preguntas.value.length - 1) {

    preguntaActual.value++

    respuestaSeleccionada.value = ''
    respondida.value = false

  } else {
    juegoTerminado.value = true

    if (!resultadoGuardado.value) {
      const horaFin = new Date()
      const inicio = horaInicio.value || horaFin

      resultadoGuardado.value = true
      void guardarResultadoPartida({
        idJuego: idJuego.value,
        horaInicio: inicio,
        horaFin,
        tiempoTranscurrido: Math.floor((horaFin - inicio) / 1000),
        aciertos: aciertos.value,
        errores: errores.value,
        puntuacion: puntuacion.value
      })
    }
  }
}

// ===============================
// REINICIAR
// ===============================

const reiniciarJuego = () => {
  preguntaActual.value = 0
  respuestaSeleccionada.value = ''
  respondida.value = false

  aciertos.value = 0
  errores.value = 0
  puntuacion.value = 0

  juegoTerminado.value = false
  horaInicio.value = null
  resultadoGuardado.value = false
}

// ===============================
// REGRESAR AL HOME
// ===============================

const regresar = () => {
  router.push('/home')
}
</script>


<template>

  <div class="quiz-page">

    <BackToMenu />

    <!-- ================================= -->
    <!-- JUEGO -->
    <!-- ================================= -->
<p v-if="cargando">
  Cargando preguntas...
</p>

<p v-else-if="errorCarga">
  {{ errorCarga }}
</p>
    <div
      v-if="!juegoTerminado"
      class="quiz-container"
    >

      <header class="quiz-header">

        <button
          class="back-button"
          @click="regresar"
        >
          ← Volver
        </button>

        <div>
          <h1>❓ {{ nombreJuego || 'Quiz TIC' }}</h1>
          <p>
            Pon a prueba tus conocimientos
          </p>
        </div>

        <div class="score">
          ⭐ {{ puntuacion }}
        </div>

      </header>


      <!-- INFORMACIÓN -->

      <section class="info">

        <span>
          Pregunta
          {{ preguntaActual + 1 }}
          de
          {{ preguntas.length }}
        </span>

        <span>
          ✅ {{ aciertos }}
          &nbsp;
          ❌ {{ errores }}
        </span>

      </section>


      <!-- PROGRESO -->

      <div class="progress-container">

        <div
          class="progress-bar"
          :style="{ width: progreso + '%' }"
        ></div>

      </div>


      <!-- PREGUNTA -->

      <main
        v-if="pregunta"
        class="question-card"
      >

        <div class="question-number">
          Pregunta {{ preguntaActual + 1 }}
        </div>

        <h2>
          {{ pregunta.pregunta }}
        </h2>


        <!-- OPCIONES -->

        <div class="options">

          <button
            v-for="opcion in opciones"
            :key="opcion.letra"
            class="option"
            :class="claseOpcion(opcion.letra)"
            :disabled="respondida"
            @click="seleccionarRespuesta(opcion.letra)"
          >

            <span class="letter">
              {{ opcion.letra }}
            </span>

            <span>
              {{ opcion.texto }}
            </span>

          </button>

        </div>


        <!-- RESULTADO DE LA RESPUESTA -->

        <div
          v-if="respondida"
          class="answer-result"
        >

          <p
            v-if="
              respuestaSeleccionada ===
              pregunta.respuesta_correcta
            "
            class="correct-text"
          >
            🎉 ¡Respuesta correcta! +100 puntos
          </p>

          <p
            v-else
            class="incorrect-text"
          >
            ❌ Respuesta incorrecta
          </p>


          <button
            class="next-button"
            @click="siguientePregunta"
          >

            {{
              preguntaActual === preguntas.length - 1
                ? 'Ver resultados'
                : 'Siguiente pregunta →'
            }}

          </button>

        </div>

      </main>

    </div>


    <!-- ================================= -->
    <!-- RESULTADOS -->
    <!-- ================================= -->

    <div
      v-else
      class="result-container"
    >

      <div class="result-card">

        <div class="trophy">
          🏆
        </div>

        <h1>
          ¡Quiz terminado!
        </h1>

        <p class="result-message">
          Estos son tus resultados
        </p>


        <div class="final-score">

          <span>Puntuación</span>

          <strong>
            {{ puntuacion }}
          </strong>

          <span>
            puntos
          </span>

        </div>


        <div class="stats">

          <div class="stat correct-stat">

            <strong>
              {{ aciertos }}
            </strong>

            <span>
              Aciertos
            </span>

          </div>


          <div class="stat incorrect-stat">

            <strong>
              {{ errores }}
            </strong>

            <span>
              Errores
            </span>

          </div>


          <div class="stat">

            <strong>
              {{ preguntas.length }}
            </strong>

            <span>
              Preguntas
            </span>

          </div>

        </div>


        <div class="result-buttons">

          <button
            class="restart-button"
            @click="reiniciarJuego"
          >
            🔄 Jugar otra vez
          </button>

          <button
            class="home-button"
            @click="regresar"
          >
            🏠 Volver al inicio
          </button>

        </div>

      </div>

    </div>

  </div>

</template>


<style scoped>

/* =========================
   GENERAL
========================= */

.quiz-page {
  min-height: 100vh;
  background: #f1f5f9;
  padding: 30px;
  font-family: Arial, sans-serif;
}

.quiz-container {
  max-width: 900px;
  margin: 0 auto;
}


/* =========================
   HEADER
========================= */

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: white;

  padding: 20px 25px;

  border-radius: 15px;

  margin-bottom: 20px;

  box-shadow:
    0 4px 12px
    rgba(0, 0, 0, 0.08);
}

.quiz-header h1 {
  margin: 0;

  color: #1e3a5f;
}

.quiz-header p {
  margin: 5px 0 0;

  color: #64748b;
}

.back-button {
  border: none;

  background: #e2e8f0;

  padding: 10px 15px;

  border-radius: 8px;

  cursor: pointer;
}

.back-button:hover {
  background: #cbd5e1;
}

.score {
  font-size: 20px;

  font-weight: bold;

  color: #f59e0b;
}


/* =========================
   INFORMACIÓN
========================= */

.info {
  display: flex;

  justify-content: space-between;

  margin-bottom: 10px;

  color: #475569;

  font-weight: bold;
}


/* =========================
   PROGRESO
========================= */

.progress-container {
  width: 100%;

  height: 10px;

  background: #cbd5e1;

  border-radius: 10px;

  overflow: hidden;

  margin-bottom: 25px;
}

.progress-bar {
  height: 100%;

  background: #2563eb;

  transition: width 0.3s ease;
}


/* =========================
   TARJETA PREGUNTA
========================= */

.question-card {
  background: white;

  padding: 35px;

  border-radius: 16px;

  box-shadow:
    0 5px 18px
    rgba(0, 0, 0, 0.08);
}

.question-number {
  color: #2563eb;

  font-weight: bold;

  margin-bottom: 10px;
}

.question-card h2 {
  color: #1e293b;

  margin-bottom: 30px;

  line-height: 1.4;
}


/* =========================
   OPCIONES
========================= */

.options {
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 15px;
}

.option {
  display: flex;

  align-items: center;

  gap: 15px;

  text-align: left;

  padding: 17px;

  border: 2px solid #e2e8f0;

  border-radius: 10px;

  background: white;

  font-size: 16px;

  cursor: pointer;

  transition: 0.2s;
}

.option:hover:not(:disabled) {
  border-color: #2563eb;

  background: #eff6ff;

  transform: translateY(-2px);
}

.letter {
  display: flex;

  align-items: center;

  justify-content: center;

  min-width: 35px;
  height: 35px;

  border-radius: 50%;

  background: #e2e8f0;

  font-weight: bold;
}

.option.correcta {
  background: #dcfce7;

  border-color: #22c55e;

  color: #166534;
}

.option.incorrecta {
  background: #fee2e2;

  border-color: #ef4444;

  color: #991b1b;
}

.option.deshabilitada {
  opacity: 0.6;
}


/* =========================
   RESPUESTA
========================= */

.answer-result {
  margin-top: 30px;

  padding-top: 20px;

  border-top: 1px solid #e2e8f0;

  display: flex;

  justify-content: space-between;

  align-items: center;
}

.correct-text {
  color: #16a34a;

  font-weight: bold;
}

.incorrect-text {
  color: #dc2626;

  font-weight: bold;
}

.next-button {
  border: none;

  background: #2563eb;

  color: white;

  padding: 12px 20px;

  border-radius: 8px;

  cursor: pointer;

  font-weight: bold;
}

.next-button:hover {
  background: #1d4ed8;
}


/* =========================
   RESULTADOS
========================= */

.result-container {
  min-height: 85vh;

  display: flex;

  justify-content: center;

  align-items: center;
}

.result-card {
  width: 100%;

  max-width: 600px;

  background: white;

  text-align: center;

  padding: 40px;

  border-radius: 20px;

  box-shadow:
    0 8px 25px
    rgba(0, 0, 0, 0.1);
}

.trophy {
  font-size: 70px;
}

.result-card h1 {
  color: #1e3a5f;
}

.result-message {
  color: #64748b;
}


/* PUNTUACIÓN */

.final-score {
  margin: 30px 0;

  display: flex;

  flex-direction: column;

  color: #64748b;
}

.final-score strong {
  font-size: 55px;

  color: #2563eb;
}


/* ESTADÍSTICAS */

.stats {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 15px;

  margin: 30px 0;
}

.stat {
  padding: 20px;

  background: #f8fafc;

  border-radius: 12px;

  display: flex;

  flex-direction: column;
}

.stat strong {
  font-size: 30px;

  color: #334155;
}

.stat span {
  color: #64748b;

  margin-top: 5px;
}

.correct-stat strong {
  color: #16a34a;
}

.incorrect-stat strong {
  color: #dc2626;
}


/* BOTONES RESULTADO */

.result-buttons {
  display: flex;

  justify-content: center;

  gap: 15px;
}

.restart-button,
.home-button {
  border: none;

  padding: 13px 20px;

  border-radius: 8px;

  cursor: pointer;

  font-weight: bold;
}

.restart-button {
  background: #2563eb;

  color: white;
}

.home-button {
  background: #e2e8f0;

  color: #334155;
}


/* =========================
   RESPONSIVE
========================= */

@media (max-width: 700px) {

  .quiz-page {
    padding: 15px;
  }

  .quiz-header {
    flex-direction: column;

    gap: 15px;

    text-align: center;
  }

  .options {
    grid-template-columns: 1fr;
  }

  .answer-result {
    flex-direction: column;

    gap: 15px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .result-buttons {
    flex-direction: column;
  }
}

</style>

