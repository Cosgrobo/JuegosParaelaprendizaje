```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const palabras = ref([
  'VUE',
  'HTML',
  'CSS',
  'JAVASCRIPT',
  'MYSQL'
])

const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/*
  Estadísticas
*/
const aciertos = ref(0)
const errores = ref(0)
const puntuacion = ref(0)

/*
  Tiempo
*/
const tiempoTranscurrido = ref(0)
const horaInicio = ref(null)
const horaFin = ref(null)

let temporizador = null

/*
  Estado del juego
*/
const juegoTerminado = ref(false)

/*
  Generar tablero
*/
const generarTablero = () => {

  const filas = 10
  const columnas = 10

  const tablero = Array.from(
    { length: filas },
    () => Array(columnas).fill('')
  )

  /*
    Direcciones permitidas

    Derecha
    Abajo
    Diagonal abajo-derecha

    Las palabras siempre se colocan
    en su orden normal.
  */
  const direcciones = [
    { fila: 0, columna: 1 },
    { fila: 1, columna: 0 },
    { fila: 1, columna: 1 }
  ]

  palabras.value.forEach((palabra) => {

    let colocada = false

    while (!colocada) {

      const direccion =
        direcciones[
          Math.floor(
            Math.random() * direcciones.length
          )
        ]

      const filaInicial =
        Math.floor(
          Math.random() * filas
        )

      const columnaInicial =
        Math.floor(
          Math.random() * columnas
        )

      const ultimaFila =
        filaInicial +
        direccion.fila *
          (palabra.length - 1)

      const ultimaColumna =
        columnaInicial +
        direccion.columna *
          (palabra.length - 1)

      /*
        Comprobar que la palabra
        no salga del tablero
      */
      if (
        ultimaFila < 0 ||
        ultimaFila >= filas ||
        ultimaColumna < 0 ||
        ultimaColumna >= columnas
      ) {
        continue
      }

      let puedeColocarse = true

      /*
        Comprobar que las letras
        no choquen con otras palabras
      */
      for (
        let i = 0;
        i < palabra.length;
        i++
      ) {

        const fila =
          filaInicial +
          direccion.fila * i

        const columna =
          columnaInicial +
          direccion.columna * i

        const letraActual =
          tablero[fila][columna]

        if (
          letraActual !== '' &&
          letraActual !== palabra[i]
        ) {
          puedeColocarse = false
          break
        }
      }

      if (!puedeColocarse) {
        continue
      }

      /*
        Colocar la palabra
        respetando su orden original
      */
      for (
        let i = 0;
        i < palabra.length;
        i++
      ) {

        const fila =
          filaInicial +
          direccion.fila * i

        const columna =
          columnaInicial +
          direccion.columna * i

        tablero[fila][columna] =
          palabra[i]
      }

      colocada = true
    }
  })

  /*
    Rellenar espacios vacíos
  */
  for (
    let fila = 0;
    fila < filas;
    fila++
  ) {

    for (
      let columna = 0;
      columna < columnas;
      columna++
    ) {

      if (
        tablero[fila][columna] === ''
      ) {

        const posicion =
          Math.floor(
            Math.random() *
              letras.length
          )

        tablero[fila][columna] =
          letras[posicion]
      }
    }
  }

  return tablero
}


const tablero = ref(
  generarTablero()
)

const palabraSeleccionada =
  ref('')

const palabrasEncontradas =
  ref([])

const celdasSeleccionadas =
  ref([])

const mensaje =
  ref('')

const respuestaCorrecta =
  ref(false)


/*
  Formatear segundos como MM:SS
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
  Iniciar temporizador
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
  Finalizar juego
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
  Seleccionar letra
*/
const seleccionarLetra = (
  letra,
  fila,
  columna
) => {

  if (juegoTerminado.value) {
    return
  }

  const ultimaCelda =
    celdasSeleccionadas.value[
      celdasSeleccionadas.value.length - 1
    ]

  if (ultimaCelda) {

    const diferenciaFila =
      Math.abs(
        fila - ultimaCelda.fila
      )

    const diferenciaColumna =
      Math.abs(
        columna - ultimaCelda.columna
      )

    /*
      Las letras seleccionadas deben
      estar juntas
    */
    if (
      diferenciaFila > 1 ||
      diferenciaColumna > 1
    ) {
      return
    }
  }

  /*
    Evitar seleccionar
    la misma celda dos veces
  */
  if (
    celdasSeleccionadas.value.some(
      (celda) =>
        celda.fila === fila &&
        celda.columna === columna
    )
  ) {
    return
  }

  palabraSeleccionada.value += letra

  celdasSeleccionadas.value.push({
    fila,
    columna
  })
}


/*
  Saber si una celda está
  seleccionada actualmente
*/
const estaSeleccionada = (
  fila,
  columna
) => {

  return celdasSeleccionadas.value.some(
    (celda) =>
      celda.fila === fila &&
      celda.columna === columna
  )
}


/*
  Saber si una celda pertenece
  a una palabra encontrada
*/
const estaEncontrada = (
  fila,
  columna
) => {

  return palabrasEncontradas.value.some(
    (palabra) =>
      palabra.celdas.some(
        (celda) =>
          celda.fila === fila &&
          celda.columna === columna
      )
  )
}


/*
  Comprobar que las letras
  formen una línea recta
*/
const seleccionEsValida = () => {

  if (
    celdasSeleccionadas.value.length < 2
  ) {
    return true
  }

  const primera =
    celdasSeleccionadas.value[0]

  const segunda =
    celdasSeleccionadas.value[1]

  const diferenciaFila =
    segunda.fila -
    primera.fila

  const diferenciaColumna =
    segunda.columna -
    primera.columna

  const direccionFila =
    Math.sign(
      diferenciaFila
    )

  const direccionColumna =
    Math.sign(
      diferenciaColumna
    )

  for (
    let i = 1;
    i < celdasSeleccionadas.value.length;
    i++
  ) {

    const celda =
      celdasSeleccionadas.value[i]

    const filaEsperada =
      primera.fila +
      direccionFila * i

    const columnaEsperada =
      primera.columna +
      direccionColumna * i

    if (
      celda.fila !== filaEsperada ||
      celda.columna !== columnaEsperada
    ) {
      return false
    }
  }

  return true
}


/*
  Comprobar palabra
*/
const comprobarPalabra = () => {

  if (juegoTerminado.value) {
    return
  }

  const palabra =
    palabraSeleccionada.value

  /*
    No hay selección
  */
  if (!palabra) {

    mensaje.value =
      'Selecciona una palabra primero.'

    respuestaCorrecta.value =
      false

    return
  }

  /*
    Comprobar línea
  */
  if (
    !seleccionEsValida()
  ) {

    mensaje.value =
      'Las letras deben estar en línea.'

    respuestaCorrecta.value =
      false

    errores.value++

    puntuacion.value =
      Math.max(
        0,
        puntuacion.value - 25
      )
  }

  /*
    Comprobar palabra
  */
  else if (
    palabras.value.includes(
      palabra
    )
  ) {

    const palabraEncontrada =
      palabra

    /*
      Comprobar si ya fue encontrada
    */
    const yaEncontrada =
      palabrasEncontradas.value.some(
        (encontrada) =>
          encontrada.palabra ===
          palabraEncontrada
      )

    if (!yaEncontrada) {

      palabrasEncontradas.value.push({

        palabra:
          palabraEncontrada,

        celdas: [
          ...celdasSeleccionadas.value
        ]

      })

      /*
        Actualizar estadísticas
      */
      aciertos.value++

      puntuacion.value += 100

      mensaje.value =
        `¡Correcto! Encontraste ${palabraEncontrada}`

      respuestaCorrecta.value =
        true

      /*
        Comprobar si terminó el juego
      */
      if (
        palabrasEncontradas.value.length ===
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
        `La palabra ${palabraEncontrada} ya fue encontrada`

      respuestaCorrecta.value =
        false
    }

  }

  /*
    Palabra incorrecta
  */
  else {

    errores.value++

    puntuacion.value =
      Math.max(
        0,
        puntuacion.value - 25
      )

    mensaje.value =
      'Palabra incorrecta'

    respuestaCorrecta.value =
      false
  }

  /*
    Limpiar selección
  */
  palabraSeleccionada.value =
    ''

  celdasSeleccionadas.value =
    []
}


/*
  Reiniciar juego
*/
const reiniciarJuego = () => {

  clearInterval(temporizador)

  temporizador = null

  tablero.value =
    generarTablero()

  palabraSeleccionada.value =
    ''

  palabrasEncontradas.value =
    []

  celdasSeleccionadas.value =
    []

  mensaje.value =
    ''

  respuestaCorrecta.value =
    false

  aciertos.value =
    0

  errores.value =
    0

  puntuacion.value =
    0

  tiempoTranscurrido.value =
    0

  horaInicio.value =
    null

  horaFin.value =
    null

  juegoTerminado.value =
    false

  iniciarJuego()
}


/*
  Progreso
*/
const progreso = computed(() => {

  return Math.round(
    (
      palabrasEncontradas.value.length /
      palabras.value.length
    ) * 100
  )
})


/*
  Iniciar al cargar el componente
*/
onMounted(() => {

  iniciarJuego()

})


/*
  Detener temporizador
*/
onUnmounted(() => {

  clearInterval(temporizador)

})

</script>


<template>

  <div class="game">

    <h1>Sopa de letras</h1>

    <p>
      Selecciona las letras para formar
      una palabra.
    </p>


    <!-- Estadísticas -->

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


    <!-- Palabra actual -->

    <div class="current-word">

      <strong>
        Palabra:
      </strong>

      <span>
        {{ palabraSeleccionada || '---' }}
      </span>

    </div>


    <!-- Tablero -->

    <div class="board">

      <template
        v-for="(
          fila,
          filaIndex
        ) in tablero"

        :key="filaIndex"
      >

        <button
          v-for="(
            letra,
            columnaIndex
          ) in fila"

          :key="columnaIndex"

          :class="{

            seleccionada:
              estaSeleccionada(
                filaIndex,
                columnaIndex
              ),

            encontrada:
              estaEncontrada(
                filaIndex,
                columnaIndex
              )

          }"

          @click="
            seleccionarLetra(
              letra,
              filaIndex,
              columnaIndex
            )
          "
        >

          {{ letra }}

        </button>

      </template>

    </div>


    <!-- Comprobar -->

    <button
      v-if="!juegoTerminado"

      class="check-button"

      @click="
        comprobarPalabra
      "
    >

      Comprobar palabra

    </button>


    <!-- Mensaje -->

    <p
      v-if="mensaje"

      :class="
        respuestaCorrecta
          ? 'correcto'
          : 'incorrecto'
      "
    >

      {{ mensaje }}

    </p>


    <!-- Pantalla final -->

    <div
      v-if="juegoTerminado"
      class="game-over"
    >

      <h2>
        🎉 ¡Juego terminado!
      </h2>

      <p>
        Encontraste todas las palabras.
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


    <!-- Lista de palabras -->

    <div
      v-if="!juegoTerminado"
    >

      <h2>Palabras</h2>

      <ul>

        <li
          v-for="palabra in palabras"

          :key="palabra"
        >

          {{ palabra }}

          <span
            v-if="
              palabrasEncontradas.some(
                encontrada =>
                  encontrada.palabra ===
                  palabra
              )
            "
          >

            ✓

          </span>

        </li>

      </ul>

    </div>

  </div>

</template>


<style scoped>

.game {

  max-width: 750px;

  margin: 40px auto;

  text-align: center;

}


/*
  Estadísticas
*/

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

  min-width: 100px;

  padding: 12px;

  border: 1px solid #ddd;

  border-radius: 10px;

  background-color: #f5f5f5;

}


.stat strong {

  font-size: 14px;

  margin-bottom: 5px;

}


.stat span {

  font-size: 21px;

  font-weight: bold;

}


/*
  Palabra actual
*/

.current-word {

  margin: 20px 0;

  font-size: 18px;

}


.current-word span {

  font-weight: bold;

  margin-left: 8px;

}


/*
  Tablero
*/

.board {

  display: grid;

  grid-template-columns:
    repeat(10, 50px);

  gap: 5px;

  justify-content: center;

  margin: 30px auto;

}


.board button {

  width: 50px;

  height: 50px;

  font-size: 18px;

  font-weight: bold;

  cursor: pointer;

}


/*
  Selección actual
*/

.board button.seleccionada {

  background-color: #4caf50;

  color: white;

}


/*
  Palabra encontrada
*/

.board button.encontrada {

  background-color: #2196f3;

  color: white;

}


/*
  Botón comprobar
*/

.check-button {

  padding: 10px 20px;

  cursor: pointer;

  border: none;

  border-radius: 8px;

  font-size: 16px;

}


/*
  Mensajes
*/

.correcto {

  color: green;

  font-weight: bold;

}


.incorrecto {

  color: red;

  font-weight: bold;

}


/*
  Pantalla final
*/

.game-over {

  margin-top: 30px;

  padding: 25px;

  border: 1px solid #ddd;

  border-radius: 12px;

  background-color: #f5f5f5;

}


.game-over h2 {

  margin-bottom: 10px;

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


/*
  Lista de palabras
*/

ul {

  list-style: none;

  padding: 0;

}


li {

  margin: 8px;

}

</style>
