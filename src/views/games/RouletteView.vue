<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import BackToMenu from '../../components/BackToMenu.vue'
import { guardarResultadoPartida } from '../../utils/guardarResultadoPartida.js'

const route = useRoute()
const idJuego = computed(() => Number(route.params.id))

// ==========================================
// ESTADO DEL JUEGO
// ==========================================

const preguntas = ref([])
const cargando = ref(true)
const errorCarga = ref('')

const preguntaSeleccionada = ref(null)
const indicePreguntaSeleccionada = ref(null)

const girando = ref(false)
const rotacion = ref(0)

const respuestaSeleccionada = ref(null)
const respondida = ref(false)
const mensaje = ref('')
const mostrarResultado = ref(false)
const respuestaFueCorrecta = ref(false)

const aciertos = ref(0)
const errores = ref(0)
const puntuacion = ref(0)
const respondidas = ref(0)

const segundos = ref(0)
const horaInicio = ref(null)
const juegoTerminado = ref(false)
const resultadoGuardado = ref(false)
let temporizador = null

// ==========================================
// COLORES DE LA RULETA
// ==========================================

const colores = [
  '#ef5350',
  '#26a69a',
  '#42a5f5',
  '#66bb6a',
  '#ffa726',
  '#ab47bc',
  '#7e57c2',
  '#ec407a'
]

// ==========================================
// CARGAR PREGUNTAS DESDE MYSQL
// ==========================================

const obtenerPreguntas = async () => {
  try {
    cargando.value = true
    errorCarga.value = ''

    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${idJuego.value}/preguntas`
    )

    if (!respuesta.ok) {
      throw new Error('No se pudieron obtener las preguntas')
    }

    const datos = await respuesta.json()

    if (!Array.isArray(datos) || datos.length === 0) {
      throw new Error('Este juego no tiene preguntas registradas')
    }

    const convertirRespuesta = {
      A: 0,
      B: 1,
      C: 2,
      D: 3
    }

    preguntas.value = datos.map((item, index) => ({
      id: item.id_pregunta,

      categoria: `Pregunta ${index + 1}`,

      pregunta: item.pregunta,

      opciones: [
        item.opcion_a,
        item.opcion_b,
        item.opcion_c,
        item.opcion_d
      ],

      respuesta:
        convertirRespuesta[
          String(item.respuesta_correcta).toUpperCase()
        ]
    }))

    console.log(
      'Preguntas de la ruleta cargadas:',
      preguntas.value
    )

  } catch (error) {
    console.error(
      'Error cargando preguntas de la ruleta:',
      error
    )

    errorCarga.value = error.message

  } finally {
    cargando.value = false
  }
}

// ==========================================
// PROGRESO
// ==========================================

const progreso = computed(() => {
  if (preguntas.value.length === 0) {
    return 0
  }

  return Math.round(
    (respondidas.value / preguntas.value.length) * 100
  )
})

// ==========================================
// FORMATO DEL TIEMPO
// ==========================================

const tiempoFormateado = computed(() => {
  const minutos = Math.floor(segundos.value / 60)
  const seg = segundos.value % 60

  return `${String(minutos).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
})

// ==========================================
// ESTILO DE LA RULETA
// ==========================================

const fondoRuleta = computed(() => {
  const total = preguntas.value.length

  if (total === 0) {
    return '#e5e7eb'
  }

  const gradosPorSeccion = 360 / total

  const segmentos = preguntas.value.map((_, index) => {
    const inicio = index * gradosPorSeccion
    const fin = (index + 1) * gradosPorSeccion

    return `${colores[index % colores.length]} ${inicio}deg ${fin}deg`
  })

  return `conic-gradient(${segmentos.join(', ')})`
})

// ==========================================
// POSICIÓN DE LOS TEXTOS
// ==========================================

const estiloEtiqueta = (index) => {
  const total = preguntas.value.length

  if (total === 0) {
    return {}
  }

  const gradosPorSeccion = 360 / total

  const angulo =
    index * gradosPorSeccion +
    gradosPorSeccion / 2

  return {
    transform: `
      rotate(${angulo}deg)
      translateY(-145px)
      rotate(${-angulo}deg)
    `
  }
}

// ==========================================
// GIRAR RULETA
// ==========================================

const girarRuleta = () => {
  if (
    girando.value ||
    juegoTerminado.value ||
    preguntas.value.length === 0
  ) {
    return
  }

  girando.value = true

  preguntaSeleccionada.value = null
  indicePreguntaSeleccionada.value = null

  respuestaSeleccionada.value = null
  respondida.value = false
  mensaje.value = ''

  const indiceAleatorio = Math.floor(
    Math.random() * preguntas.value.length
  )

  const total = preguntas.value.length
  const gradosPorSeccion = 360 / total

  /*
    La flecha está arriba.
    Calculamos la rotación necesaria para que
    el centro del segmento elegido termine arriba.
  */

  const centroSegmento =
    indiceAleatorio * gradosPorSeccion +
    gradosPorSeccion / 2

  const vueltasExtra = 5 * 360

  rotacion.value +=
    vueltasExtra +
    (360 - centroSegmento)

  setTimeout(() => {
    preguntaSeleccionada.value =
      preguntas.value[indiceAleatorio]

    indicePreguntaSeleccionada.value =
      indiceAleatorio

    girando.value = false
  }, 3000)
}

// ==========================================
// SELECCIONAR RESPUESTA
// ==========================================

const seleccionarRespuesta = (indice) => {
  if (respondida.value) {
    return
  }

  respuestaSeleccionada.value = indice
  comprobarRespuesta()
}

// ==========================================
// COMPROBAR RESPUESTA
// ==========================================

const comprobarRespuesta = () => {
  if (
    respuestaSeleccionada.value === null ||
    !preguntaSeleccionada.value ||
    respondida.value
  ) {
    return
  }

  respondida.value = true
  respondidas.value++

  respuestaFueCorrecta.value = (
    respuestaSeleccionada.value ===
    preguntaSeleccionada.value.respuesta
  )

  if (respuestaFueCorrecta.value) {
    aciertos.value++
    puntuacion.value += 100

    mensaje.value =
      ' ¡Respuesta correcta! +100 puntos'

  } else {
    errores.value++

    const indiceCorrecto =
      preguntaSeleccionada.value.respuesta

    const correcta =
      preguntaSeleccionada.value.opciones[
        indiceCorrecto
      ]

    mensaje.value =
      ` Respuesta incorrecta. La respuesta correcta era: ${correcta}`
  }

  if (respondidas.value >= preguntas.value.length) {
    juegoTerminado.value = true
    clearInterval(temporizador)
    temporizador = null

    if (!resultadoGuardado.value) {
      const horaFin = new Date()
      const inicio = horaInicio.value || horaFin

      resultadoGuardado.value = true
      void guardarResultadoPartida({
        idJuego: idJuego.value,
        horaInicio: inicio,
        horaFin,
        tiempoTranscurrido: segundos.value,
        aciertos: aciertos.value,
        errores: errores.value,
        puntuacion: puntuacion.value
      })
    }
  }

  mostrarResultado.value = true
}

// ==========================================
// CLASE DE OPCIÓN
// ==========================================

const claseOpcion = (indice) => {
  if (!respondida.value) {
    return {
      seleccionada:
        respuestaSeleccionada.value === indice
    }
  }

  if (
    indice ===
    preguntaSeleccionada.value.respuesta
  ) {
    return {
      correcta: true
    }
  }

  if (
    indice === respuestaSeleccionada.value &&
    indice !== preguntaSeleccionada.value.respuesta
  ) {
    return {
      incorrecta: true
    }
  }

  return {}
}

// ==========================================
// REINICIAR
// ==========================================

const reiniciarJuego = () => {
  if (temporizador) {
    clearInterval(temporizador)
  }

  aciertos.value = 0
  errores.value = 0
  puntuacion.value = 0
  respondidas.value = 0

  segundos.value = 0
  horaInicio.value = new Date()
  juegoTerminado.value = false
  resultadoGuardado.value = false

  preguntaSeleccionada.value = null
  indicePreguntaSeleccionada.value = null

  respuestaSeleccionada.value = null
  respondida.value = false
  mensaje.value = ''
  mostrarResultado.value = false

  rotacion.value = 0

  temporizador = setInterval(() => {
    segundos.value++
  }, 1000)
}

const girarOtraVez = () => {
  mostrarResultado.value = false

  if (juegoTerminado.value) {
    reiniciarJuego()
  }

  girarRuleta()
}

const cerrarPregunta = () => {
  preguntaSeleccionada.value = null
  respuestaSeleccionada.value = null
  respondida.value = false
  mensaje.value = ''
  mostrarResultado.value = false
}

// ==========================================
// CICLO DE VIDA
// ==========================================

onMounted(async () => {
  await obtenerPreguntas()

  horaInicio.value = new Date()
  temporizador = setInterval(() => {
    segundos.value++
  }, 1000)
})

onUnmounted(() => {
  if (temporizador) {
    clearInterval(temporizador)
  }
})
</script>

<template>
  <div class="roulette-page">

    <BackToMenu />

    <!-- ================================= -->
    <!-- ENCABEZADO -->
    <!-- ================================= -->

    <header class="header">

      <div>
        <p>
          Gira la ruleta y responde las preguntas.
        </p>
      </div>

    </header>


    <!-- CARGANDO -->

    <div
      v-if="cargando"
      class="estado"
    >
      Cargando preguntas...
    </div>


    <!-- ERROR -->

    <div
      v-else-if="errorCarga"
      class="estado error"
    >
      {{ errorCarga }}
    </div>


    <!-- JUEGO -->

    <main v-else>

      <!-- ESTADÍSTICAS -->

      <section class="estadisticas">

        <div class="estadistica">
          <span>Aciertos</span>
          <strong>{{ aciertos }}</strong>
        </div>

        <div class="estadistica">
          <span>Errores</span>
          <strong>{{ errores }}</strong>
        </div>

        <div class="estadistica">
          <span>Puntuación</span>
          <strong>{{ puntuacion }}</strong>
        </div>

        <div class="estadistica">
          <span>Progreso</span>
          <strong>{{ progreso }}%</strong>
        </div>

        <div class="estadistica">
          <span>Tiempo</span>
          <strong>{{ tiempoFormateado }}</strong>
        </div>

      </section>


      <!-- RULETA -->

      <section class="zona-ruleta">

        <div class="flecha"></div>

        <div
          class="ruleta"
          :style="{
            background: fondoRuleta,
            transform: `rotate(${rotacion}deg)`
          }"
        >

          <div
            v-for="(pregunta, index) in preguntas"
            :key="pregunta.id"
            class="etiqueta"
            :style="estiloEtiqueta(index)"
          >
            {{ pregunta.categoria }}
          </div>

        </div>

        <div v-if="preguntaSeleccionada" class="pregunta-overlay">
          <div class="pregunta-backdrop" aria-hidden="true"></div>

          <section class="pregunta-card">
        <button
          type="button"
          class="cerrar-pregunta"
          aria-label="Cerrar pregunta"
          title="Cerrar pregunta"
          @click="cerrarPregunta"
        >
          ×
        </button>

        <span class="categoria">
          {{ preguntaSeleccionada.categoria }}
        </span>

        <h2>
          {{ preguntaSeleccionada.pregunta }}
        </h2>


        <div class="opciones">

          <button
            v-for="(opcion, index) in preguntaSeleccionada.opciones"
            :key="index"
            class="opcion"
            :class="claseOpcion(index)"
            :disabled="respondida"
            @click="seleccionarRespuesta(index)"
          >

            <span class="letra">
              {{ ['A', 'B', 'C', 'D'][index] }}
            </span>

            {{ opcion }}

          </button>

        </div>


        <div
          v-if="mensaje"
          class="mensaje"
        >
          {{ mensaje }}
        </div>


        <button
          v-if="respondida"
          type="button"
          class="otra"
          @click="girarOtraVez"
        >
           Girar otra vez
        </button>

          </section>
        </div>

        <div v-if="mostrarResultado" class="resultado-overlay">
          <div class="resultado-backdrop" aria-hidden="true"></div>

          <section
            class="resultado-card"
            :class="respuestaFueCorrecta ? 'es-correcta' : 'es-incorrecta'"
            role="dialog"
            aria-modal="true"
            :aria-label="respuestaFueCorrecta ? 'Respuesta correcta' : 'Respuesta incorrecta'"
          >
            <span class="resultado-icono" aria-hidden="true">
              {{ respuestaFueCorrecta ? '✓' : '×' }}
            </span>
            <h2>{{ respuestaFueCorrecta ? '¡Correcto!' : '¡Incorrecto!' }}</h2>
            <p class="resultado-detalle">
              {{ respuestaFueCorrecta
                ? 'Sumaste 100 puntos.'
                : `La respuesta correcta era: ${preguntaSeleccionada.opciones[preguntaSeleccionada.respuesta]}` }}
            </p>

            <div class="resultado-estadisticas">
              <div><strong>{{ puntuacion }}</strong><span>Puntos</span></div>
              <div><strong>{{ tiempoFormateado }}</strong><span>Tiempo</span></div>
              <div><strong>{{ aciertos }}</strong><span>Aciertos</span></div>
              <div><strong>{{ errores }}</strong><span>Errores</span></div>
              <div class="progreso-respuestas">
                <strong>{{ respondidas }} / {{ preguntas.length }}</strong>
                <span>Preguntas respondidas</span>
              </div>
            </div>

            <div class="resultado-acciones">
              <button type="button" class="resultado-continuar" @click="girarOtraVez">
                 Girar otra vez
              </button>
              <button type="button" class="resultado-cerrar" @click="mostrarResultado = false">
                Ver pregunta
              </button>
            </div>
          </section>
        </div>

        <button
          v-if="!preguntaSeleccionada"
          class="boton-girar"
          :disabled="girando || juegoTerminado"
          @click="girarRuleta"
        >
          {{ girando ? 'Girando...' : juegoTerminado ? 'Partida terminada' : ' Girar ruleta' }}
        </button>

      </section>
    </main>

  </div>
</template>

<style scoped>

* {
  box-sizing: border-box;
}

.roulette-page {
  min-height: 100vh;
  padding: 30px;

  background: #f8fafc;

  color: #0f172a;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

/* ============================= */
/* HEADER */
/* ============================= */

.header {
  max-width: 1150px;

  margin: 0 auto 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 30px;

  padding-bottom: 20px;

  border-bottom: 1px solid #e2e8f0;
}

.header h1 {
  margin: 0 0 8px;

  font-size: 38px;
}

.header p {
  margin: 0;

  color: #64748b;

  font-size: 18px;
}

.header > div {
  text-align: center;
  transform: translateX(20px);
}

/* ============================= */
/* ESTADOS */
/* ============================= */

.estado {
  max-width: 700px;

  margin: 100px auto;

  padding: 30px;

  text-align: center;

  background: white;

  border-radius: 16px;

  font-size: 20px;
}

.estado.error {
  color: #dc2626;
}

/* ============================= */
/* ESTADISTICAS */
/* ============================= */

.estadisticas {
  max-width: 1100px;

  margin: 0 auto 45px;

  display: grid;

  grid-template-columns:
    repeat(5, 1fr);

  gap: 15px;
}

.estadistica {
  padding: 20px;

  background: white;

  border: 1px solid #e2e8f0;

  border-radius: 14px;

  text-align: center;
}

.estadistica span {
  display: block;

  margin-bottom: 8px;

  color: #475569;

  font-weight: 600;
}

.estadistica strong {
  font-size: 28px;
}

/* ============================= */
/* RULETA */
/* ============================= */

.zona-ruleta {
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;

  margin-bottom: 50px;
}

.flecha {
  width: 0;
  height: 0;

  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 38px solid #111827;

  margin-bottom: -5px;

  z-index: 10;
}

.ruleta {
  position: relative;

  width: 500px;
  height: 500px;

  border-radius: 50%;

  border: 12px solid #1f2937;

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.15);

  transition:
    transform 3s
    cubic-bezier(.17,.67,.19,1);

  overflow: hidden;
}

.etiqueta {
  position: absolute;

  left: calc(50% - 65px);
  top: calc(50% - 15px);

  width: 130px;

  text-align: center;

  color: white;

  font-weight: bold;

  font-size: 16px;

  transform-origin:
    65px 15px;

  pointer-events: none;
}

.boton-girar {
  margin-top: 30px;

  padding: 16px 28px;

  border: none;
  border-radius: 12px;

  background: #2563eb;

  color: white;

  font-size: 18px;
  font-weight: bold;

  cursor: pointer;
}

.boton-girar:hover:not(:disabled) {
  background: #1d4ed8;
}

.boton-girar:disabled {
  opacity: .6;

  cursor: not-allowed;
}

/* ============================= */
/* PREGUNTA */
/* ============================= */

.pregunta-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 16px;
  pointer-events: none;
}

.pregunta-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(15, 23, 42, .38);
  backdrop-filter: blur(6px);
  animation: aparecer-fondo .22s ease-out;
}

.pregunta-card {
  position: relative;
  z-index: 1;
  width: min(700px, calc(100vw - 40px));
  max-height: min(76vh, 620px);
  overflow-y: auto;
  pointer-events: auto;
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 22px;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 24px 70px rgba(15, 23, 42, .38);
  backdrop-filter: blur(12px);
}

.cerrar-pregunta {
  position: absolute;
  top: 12px;
  right: 14px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: #fff;
  color: #475569;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: background .18s ease, color .18s ease, transform .18s ease;
}

.cerrar-pregunta:hover {
  background: #fee2e2;
  color: #b91c1c;
  transform: rotate(90deg);
}

@keyframes aparecer-fondo {
  from { opacity: 0; backdrop-filter: blur(0); }
  to { opacity: 1; backdrop-filter: blur(6px); }
}

.resultado-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 18px;
  pointer-events: none;
}

.resultado-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, .42);
  backdrop-filter: blur(8px);
}

.resultado-card {
  position: relative;
  width: min(560px, 100%);
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 30px 90px rgba(15, 23, 42, .4);
  text-align: center;
  pointer-events: auto;
  animation: resultado-entrada .25s ease-out;
}

.resultado-icono {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 0 auto 14px;
  place-items: center;
  border-radius: 50%;
  font-size: 44px;
  font-weight: 800;
}

.es-correcta .resultado-icono {
  background: #dcfce7;
  color: #15803d;
}

.es-incorrecta .resultado-icono {
  background: #fee2e2;
  color: #b91c1c;
}

.resultado-card h2 {
  margin: 0;
  color: #172033;
  font-size: clamp(32px, 7vw, 44px);
}

.resultado-detalle {
  margin: 10px 0 24px;
  color: #64748b;
  font-size: 17px;
  line-height: 1.5;
}

.resultado-estadisticas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.resultado-estadisticas > div {
  display: grid;
  gap: 4px;
  padding: 14px 10px;
  border-radius: 16px;
  background: #f1f5f9;
}

.resultado-estadisticas strong {
  color: #312e81;
  font-size: 22px;
}

.resultado-estadisticas span {
  color: #64748b;
  font-size: 13px;
}

.resultado-estadisticas .progreso-respuestas {
  grid-column: 1 / -1;
}

.resultado-acciones {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.resultado-acciones button {
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 750;
  cursor: pointer;
}

.resultado-continuar {
  background: #4f46e5;
  color: #fff;
}

.resultado-continuar:hover {
  background: #4338ca;
}

.resultado-cerrar {
  background: #eef2ff;
  color: #3730a3;
}

@keyframes resultado-entrada {
  from { opacity: 0; transform: translateY(12px) scale(.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.categoria {
  display: inline-block;

  margin-bottom: 10px;

  padding: 7px 12px;

  border-radius: 20px;

  background: #dbeafe;

  color: #1d4ed8;

  font-weight: bold;
}

.pregunta-card h2 {
  margin-bottom: 25px;

  line-height: 1.4;
}

/* ============================= */
/* OPCIONES */
/* ============================= */

.opciones {
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 15px;
}

.opcion {
  display: flex;
  align-items: center;

  gap: 12px;

  padding: 18px;

  border: 2px solid #e2e8f0;

  border-radius: 12px;

  background: white;

  text-align: left;

  cursor: pointer;

  font-size: 16px;
}

.opcion:hover:not(:disabled) {
  border-color: #2563eb;

  background: #eff6ff;
}

.opcion.seleccionada {
  border-color: #2563eb;

  background: #dbeafe;
}

.opcion.correcta {
  border-color: #16a34a;

  background: #dcfce7;
}

.opcion.incorrecta {
  border-color: #dc2626;

  background: #fee2e2;
}

.letra {
  display: flex;
  justify-content: center;
  align-items: center;

  min-width: 36px;
  height: 36px;

  border-radius: 50%;

  background: #e2e8f0;

  font-weight: bold;
}

/* ============================= */
/* BOTONES */
/* ============================= */

.comprobar,
.otra {
  width: 100%;

  margin-top: 25px;

  padding: 15px;

  border: none;
  border-radius: 10px;

  background: #2563eb;

  color: white;

  font-size: 16px;
  font-weight: bold;

  cursor: pointer;
}

.comprobar:disabled {
  opacity: .5;

  cursor: not-allowed;
}

.otra {
  background: #7c3aed;
}

.mensaje {
  margin-top: 20px;

  padding: 15px;

  border-radius: 10px;

  background: #f1f5f9;

  text-align: center;

  font-weight: bold;
}

/* ============================= */
/* RESPONSIVE */
/* ============================= */

@media (max-width: 750px) {

  .roulette-page {
    padding: 15px;
  }

  .header {
    align-items: flex-start;
  }

  .header h1 {
    font-size: 28px;
  }

  .estadisticas {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .ruleta {
    width: 330px;
    height: 330px;
  }

  .etiqueta {
    transform-origin:
      65px 15px;
  }

  .opciones {
    grid-template-columns: 1fr;
  }

  .pregunta-card {
    width: min(540px, calc(100vw - 32px));
    max-height: 70vh;
    padding: 18px;
  }

  .pregunta-card h2 {
    margin-bottom: 16px;
    font-size: 20px;
  }

  .resultado-card {
    padding: 24px 18px;
    border-radius: 22px;
  }
}

</style>

<style scoped>
.resultado-card.es-correcta{background:#16a34a;color:#fff;border-color:rgba(255,255,255,.5)}
.resultado-card.es-incorrecta{background:#dc2626;color:#fff;border-color:rgba(255,255,255,.5)}
.resultado-card h2,.resultado-card .resultado-detalle,.resultado-card .resultado-estadisticas strong,.resultado-card .resultado-estadisticas span{color:#fff}
.resultado-card .resultado-icono{background:rgba(255,255,255,.2);color:#fff}
.resultado-card .resultado-estadisticas>div{background:rgba(255,255,255,.16)}
.resultado-card .resultado-continuar,.resultado-card .resultado-cerrar{background:rgba(255,255,255,.95);color:#172033}
</style>
