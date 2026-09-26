```vue
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/*
========================================
PALABRAS DEL CRUCIGRAMA
========================================

Más adelante estas palabras vendrán
desde el backend y MySQL.
*/

const palabras = ref([
  {
    palabra: 'JAVASCRIPT',
    pista: 'Lenguaje de programación utilizado para crear páginas web interactivas.',
    fila: 5,
    columna: 2,
    direccion: 'horizontal'
  },
  {
    palabra: 'HTML',
    pista: 'Lenguaje utilizado para estructurar el contenido de una página web.',
    fila: 4,
    columna: 11,
    direccion: 'vertical'
  },
  {
    palabra: 'MYSQL',
    pista: 'Sistema de gestión de bases de datos relacionales.',
    fila: 3,
    columna: 6,
    direccion: 'vertical'
  },
  {
    palabra: 'CSS',
    pista: 'Lenguaje utilizado para dar estilo y diseño a las páginas web.',
    fila: 5,
    columna: 7,
    direccion: 'vertical'
  },
  {
    palabra: 'VUE',
    pista: 'Framework progresivo de JavaScript utilizado para crear interfaces.',
    fila: 5,
    columna: 4,
    direccion: 'vertical'
  }
])

/*
========================================
CONFIGURACIÓN
========================================
*/

const filas = 10
const columnas = 15

/*
========================================
TABLERO
========================================
*/

const crearTablero = () => {
  return Array.from(
    { length: filas },
    () =>
      Array.from(
        { length: columnas },
        () => ({
          letra: '',
          palabras: [],
          numero: null
        })
      )
  )
}

const generarTablero = () => {
  const tableroGenerado = crearTablero()

  palabras.value.forEach((palabra, palabraIndex) => {

    for (let i = 0; i < palabra.palabra.length; i++) {

      let fila = palabra.fila
      let columna = palabra.columna

      if (palabra.direccion === 'horizontal') {
        columna += i
      } else {
        fila += i
      }

      if (
        fila < 0 ||
        fila >= filas ||
        columna < 0 ||
        columna >= columnas
      ) {
        continue
      }

      const celda = tableroGenerado[fila][columna]

      celda.letra = palabra.palabra[i]

      if (!celda.palabras.includes(palabra.palabra)) {
        celda.palabras.push(palabra.palabra)
      }

      if (i === 0 && celda.numero === null) {
        celda.numero = palabraIndex + 1
      }
    }
  })

  return tableroGenerado
}

const tablero = ref(generarTablero())

/*
========================================
RESPUESTAS
========================================
*/

const respuestas = ref({})

/*
========================================
PALABRAS COMPLETADAS
========================================
*/

const palabrasCompletadas = ref([])

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
ESTADO DEL JUEGO
========================================
*/

const juegoTerminado = ref(false)

const mensaje = ref('')

const respuestaCorrecta = ref(false)

/*
========================================
PALABRA ACTIVA
========================================
*/

const palabraActiva = ref(null)

/*
========================================
CELDA ACTIVA
========================================
*/

const celdaActiva = ref({
  fila: null,
  columna: null
})

/*
========================================
FORMATO DEL TIEMPO
========================================
*/

const formatoTiempo = (segundos) => {

  const minutos = Math.floor(segundos / 60)

  const segundosRestantes = segundos % 60

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
FINALIZAR JUEGO
========================================
*/

const finalizarJuego = () => {

  if (juegoTerminado.value) {
    return
  }

  juegoTerminado.value = true

  horaFin.value = new Date()

  clearInterval(temporizador)

  temporizador = null
}

/*
========================================
CLAVE DE CELDA
========================================
*/

const obtenerClave = (fila, columna) => {
  return `${fila}-${columna}`
}

/*
========================================
OBTENER LETRA
========================================
*/

const obtenerLetra = (fila, columna) => {

  const clave = obtenerClave(
    fila,
    columna
  )

  return respuestas.value[clave] || ''
}

/*
========================================
OBTENER CELDAS DE UNA PALABRA
========================================
*/

const obtenerCeldasPalabra = (palabra) => {

  const celdas = []

  for (
    let i = 0;
    i < palabra.palabra.length;
    i++
  ) {

    let fila = palabra.fila
    let columna = palabra.columna

    if (palabra.direccion === 'horizontal') {
      columna += i
    } else {
      fila += i
    }

    celdas.push({
      fila,
      columna,
      letra: palabra.palabra[i]
    })
  }

  return celdas
}

/*
========================================
PALABRA COMPLETADA
========================================
*/

const palabraCompletada = (palabra) => {

  return palabrasCompletadas.value.includes(
    palabra.palabra
  )
}

/*
========================================
CELDA COMPLETADA
========================================

Una casilla puede pertenecer a dos
palabras.

Por eso solamente se bloquea cuando
TODAS las palabras que utilizan esa
casilla están completadas.
*/

const celdaCompletada = (celda) => {

  if (celda.palabras.length === 0) {
    return false
  }

  return celda.palabras.every(
    nombre =>
      palabrasCompletadas.value.includes(
        nombre
      )
  )
}

/*
========================================
CELDA DE PALABRA ACTIVA
========================================
*/

const esCeldaActiva = (fila, columna) => {

  if (!palabraActiva.value) {
    return false
  }

  const celdas = obtenerCeldasPalabra(
    palabraActiva.value
  )

  return celdas.some(
    celda =>
      celda.fila === fila &&
      celda.columna === columna
  )
}

/*
========================================
SELECCIONAR CELDA
========================================
*/

const seleccionarCelda = (
  fila,
  columna
) => {

  if (juegoTerminado.value) {
    return
  }

  const celda = tablero.value[fila][columna]

  if (
    !celda ||
    celda.palabras.length === 0
  ) {
    return
  }

  /*
    Si la celda pertenece a varias palabras,
    intentamos mantener la palabra actual.
  */

  let nuevaPalabra = null

  if (
    palabraActiva.value &&
    celda.palabras.includes(
      palabraActiva.value.palabra
    )
  ) {

    nuevaPalabra = palabraActiva.value

  } else {

    nuevaPalabra = palabras.value.find(
      palabra =>
        celda.palabras.includes(
          palabra.palabra
        )
    )

  }

  palabraActiva.value = nuevaPalabra

  celdaActiva.value = {
    fila,
    columna
  }
}

/*
========================================
SELECCIONAR PALABRA
========================================
*/

const seleccionarPalabra = (palabra) => {

  if (juegoTerminado.value) {
    return
  }

  palabraActiva.value = palabra

  mensaje.value =
    `Resolviendo: ${palabra.palabra}`

  respuestaCorrecta.value = false

  /*
    Buscar primera casilla vacía.
  */

  const celdas =
    obtenerCeldasPalabra(palabra)

  const primeraVacia =
    celdas.find(
      celda =>
        obtenerLetra(
          celda.fila,
          celda.columna
        ) === ''
    )

  const objetivo =
    primeraVacia || celdas[0]

  celdaActiva.value = {
    fila: objetivo.fila,
    columna: objetivo.columna
  }

  nextTick(() => {

    enfocarCelda(
      objetivo.fila,
      objetivo.columna
    )

  })
}

/*
========================================
ENFOCAR CELDA
========================================
*/

const enfocarCelda = (
  fila,
  columna
) => {

  const input = document.querySelector(
    `[data-celda="${fila}-${columna}"]`
  )

  if (input) {
    input.focus()
  }
}

/*
========================================
ESCRIBIR LETRA
========================================
*/

const escribirLetra = (
  event,
  fila,
  columna
) => {

  if (juegoTerminado.value) {
    return
  }

  seleccionarCelda(
    fila,
    columna
  )

  const clave = obtenerClave(
    fila,
    columna
  )

  let valor = event.target.value

  valor = valor
    .replace(
      /[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g,
      ''
    )
    .toUpperCase()

  valor = valor.substring(
    0,
    1
  )

  respuestas.value[clave] = valor

  /*
    Avanzar automáticamente.
  */

  if (valor) {
    avanzarCasilla(
      fila,
      columna
    )
  }
}

/*
========================================
SIGUIENTE CASILLA
========================================
*/

const avanzarCasilla = async (
  fila,
  columna
) => {

  await nextTick()

  if (!palabraActiva.value) {
    return
  }

  const celdas =
    obtenerCeldasPalabra(
      palabraActiva.value
    )

  const posicion =
    celdas.findIndex(
      celda =>
        celda.fila === fila &&
        celda.columna === columna
    )

  if (posicion === -1) {
    return
  }

  /*
    Buscar siguiente espacio de la palabra.
  */

  for (
    let i = posicion + 1;
    i < celdas.length;
    i++
  ) {

    const siguiente = celdas[i]

    /*
      Si la palabra ya tiene esa casilla,
      podemos colocar ahí la siguiente letra.
    */

    if (
      !celdaCompletada(
        tablero.value[
          siguiente.fila
        ][
          siguiente.columna
        ]
      )
    ) {

      celdaActiva.value = {
        fila: siguiente.fila,
        columna: siguiente.columna
      }

      enfocarCelda(
        siguiente.fila,
        siguiente.columna
      )

      return
    }
  }
}

/*
========================================
CASILLA ANTERIOR
========================================
*/

const retrocederCasilla = (
  fila,
  columna
) => {

  if (!palabraActiva.value) {
    return
  }

  const celdas =
    obtenerCeldasPalabra(
      palabraActiva.value
    )

  const posicion =
    celdas.findIndex(
      celda =>
        celda.fila === fila &&
        celda.columna === columna
    )

  if (posicion <= 0) {
    return
  }

  const anterior =
    celdas[posicion - 1]

  celdaActiva.value = {
    fila: anterior.fila,
    columna: anterior.columna
  }

  enfocarCelda(
    anterior.fila,
    anterior.columna
  )
}

/*
========================================
TECLAS DEL TECLADO
========================================
*/

const manejarTecla = (
  event,
  fila,
  columna
) => {

  /*
    BACKSPACE
  */

  if (event.key === 'Backspace') {

    const clave =
      obtenerClave(
        fila,
        columna
      )

    if (
      respuestas.value[clave]
    ) {

      respuestas.value[clave] = ''

    } else {

      retrocederCasilla(
        fila,
        columna
      )

    }

    event.preventDefault()

    return
  }

  /*
    FLECHA DERECHA
  */

  if (event.key === 'ArrowRight') {

    moverPorTablero(
      fila,
      columna,
      0,
      1
    )

    event.preventDefault()

    return
  }

  /*
    FLECHA IZQUIERDA
  */

  if (event.key === 'ArrowLeft') {

    moverPorTablero(
      fila,
      columna,
      0,
      -1
    )

    event.preventDefault()

    return
  }

  /*
    FLECHA ABAJO
  */

  if (event.key === 'ArrowDown') {

    moverPorTablero(
      fila,
      columna,
      1,
      0
    )

    event.preventDefault()

    return
  }

  /*
    FLECHA ARRIBA
  */

  if (event.key === 'ArrowUp') {

    moverPorTablero(
      fila,
      columna,
      -1,
      0
    )

    event.preventDefault()

  }
}

/*
========================================
MOVER POR EL TABLERO
========================================
*/

const moverPorTablero = (
  fila,
  columna,
  cambioFila,
  cambioColumna
) => {

  let nuevaFila =
    fila + cambioFila

  let nuevaColumna =
    columna + cambioColumna

  while (
    nuevaFila >= 0 &&
    nuevaFila < filas &&
    nuevaColumna >= 0 &&
    nuevaColumna < columnas
  ) {

    const celda =
      tablero.value[
        nuevaFila
      ][
        nuevaColumna
      ]

    if (
      celda &&
      celda.palabras.length > 0
    ) {

      seleccionarCelda(
        nuevaFila,
        nuevaColumna
      )

      enfocarCelda(
        nuevaFila,
        nuevaColumna
      )

      return
    }

    nuevaFila += cambioFila
    nuevaColumna += cambioColumna
  }
}

/*
========================================
COMPROBAR PALABRA
========================================
*/

const comprobarPalabra = (
  palabra
) => {

  if (juegoTerminado.value) {
    return
  }

  if (palabraCompletada(palabra)) {

    mensaje.value =
      `La palabra ${palabra.palabra} ya fue completada.`

    respuestaCorrecta.value = true

    return
  }

  const celdas =
    obtenerCeldasPalabra(
      palabra
    )

  /*
    Comprobar que todas estén llenas.
  */

  const estaCompleta =
    celdas.every(
      celda =>
        obtenerLetra(
          celda.fila,
          celda.columna
        ) !== ''
    )

  if (!estaCompleta) {

    mensaje.value =
      `Completa todas las casillas de ${palabra.palabra}.`

    respuestaCorrecta.value = false

    return
  }

  /*
    Comprobar letras.
  */

  const esCorrecta =
    celdas.every(
      celda =>
        obtenerLetra(
          celda.fila,
          celda.columna
        ) === celda.letra
    )

  if (esCorrecta) {

    palabrasCompletadas.value.push(
      palabra.palabra
    )

    aciertos.value++

    puntuacion.value += 100

    mensaje.value =
      `¡Correcto! ${palabra.palabra}`

    respuestaCorrecta.value = true

    /*
      Comprobar final.
    */

    if (
      palabrasCompletadas.value.length ===
      palabras.value.length
    ) {

      finalizarJuego()
    }

  } else {

    errores.value++

    puntuacion.value =
      Math.max(
        0,
        puntuacion.value - 25
      )

    mensaje.value =
      `Hay una o más letras incorrectas en ${palabra.palabra}.`

    respuestaCorrecta.value = false
  }
}

/*
========================================
PROGRESO
========================================
*/

const progreso = computed(() => {

  return Math.round(
    (
      palabrasCompletadas.value.length /
      palabras.value.length
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

  tablero.value =
    generarTablero()

  respuestas.value = {}

  palabrasCompletadas.value = []

  aciertos.value = 0

  errores.value = 0

  puntuacion.value = 0

  tiempoTranscurrido.value = 0

  horaInicio.value = null

  horaFin.value = null

  juegoTerminado.value = false

  mensaje.value = ''

  respuestaCorrecta.value = false

  palabraActiva.value = null

  celdaActiva.value = {
    fila: null,
    columna: null
  }

  iniciarJuego()
}

/*
========================================
INICIO
========================================
*/

onMounted(() => {
  iniciarJuego()
})

/*
========================================
LIMPIEZA
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

    <header class="game-header">

      <h1>✏️ Crucigrama</h1>

      <p>
        Completa las palabras utilizando
        las pistas.
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
    <!-- PALABRA ACTIVA -->
    <!-- ================================= -->

    <div
      v-if="palabraActiva"
      class="active-word"
    >

      Palabra seleccionada:

      <strong>
        {{ palabraActiva.palabra }}
      </strong>

    </div>


    <!-- ================================= -->
    <!-- TABLERO -->
    <!-- ================================= -->

    <div class="crossword">

      <template
        v-for="(
          fila,
          filaIndex
        ) in tablero"

        :key="filaIndex"
      >

        <div
          v-for="(
            celda,
            columnaIndex
          ) in fila"

          :key="
            `${filaIndex}-${columnaIndex}`
          "

          class="cell"

          :class="{

            bloqueada:
              celda.palabras.length === 0,

            completada:
              celdaCompletada(celda),

            activa:
              esCeldaActiva(
                filaIndex,
                columnaIndex
              ),

            'celda-seleccionada':
              celdaActiva.fila === filaIndex &&
              celdaActiva.columna === columnaIndex

          }"
        >

          <!-- Número -->

          <span
            v-if="
              celda.numero !== null
            "

            class="cell-number"
          >

            {{ celda.numero }}

          </span>


          <!-- Input -->

          <input
            v-if="
              celda.palabras.length > 0
            "

            :data-celda="
              `${filaIndex}-${columnaIndex}`
            "

            :value="
              obtenerLetra(
                filaIndex,
                columnaIndex
              )
            "

            maxlength="1"

            autocomplete="off"

            :disabled="
              juegoTerminado ||
              celdaCompletada(celda)
            "

            @focus="
              seleccionarCelda(
                filaIndex,
                columnaIndex
              )
            "

            @click="
              seleccionarCelda(
                filaIndex,
                columnaIndex
              )
            "

            @input="
              escribirLetra(
                $event,
                filaIndex,
                columnaIndex
              )
            "

            @keydown="
              manejarTecla(
                $event,
                filaIndex,
                columnaIndex
              )
            "

          />

        </div>

      </template>

    </div>


    <!-- ================================= -->
    <!-- PISTAS -->
    <!-- ================================= -->

    <section class="clues">

      <h2>📚 Pistas</h2>


      <div
        v-for="(
          palabra,
          index
        ) in palabras"

        :key="palabra.palabra"

        class="clue"

        :class="{

          activa:
            palabraActiva &&
            palabraActiva.palabra ===
              palabra.palabra,

          completada:
            palabraCompletada(
              palabra
            )

        }"

        @click="
          seleccionarPalabra(
            palabra
          )
        "
      >

        <div class="clue-header">

          <strong>
            {{ index + 1 }}.
          </strong>

          <span
            v-if="
              palabraCompletada(
                palabra
              )
            "

            class="check"
          >

            ✓

          </span>

        </div>


        <p>
          {{ palabra.pista }}
        </p>


        <div class="clue-info">

          <span>
            {{ palabra.palabra.length }}
            letras
          </span>

          <span>

            {{
              palabra.direccion ===
              'horizontal'
                ? 'Horizontal'
                : 'Vertical'
            }}

          </span>

        </div>


        <button
          :disabled="
            palabraCompletada(
              palabra
            ) ||
            juegoTerminado
          "

          @click.stop="
            comprobarPalabra(
              palabra
            )
          "
        >

          {{
            palabraCompletada(
              palabra
            )
              ? 'Completada ✓'
              : 'Comprobar'
          }}

        </button>

      </div>

    </section>


    <!-- ================================= -->
    <!-- MENSAJE -->
    <!-- ================================= -->

    <p
      v-if="mensaje"

      class="message"

      :class="
        respuestaCorrecta
          ? 'correcto'
          : 'incorrecto'
      "
    >

      {{ mensaje }}

    </p>


    <!-- ================================= -->
    <!-- FINAL -->
    <!-- ================================= -->

    <div
      v-if="juegoTerminado"

      class="game-over"
    >

      <h2>
        🎉 ¡Crucigrama terminado!
      </h2>

      <p>
        Has completado todas las palabras.
      </p>


      <div class="final-stats">

        <p>
          <strong>Aciertos:</strong>
          {{ aciertos }}
        </p>

        <p>
          <strong>Errores:</strong>
          {{ errores }}
        </p>

        <p>
          <strong>Puntuación:</strong>
          {{ puntuacion }}
        </p>

        <p>
          <strong>Tiempo:</strong>
          {{ formatoTiempo(tiempoTranscurrido) }}
        </p>

      </div>


      <button
        class="restart-button"

        @click="reiniciarJuego"
      >

        Jugar nuevamente

      </button>

    </div>

  </div>

</template>

<style scoped>

/* ========================================
   CONTENEDOR
======================================== */

.game {

  max-width: 1050px;

  margin: 40px auto;

  padding: 20px;

  text-align: center;

}


.game-header {

  margin-bottom: 25px;

}


.game-header h1 {

  margin-bottom: 8px;

}


/* ========================================
   ESTADÍSTICAS
======================================== */

.stats {

  display: flex;

  justify-content: center;

  gap: 12px;

  margin: 25px 0;

  flex-wrap: wrap;

}


.stat {

  display: flex;

  flex-direction: column;

  align-items: center;

  min-width: 105px;

  padding: 12px 16px;

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
   PALABRA ACTIVA
======================================== */

.active-word {

  display: inline-block;

  margin: 15px auto;

  padding: 10px 18px;

  border-radius: 8px;

  background: #e3f2fd;

  border: 1px solid #90caf9;

}


/* ========================================
   TABLERO
======================================== */

.crossword {

  display: grid;

  grid-template-columns:
    repeat(15, 40px);

  grid-template-rows:
    repeat(10, 40px);

  gap: 2px;

  justify-content: center;

  margin: 35px auto;

}


/* ========================================
   CELDAS
======================================== */

.cell {

  position: relative;

  width: 40px;

  height: 40px;

  background: white;

  border: 1px solid #333;

  box-sizing: border-box;

}


.cell.bloqueada {

  background: #222;

  border-color: #222;

}


.cell.activa {

  background: #e8f4ff;

}


.cell.celda-seleccionada {

  background: #90caf9;

}


.cell.completada {

  background: #c8e6c9;

}


/* ========================================
   NÚMEROS
======================================== */

.cell-number {

  position: absolute;

  top: 2px;

  left: 3px;

  z-index: 2;

  font-size: 9px;

  font-weight: bold;

  color: #555;

  pointer-events: none;

}


/* ========================================
   INPUTS
======================================== */

.cell input {

  width: 100%;

  height: 100%;

  padding: 7px 2px 1px;

  border: none;

  outline: none;

  background: transparent;

  text-align: center;

  font-size: 21px;

  font-weight: bold;

  text-transform: uppercase;

  box-sizing: border-box;

}


.cell input:focus {

  background: #90caf9;

}


.cell.completada input {

  color: #176b2c;

}


/* ========================================
   PISTAS
======================================== */

.clues {

  max-width: 750px;

  margin: 40px auto;

  text-align: left;

}


.clues h2 {

  text-align: center;

  margin-bottom: 25px;

}


.clue {

  padding: 18px;

  margin-bottom: 15px;

  border: 1px solid #ddd;

  border-radius: 10px;

  background: #f8f8f8;

  cursor: pointer;

  transition:
    transform 0.15s,
    background-color 0.15s;

}


.clue:hover {

  transform: translateY(-2px);

}


.clue.activa {

  background: #e3f2fd;

  border-color: #2196f3;

}


.clue.completada {

  background: #e8f5e9;

  border-color: #66bb6a;

}


.clue-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

}


.clue-header strong {

  font-size: 18px;

}


.check {

  color: #2e7d32;

  font-size: 22px;

}


.clue p {

  margin: 10px 0;

}


/* ========================================
   INFORMACIÓN DE PISTA
======================================== */

.clue-info {

  display: flex;

  gap: 15px;

  margin-bottom: 12px;

  font-size: 14px;

  color: #666;

}


/* ========================================
   BOTÓN
======================================== */

.clue button {

  padding: 9px 15px;

  border: none;

  border-radius: 6px;

  cursor: pointer;

}


.clue button:disabled {

  cursor: default;

  opacity: 0.7;

}


/* ========================================
   MENSAJES
======================================== */

.message {

  margin: 25px 0;

  font-weight: bold;

}


.correcto {

  color: #2e7d32;

}


.incorrecto {

  color: #c62828;

}


/* ========================================
   FINAL
======================================== */

.game-over {

  margin: 30px auto;

  padding: 25px;

  max-width: 500px;

  border: 1px solid #ddd;

  border-radius: 12px;

  background: #f5f5f5;

}


.final-stats {

  margin: 20px 0;

}


.final-stats p {

  margin: 8px;

}


.restart-button {

  padding: 12px 24px;

  border: none;

  border-radius: 8px;

  cursor: pointer;

  font-size: 16px;

}


/* ========================================
   RESPONSIVE
======================================== */

@media (max-width: 750px) {

  .crossword {

    transform: scale(0.75);

    transform-origin: top center;

    margin-bottom: -80px;

  }

}

</style>
