<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BackToMenu from '../../components/BackToMenu.vue'

const router = useRouter()

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

const aciertos = ref(0)
const errores = ref(0)
const puntuacion = ref(0)
const respondidas = ref(0)

const segundos = ref(0)
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
      'http://localhost:3000/api/juegos/5/preguntas'
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

  if (
    respuestaSeleccionada.value ===
    preguntaSeleccionada.value.respuesta
  ) {
    aciertos.value++
    puntuacion.value += 100

    mensaje.value =
      '✅ ¡Respuesta correcta! +100 puntos'

  } else {
    errores.value++

    const indiceCorrecto =
      preguntaSeleccionada.value.respuesta

    const correcta =
      preguntaSeleccionada.value.opciones[
        indiceCorrecto
      ]

    mensaje.value =
      `❌ Respuesta incorrecta. La respuesta correcta era: ${correcta}`
  }
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
  aciertos.value = 0
  errores.value = 0
  puntuacion.value = 0
  respondidas.value = 0

  segundos.value = 0

  preguntaSeleccionada.value = null
  indicePreguntaSeleccionada.value = null

  respuestaSeleccionada.value = null
  respondida.value = false
  mensaje.value = ''

  rotacion.value = 0
}

// ==========================================
// CICLO DE VIDA
// ==========================================

onMounted(async () => {
  await obtenerPreguntas()

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

      <button
        class="volver"
        @click="router.push('/home')"
      >
        ← Volver
      </button>

      <div>
        <h1>🎡 Ruleta de preguntas</h1>

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


        <button
          class="boton-girar"
          :disabled="girando"
          @click="girarRuleta"
        >
          {{ girando ? 'Girando...' : '🎡 Girar ruleta' }}
        </button>

      </section>


      <!-- PREGUNTA -->

      <section
        v-if="preguntaSeleccionada"
        class="pregunta-card"
      >

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


        <button
          v-if="!respondida"
          class="comprobar"
          :disabled="respuestaSeleccionada === null"
          @click="comprobarRespuesta"
        >
          Comprobar respuesta
        </button>


        <div
          v-if="mensaje"
          class="mensaje"
        >
          {{ mensaje }}
        </div>


        <button
          v-if="respondida"
          class="otra"
          @click="girarRuleta"
        >
          🎡 Girar nuevamente
        </button>

      </section>


      <!-- REINICIAR -->

      <section class="acciones">

        <button
          class="reiniciar"
          @click="reiniciarJuego"
        >
          🔄 Nuevo juego
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

.volver {
  padding: 12px 18px;

  border: none;
  border-radius: 10px;

  background: #e2e8f0;

  cursor: pointer;

  font-size: 15px;
  font-weight: 600;
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

.pregunta-card {
  max-width: 850px;

  margin: 0 auto;

  padding: 30px;

  background: white;

  border-radius: 18px;

  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.08);
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

.acciones {
  margin-top: 35px;

  text-align: center;
}

.reiniciar {
  padding: 12px 20px;

  border: none;
  border-radius: 10px;

  background: #e2e8f0;

  cursor: pointer;

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
}

</style>
