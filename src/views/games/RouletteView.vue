```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BackToMenu from '../../components/BackToMenu.vue'

/*
========================================
PREGUNTAS DE LA RULETA
========================================

Por ahora están aquí para poder probar
el juego.

Más adelante estas preguntas vendrán
desde MySQL.
*/

const preguntas = ref([
  {
    id: 1,
    categoria: 'HTML',
    pregunta: '¿Qué significa HTML?',
    opciones: [
      'Hyper Text Markup Language',
      'High Text Machine Language',
      'Hyper Tool Multi Language',
      'Home Text Markup Language'
    ],
    respuesta: 0
  },

  {
    id: 2,
    categoria: 'CSS',
    pregunta: '¿Para qué se utiliza principalmente CSS?',
    opciones: [
      'Crear bases de datos',
      'Dar estilo a una página web',
      'Crear servidores',
      'Programar videojuegos'
    ],
    respuesta: 1
  },

  {
    id: 3,
    categoria: 'JavaScript',
    pregunta: '¿Cuál de estos es un tipo de dato en JavaScript?',
    opciones: [
      'String',
      'Style',
      'Selector',
      'ElementCSS'
    ],
    respuesta: 0
  },

  {
    id: 4,
    categoria: 'Vue',
    pregunta: '¿Qué es Vue?',
    opciones: [
      'Un sistema operativo',
      'Un framework de JavaScript',
      'Una base de datos',
      'Un lenguaje de programación'
    ],
    respuesta: 1
  },

  {
    id: 5,
    categoria: 'MySQL',
    pregunta: '¿Qué es MySQL?',
    opciones: [
      'Un navegador',
      'Un lenguaje de estilos',
      'Un sistema de gestión de bases de datos',
      'Un framework'
    ],
    respuesta: 2
  },

  {
    id: 6,
    categoria: 'Programación',
    pregunta: '¿Qué instrucción se utiliza para mostrar información en la consola de JavaScript?',
    opciones: [
      'print()',
      'console.log()',
      'write.console()',
      'show()'
    ],
    respuesta: 1
  }
])


/*
========================================
ESTADO DE LA RULETA
========================================
*/

const girando = ref(false)

const angulo = ref(0)

const preguntaActual = ref(null)

const respuestaSeleccionada = ref(null)

const respuestaRespondida = ref(false)

const preguntasUsadas = ref([])


/*
========================================
ESTADÍSTICAS
========================================
*/

const aciertos = ref(0)

const errores = ref(0)

const puntuacion = ref(0)


/*
========================================
TIEMPO
========================================
*/

const tiempoTranscurrido = ref(0)

const horaInicio = ref(null)

const horaFin = ref(null)

let temporizador = null


/*
========================================
ESTADO FINAL
========================================
*/

const juegoTerminado = ref(false)

const mensaje = ref('')

const respuestaCorrecta = ref(false)


/*
========================================
COLORES DE LA RULETA
========================================
*/

const colores = [
  '#42a5f5',
  '#66bb6a',
  '#ffa726',
  '#ab47bc',
  '#ef5350',
  '#26a69a'
]


/*
========================================
FORMATO DEL TIEMPO
========================================
*/

const formatoTiempo = (segundos) => {

  const minutos =
    Math.floor(segundos / 60)

  const segundosRestantes =
    segundos % 60

  return `${String(minutos).padStart(2, '0')}:${String(
    segundosRestantes
  ).padStart(2, '0')}`
}


/*
========================================
INICIAR JUEGO
========================================
*/

const iniciarJuego = () => {

  horaInicio.value = new Date()

  temporizador = setInterval(() => {

    if (!juegoTerminado.value) {

      tiempoTranscurrido.value++

    }

  }, 1000)
}


/*
========================================
GIRAR RULETA
========================================
*/

const girarRuleta = () => {

  if (
    girando.value ||
    juegoTerminado.value ||
    preguntaActual.value
  ) {

    return

  }


  /*
    Obtener preguntas disponibles.
  */

  const disponibles =
    preguntas.value.filter(
      pregunta =>
        !preguntasUsadas.value.includes(
          pregunta.id
        )
    )


  /*
    Si ya no quedan preguntas,
    terminar juego.
  */

  if (
    disponibles.length === 0
  ) {

    finalizarJuego()

    return

  }


  girando.value = true

  mensaje.value = ''

  respuestaSeleccionada.value = null

  respuestaRespondida.value = false


  /*
    Seleccionar pregunta aleatoria.
  */

  const indice =
    Math.floor(
      Math.random() *
      disponibles.length
    )


  const pregunta =
    disponibles[indice]


  /*
    Marcar pregunta como utilizada.
  */

  preguntasUsadas.value.push(
    pregunta.id
  )


  /*
    Calcular posición aleatoria
    dentro de la ruleta.
  */

  const secciones =
    preguntas.value.length

  const gradosPorSeccion =
    360 / secciones

  const posicion =
    pregunta.id - 1

  const centroSeccion =
    (
      posicion *
      gradosPorSeccion
    ) +
    (
      gradosPorSeccion / 2
    )


  /*
    Varias vueltas antes de detenerse.
  */

  const vueltas = 5

  angulo.value +=
    vueltas * 360 +
    (
      360 -
      centroSeccion
    )


  /*
    Esperar a que termine
    la animación.
  */

  setTimeout(() => {

    preguntaActual.value =
      pregunta

    girando.value = false

  }, 4500)
}


/*
========================================
SELECCIONAR RESPUESTA
========================================
*/

const seleccionarRespuesta = (
  indice
) => {

  if (
    respuestaRespondida.value ||
    !preguntaActual.value ||
    juegoTerminado.value
  ) {

    return

  }

  respuestaSeleccionada.value =
    indice
}


/*
========================================
COMPROBAR RESPUESTA
========================================
*/

const comprobarRespuesta = () => {

  if (
    respuestaSeleccionada.value === null ||
    !preguntaActual.value ||
    respuestaRespondida.value
  ) {

    return

  }


  respuestaRespondida.value = true


  if (
    respuestaSeleccionada.value ===
    preguntaActual.value.respuesta
  ) {

    aciertos.value++

    puntuacion.value += 100

    respuestaCorrecta.value = true

    mensaje.value =
      '¡Respuesta correcta! +100 puntos'

  } else {

    errores.value++

    puntuacion.value =
      Math.max(
        0,
        puntuacion.value - 25
      )

    respuestaCorrecta.value = false

    mensaje.value =
      `Respuesta incorrecta. La respuesta correcta era: ${
        preguntaActual.value.opciones[
          preguntaActual.value.respuesta
        ]
      }`

  }


  /*
    Si se respondieron todas
    las preguntas, terminar.
  */

  if (
    preguntasUsadas.value.length ===
    preguntas.value.length
  ) {

    setTimeout(() => {

      finalizarJuego()

    }, 1200)

  }
}


/*
========================================
SIGUIENTE PREGUNTA
========================================
*/

const siguientePregunta = () => {

  if (!respuestaRespondida.value) {

    return

  }


  /*
    Si todavía hay preguntas,
    regresar a la ruleta.
  */

  if (
    preguntasUsadas.value.length <
    preguntas.value.length
  ) {

    preguntaActual.value = null

    respuestaSeleccionada.value = null

    respuestaRespondida.value = false

    mensaje.value = ''

    respuestaCorrecta.value = false

  }

}


/*
========================================
FINALIZAR
========================================
*/

const finalizarJuego = () => {

  if (juegoTerminado.value) {

    return

  }


  juegoTerminado.value = true

  horaFin.value = new Date()

  clearInterval(
    temporizador
  )

  temporizador = null
}


/*
========================================
PROGRESO
========================================
*/

const progreso = computed(() => {

  return Math.round(
    (
      preguntasUsadas.value.length /
      preguntas.value.length
    ) * 100
  )
})


/*
========================================
REINICIAR
========================================
*/

const reiniciarJuego = () => {

  clearInterval(
    temporizador
  )

  temporizador = null


  girando.value = false

  angulo.value = 0

  preguntaActual.value = null

  respuestaSeleccionada.value = null

  respuestaRespondida.value = false

  preguntasUsadas.value = []

  aciertos.value = 0

  errores.value = 0

  puntuacion.value = 0

  tiempoTranscurrido.value = 0

  horaInicio.value = null

  horaFin.value = null

  juegoTerminado.value = false

  mensaje.value = ''

  respuestaCorrecta.value = false


  iniciarJuego()

}


/*
========================================
INICIAR AL CARGAR
========================================
*/

onMounted(() => {

  iniciarJuego()

})


/*
========================================
LIMPIAR AL SALIR
========================================
*/

onUnmounted(() => {

  clearInterval(
    temporizador
  )

})
</script>


<template>

  <div class="game">

    <BackToMenu />

    <!-- ================================= -->
    <!-- ENCABEZADO -->
    <!-- ================================= -->

    <header class="game-header">

      <h1>🎡 Ruleta de preguntas</h1>

      <p>
        Gira la ruleta y responde las preguntas.
      </p>

    </header>


    <!-- ================================= -->
    <!-- ESTADÍSTICAS -->
    <!-- ================================= -->

    <div class="stats">

      <div class="stat">

        <strong>Aciertos</strong>

        <span>
          {{ aciertos }}
        </span>

      </div>


      <div class="stat">

        <strong>Errores</strong>

        <span>
          {{ errores }}
        </span>

      </div>


      <div class="stat">

        <strong>Puntuación</strong>

        <span>
          {{ puntuacion }}
        </span>

      </div>


      <div class="stat">

        <strong>Progreso</strong>

        <span>
          {{ progreso }}%
        </span>

      </div>


      <div class="stat">

        <strong>Tiempo</strong>

        <span>
          {{ formatoTiempo(tiempoTranscurrido) }}
        </span>

      </div>

    </div>


    <!-- ================================= -->
    <!-- RULETA -->
    <!-- ================================= -->

    <div class="roulette-area">

      <div class="pointer">
        ▼
      </div>


      <div
        class="roulette"

        :style="{
          transform: `rotate(${angulo}deg)`
        }"
      >

        <div
          v-for="(
            pregunta,
            index
          ) in preguntas"

          :key="pregunta.id"

          class="roulette-section"

          :style="{
            transform:
              `rotate(${
                index *
                (360 / preguntas.length)
              }deg)`,

            backgroundColor:
              colores[
                index %
                colores.length
              ]
          }"
        >

          <span>

            {{ pregunta.categoria }}

          </span>

        </div>

      </div>

    </div>


    <!-- ================================= -->
    <!-- BOTÓN GIRAR -->
    <!-- ================================= -->

    <button
      v-if="
        !preguntaActual &&
        !juegoTerminado
      "

      class="spin-button"

      :disabled="girando"

      @click="girarRuleta"
    >

      {{
        girando
          ? 'Girando...'
          : '🎡 Girar ruleta'
      }}

    </button>


    <!-- ================================= -->
    <!-- PREGUNTA -->
    <!-- ================================= -->

    <section
      v-if="preguntaActual"

      class="question-card"
    >

      <div class="category">

        {{ preguntaActual.categoria }}

      </div>


      <h2>
        {{ preguntaActual.pregunta }}
      </h2>


      <div class="options">

        <button
          v-for="(
            opcion,
            index
          ) in preguntaActual.opciones"

          :key="index"

          class="option"

          :class="{

            seleccionada:
              respuestaSeleccionada ===
              index,

            correcta:
              respuestaRespondida &&
              index ===
                preguntaActual.respuesta,

            incorrecta:
              respuestaRespondida &&
              respuestaSeleccionada ===
                index &&
              index !==
                preguntaActual.respuesta

          }"

          :disabled="
            respuestaRespondida
          "

          @click="
            seleccionarRespuesta(
              index
            )
          "
        >

          <span class="option-letter">

            {{
              String.fromCharCode(
                65 + index
              )
            }}

          </span>

          <span>
            {{ opcion }}
          </span>

        </button>

      </div>


      <!-- ================================= -->
      <!-- COMPROBAR -->
      <!-- ================================= -->

      <button
        v-if="
          !respuestaRespondida
        "

        class="check-button"

        :disabled="
          respuestaSeleccionada === null
        "

        @click="
          comprobarRespuesta
        "
      >

        Comprobar respuesta

      </button>


      <!-- ================================= -->
      <!-- SIGUIENTE -->
      <!-- ================================= -->

      <button
        v-if="
          respuestaRespondida &&
          !juegoTerminado
        "

        class="next-button"

        @click="
          siguientePregunta
        "
      >

        🎡 Siguiente pregunta

      </button>

    </section>


    <!-- ================================= -->
    <!-- MENSAJE -->
    <!-- ================================= -->

    <div
      v-if="mensaje"

      class="message"

      :class="
        respuestaCorrecta
          ? 'correcto'
          : 'incorrecto'
      "
    >

      {{ mensaje }}

    </div>


    <!-- ================================= -->
    <!-- FINAL -->
    <!-- ================================= -->

    <section
      v-if="juegoTerminado"

      class="game-over"
    >

      <h2>
        🎉 ¡Ruleta terminada!
      </h2>

      <p>
        Has respondido todas las preguntas.
      </p>


      <div class="final-stats">

        <div>

          <strong>Aciertos</strong>

          <span>
            {{ aciertos }}
          </span>

        </div>


        <div>

          <strong>Errores</strong>

          <span>
            {{ errores }}
          </span>

        </div>


        <div>

          <strong>Puntuación</strong>

          <span>
            {{ puntuacion }}
          </span>

        </div>


        <div>

          <strong>Tiempo</strong>

          <span>
            {{ formatoTiempo(tiempoTranscurrido) }}
          </span>

        </div>

      </div>


      <button
        class="restart-button"

        @click="
          reiniciarJuego
        "
      >

        🔄 Jugar nuevamente

      </button>

    </section>

  </div>

</template>


<style scoped>

/* ========================================
   CONTENEDOR
======================================== */

.game {

  max-width: 1000px;

  margin: 40px auto;

  padding: 20px;

  text-align: center;

}


.game-header {

  margin-bottom: 25px;

}


/* ========================================
   ESTADÍSTICAS
======================================== */

.stats {

  display: flex;

  justify-content: center;

  flex-wrap: wrap;

  gap: 12px;

  margin: 25px 0;

}


.stat {

  min-width: 105px;

  padding: 12px 16px;

  display: flex;

  flex-direction: column;

  align-items: center;

  border: 1px solid #ddd;

  border-radius: 10px;

  background: #f7f7f7;

}


.stat strong {

  font-size: 14px;

  margin-bottom: 5px;

}


.stat span {

  font-size: 21px;

  font-weight: bold;

}


/* ========================================
   ÁREA RULETA
======================================== */

.roulette-area {

  position: relative;

  width: 360px;

  height: 390px;

  margin: 30px auto;

}


/* ========================================
   PUNTERO
======================================== */

.pointer {

  position: absolute;

  top: -5px;

  left: 50%;

  transform: translateX(-50%);

  z-index: 10;

  font-size: 38px;

  color: #222;

}


/* ========================================
   RULETA
======================================== */

.roulette {

  position: absolute;

  top: 30px;

  left: 10px;

  width: 340px;

  height: 340px;

  border-radius: 50%;

  overflow: hidden;

  border: 8px solid #333;

  transition:
    transform 4.5s
    cubic-bezier(
      0.17,
      0.67,
      0.12,
      0.99
    );

  box-shadow:
    0 5px 20px
    rgba(0, 0, 0, 0.2);

}


/*
  Cada sección ocupa todo el círculo
  y se recorta mediante clip-path.
*/

.roulette-section {

  position: absolute;

  width: 50%;

  height: 50%;

  top: 50%;

  left: 50%;

  transform-origin:
    0% 0%;

  clip-path:
    polygon(
      0 0,
      100% 0,
      50% 100%
    );

  display: flex;

  align-items: flex-start;

  justify-content: center;

}


.roulette-section span {

  margin-top: 20px;

  font-size: 12px;

  font-weight: bold;

  color: white;

  transform:
    rotate(
      calc(
        360deg /
        -6 /
        2
      )
    );

}


/* ========================================
   BOTÓN GIRAR
======================================== */

.spin-button {

  padding: 14px 28px;

  border: none;

  border-radius: 10px;

  font-size: 17px;

  font-weight: bold;

  cursor: pointer;

}


.spin-button:disabled {

  opacity: 0.6;

  cursor: default;

}


/* ========================================
   TARJETA DE PREGUNTA
======================================== */

.question-card {

  max-width: 700px;

  margin: 30px auto;

  padding: 25px;

  border: 1px solid #ddd;

  border-radius: 15px;

  background: #f9f9f9;

}


.category {

  display: inline-block;

  padding: 6px 12px;

  margin-bottom: 15px;

  border-radius: 20px;

  background: #e3f2fd;

  font-weight: bold;

  font-size: 14px;

}


.question-card h2 {

  margin-bottom: 25px;

}


/* ========================================
   OPCIONES
======================================== */

.options {

  display: flex;

  flex-direction: column;

  gap: 12px;

}


.option {

  display: flex;

  align-items: center;

  gap: 12px;

  width: 100%;

  padding: 14px;

  border: 2px solid #ddd;

  border-radius: 10px;

  background: white;

  text-align: left;

  cursor: pointer;

  transition:
    border-color 0.2s,
    background-color 0.2s;

}


.option:hover:not(:disabled) {

  border-color: #90caf9;

}


.option.seleccionada {

  border-color: #2196f3;

  background: #e3f2fd;

}


.option.correcta {

  border-color: #4caf50;

  background: #e8f5e9;

}


.option.incorrecta {

  border-color: #f44336;

  background: #ffebee;

}


.option:disabled {

  cursor: default;

}


/* ========================================
   LETRA DE OPCIÓN
======================================== */

.option-letter {

  display: flex;

  align-items: center;

  justify-content: center;

  width: 30px;

  height: 30px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #eeeeee;

  font-weight: bold;

}


/* ========================================
   BOTONES
======================================== */

.check-button,
.next-button,
.restart-button {

  margin-top: 20px;

  padding: 12px 22px;

  border: none;

  border-radius: 8px;

  cursor: pointer;

  font-size: 15px;

}


.check-button:disabled {

  opacity: 0.5;

  cursor: default;

}


/* ========================================
   MENSAJE
======================================== */

.message {

  max-width: 700px;

  margin: 20px auto;

  padding: 15px;

  border-radius: 8px;

  font-weight: bold;

}


.correcto {

  color: #2e7d32;

  background: #e8f5e9;

}


.incorrecto {

  color: #c62828;

  background: #ffebee;

}


/* ========================================
   FINAL
======================================== */

.game-over {

  max-width: 600px;

  margin: 30px auto;

  padding: 30px;

  border: 1px solid #ddd;

  border-radius: 15px;

  background: #f5f5f5;

}


.final-stats {

  display: flex;

  justify-content: center;

  flex-wrap: wrap;

  gap: 20px;

  margin: 25px 0;

}


.final-stats div {

  min-width: 100px;

  display: flex;

  flex-direction: column;

}


.final-stats strong {

  margin-bottom: 5px;

}


.final-stats span {

  font-size: 24px;

  font-weight: bold;

}


/* ========================================
   RESPONSIVE
======================================== */

@media (max-width: 600px) {

  .roulette-area {

    transform: scale(0.85);

    transform-origin: top center;

    margin-bottom: -40px;

  }

}

</style>
