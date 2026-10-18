<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted
} from 'vue'

import { useRoute, useRouter } from 'vue-router'
import BackToMenu from '../../components/BackToMenu.vue'
import { guardarResultadoPartida } from '../../utils/guardarResultadoPartida.js'

// ==========================================
// RUTA
// ==========================================

const route = useRoute()
const router = useRouter()

const idJuego = route.params.id


// ==========================================
// PALABRAS
// ==========================================

const palabras = ref([])

const pistas = ref([])

const cargando = ref(true)

const errorCarga = ref('')


// ==========================================
// LETRAS
// ==========================================

const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'


// ==========================================
// ESTADÍSTICAS
// ==========================================

const aciertos = ref(0)

const errores = ref(0)

const puntuacion = ref(0)


// ==========================================
// TIEMPO
// ==========================================

const tiempoTranscurrido = ref(0)

const horaInicio = ref(null)

const horaFin = ref(null)

let temporizador = null


// ==========================================
// ESTADO DEL JUEGO
// ==========================================

const juegoTerminado = ref(false)


// ==========================================
// TABLERO
// ==========================================

const tablero = ref([])


// ==========================================
// PALABRA SELECCIONADA
// ==========================================

const palabraSeleccionada = ref('')

const palabrasEncontradas = ref([])

const celdasSeleccionadas = ref([])

const mensaje = ref('')

const respuestaCorrecta = ref(false)

let seleccionEnCurso = false


// ==========================================
// OBTENER PALABRAS DESDE EL BACKEND
// ==========================================

const cargarPalabras = async () => {
  try {
    cargando.value = true
    errorCarga.value = ''

    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${idJuego}/palabras-sopa`
    )
    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || 'No se pudieron obtener las palabras'
      )
    }

    palabras.value = datos.map(item => item.palabra.toUpperCase())
    pistas.value = datos.map(item => item.pista)

    if (palabras.value.length === 0) {
      throw new Error('Este juego todavía no tiene palabras registradas')
    }

    tablero.value = generarTablero()
  } catch (error) {
    console.error('Error al cargar las palabras:', error)
    errorCarga.value = error.message || 'No se pudieron cargar las palabras'
  } finally {
    cargando.value = false
  }
}


// ==========================================
// GENERAR TABLERO
// ==========================================

const generarTablero = () => {

  const filas = 10

  const columnas = 10

  const tablero = Array.from(
    { length: filas },
    () => Array(columnas).fill('')
  )


  // ========================================
  // DIRECCIONES
  // ========================================

  const direcciones = [

    {
      fila: 0,
      columna: 1
    },

    {
      fila: 1,
      columna: 0
    },

    {
      fila: 1,
      columna: 1
    }

  ]


  // ========================================
  // COLOCAR PALABRAS
  // ========================================

  palabras.value.forEach((palabra) => {

    let colocada = false

    let intentos = 0

    const maxIntentos = 100


    while (
      !colocada &&
      intentos < maxIntentos
    ) {

      intentos++


      const direccion =
        direcciones[
          Math.floor(
            Math.random() *
            direcciones.length
          )
        ]


      const filaInicial =
        Math.floor(
          Math.random() *
          filas
        )


      const columnaInicial =
        Math.floor(
          Math.random() *
          columnas
        )


      const ultimaFila =
        filaInicial +
        direccion.fila *
        (palabra.length - 1)


      const ultimaColumna =
        columnaInicial +
        direccion.columna *
        (palabra.length - 1)


      // ====================================
      // COMPROBAR LÍMITES
      // ====================================

      if (
        ultimaFila < 0 ||
        ultimaFila >= filas ||
        ultimaColumna < 0 ||
        ultimaColumna >= columnas
      ) {

        continue

      }


      // ====================================
      // COMPROBAR COLISIONES
      // ====================================

      let puedeColocarse = true


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


      // ====================================
      // COLOCAR PALABRA
      // ====================================

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


  // ========================================
  // RELLENAR ESPACIOS
  // ========================================

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


// ==========================================
// FORMATO DEL TIEMPO
// ==========================================

const formatoTiempo = (segundos) => {

  const minutos =
    Math.floor(
      segundos / 60
    )


  const segundosRestantes =
    segundos % 60


  return `${String(minutos).padStart(2, '0')}:${String(
    segundosRestantes
  ).padStart(2, '0')}`

}


// ==========================================
// INICIAR TEMPORIZADOR
// ==========================================

const iniciarJuego = () => {

  horaInicio.value =
    new Date()


  temporizador =
    setInterval(() => {

      if (
        !juegoTerminado.value
      ) {

        tiempoTranscurrido.value++

      }

    }, 1000)

}


// ==========================================
// GUARDAR RESULTADO
// ==========================================

const guardarResultado = async () => {
  return guardarResultadoPartida({
    idJuego: Number(idJuego),
    horaInicio: horaInicio.value,
    horaFin: horaFin.value,
    tiempoTranscurrido: tiempoTranscurrido.value,
    aciertos: aciertos.value,
    errores: errores.value,
    puntuacion: puntuacion.value
  })
}


// ==========================================
// FINALIZAR JUEGO
// ==========================================

const finalizarJuego = async () => {

  if (
    juegoTerminado.value
  ) {

    return

  }


  juegoTerminado.value =
    true


  horaFin.value =
    new Date()


  clearInterval(
    temporizador
  )


  temporizador =
    null


  await guardarResultado()

}


// ==========================================
// SELECCIONAR LETRA
// ==========================================

const iniciarSeleccion = (evento, letra, fila, columna) => {
  if (
    evento.button !== 0 ||
    !evento.isPrimary ||
    juegoTerminado.value
  ) {
    return
  }

  limpiarSeleccion()
  mensaje.value = ''
  respuestaCorrecta.value = false
  seleccionEnCurso = true

  agregarCeldasSeleccionadas(letra, fila, columna)
}

const continuarSeleccion = (letra, fila, columna) => {
  if (!seleccionEnCurso || juegoTerminado.value) {
    return
  }

  agregarCeldasSeleccionadas(letra, fila, columna)
}

const agregarCeldasSeleccionadas = (letra, fila, columna) => {
  const celdas = celdasSeleccionadas.value

  if (celdas.length === 0) {
    celdas.push({ fila, columna })
    palabraSeleccionada.value = letra
    return
  }

  const indiceExistente = celdas.findIndex(celda =>
    celda.fila === fila && celda.columna === columna
  )

  if (indiceExistente !== -1) {
    if (indiceExistente < celdas.length - 1) {
      celdasSeleccionadas.value = celdas.slice(0, indiceExistente + 1)
      palabraSeleccionada.value = celdasSeleccionadas.value
        .map(celda => tablero.value[celda.fila][celda.columna])
        .join('')
      validarSeleccionAutomatica()
    }

    return
  }

  const origen = celdas[0]
  const diferenciaFila = fila - origen.fila
  const diferenciaColumna = columna - origen.columna
  const pasos = Math.max(
    Math.abs(diferenciaFila),
    Math.abs(diferenciaColumna)
  )

  if (pasos === 0) {
    return
  }

  let direccionFila
  let direccionColumna

  if (celdas.length === 1) {
    direccionFila = Math.sign(diferenciaFila)
    direccionColumna = Math.sign(diferenciaColumna)
  } else {
    direccionFila = celdas[1].fila - origen.fila
    direccionColumna = celdas[1].columna - origen.columna
  }

  if (
    diferenciaFila !== direccionFila * pasos ||
    diferenciaColumna !== direccionColumna * pasos ||
    pasos < celdas.length
  ) {
    return
  }

  for (let paso = celdas.length; paso <= pasos; paso++) {
    const filaActual = origen.fila + direccionFila * paso
    const columnaActual = origen.columna + direccionColumna * paso
    const letraActual = tablero.value[filaActual]?.[columnaActual]

    if (!letraActual) {
      return
    }

    celdasSeleccionadas.value.push({
      fila: filaActual,
      columna: columnaActual
    })
    palabraSeleccionada.value += letraActual
    validarSeleccionAutomatica()

    if (!seleccionEnCurso) {
      return
    }
  }
}

const finalizarSeleccion = () => {
  if (!seleccionEnCurso) {
    return
  }

  seleccionEnCurso = false

  if (celdasSeleccionadas.value.length < 2) {
    limpiarSeleccion()
    return
  }

  validarSeleccionAutomatica(true)
}

const cancelarSeleccion = () => {
  if (!seleccionEnCurso) {
    return
  }

  seleccionEnCurso = false
  limpiarSeleccion()
}


// ==========================================
// CELDA SELECCIONADA
// ==========================================

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


// ==========================================
// CELDA ENCONTRADA
// ==========================================

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


// ==========================================
// VALIDAR LÍNEA
// ==========================================

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


// ==========================================
// VALIDAR SELECCIÓN AUTOMÁTICAMENTE
// ==========================================

const limpiarSeleccion = () => {
  palabraSeleccionada.value = ''
  celdasSeleccionadas.value = []
}

const registrarError = (texto) => {
  seleccionEnCurso = false
  errores.value++
  puntuacion.value = Math.max(0, puntuacion.value - 25)
  mensaje.value = texto
  respuestaCorrecta.value = false
  limpiarSeleccion()
}

const registrarAcierto = (palabra) => {
  const yaEncontrada = palabrasEncontradas.value.some(
    encontrada => encontrada.palabra === palabra
  )

  if (yaEncontrada) {
    registrarError(`La palabra ${palabra} ya fue encontrada`)
    return
  }

  palabrasEncontradas.value.push({
    palabra,
    celdas: [...celdasSeleccionadas.value]
  })
  seleccionEnCurso = false
  aciertos.value++
  puntuacion.value += 100
  mensaje.value = `¡Correcto! Encontraste ${palabra}`
  respuestaCorrecta.value = true
  limpiarSeleccion()

  if (palabrasEncontradas.value.length === palabras.value.length) {
    finalizarJuego()
  }
}

const validarSeleccionAutomatica = (finalizada = false) => {
  const seleccion = palabraSeleccionada.value

  if (!seleccion) {
    return
  }

  if (!seleccionEsValida()) {
    if (finalizada) {
      registrarError('Las letras deben estar en línea recta.')
    }
    return
  }

  const palabraEncontrada = palabras.value.find(palabra =>
    palabra === seleccion || [...palabra].reverse().join('') === seleccion
  )

  if (palabraEncontrada) {
    if (finalizada) {
      registrarAcierto(palabraEncontrada)
    }

    return
  }

  const palabrasPendientes = palabras.value.filter(palabra =>
    !palabrasEncontradas.value.some(
      encontrada => encontrada.palabra === palabra
    )
  )
  const esPrefijoPosible = palabrasPendientes.some(palabra =>
    palabra.startsWith(seleccion) ||
    [...palabra].reverse().join('').startsWith(seleccion)
  )

  // Mientras se arrastra, la selección todavía puede convertirse en una
  // palabra válida. Penalizar solo al soltar evita errores por cada letra.
  if (finalizada && seleccion.length > 1 && !esPrefijoPosible) {
    registrarError('Palabra incorrecta')
    return
  }

  if (finalizada) {
    registrarError('Palabra incorrecta')
  }
}


// ==========================================
// REINICIAR JUEGO
// ==========================================

const reiniciarJuego = () => {

  clearInterval(
    temporizador
  )


  temporizador =
    null


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


// ==========================================
// PROGRESO
// ==========================================

const progreso = computed(() => {

  if (
    palabras.value.length === 0
  ) {

    return 0

  }


  return Math.round(
    (
      palabrasEncontradas.value.length /
      palabras.value.length
    ) * 100
  )

})


// ==========================================
// CARGAR JUEGO
// ==========================================

onMounted(async () => {

  await cargarPalabras()


  if (
    palabras.value.length > 0
  ) {

    iniciarJuego()

  }

})


// ==========================================
// DETENER TEMPORIZADOR
// ==========================================

onUnmounted(() => {

  clearInterval(
    temporizador
  )

})

</script>


<template>

  <div
    class="game"
    @pointerup.window="finalizarSeleccion"
    @pointercancel.window="cancelarSeleccion"
  >

    <BackToMenu />

    <p>
      Selecciona las letras para formar
      una palabra.
    </p>


    <!-- Cargando -->

    <div
      v-if="cargando"
      class="loading"
    >

      Cargando palabras...

    </div>


    <!-- Error -->

    <div
      v-else-if="errorCarga"
      class="error-carga"
    >

      {{ errorCarga }}

    </div>


    <!-- Juego -->

    <template
      v-else
    >

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


      <!-- Palabras por encontrar -->

      <div
        v-if="!juegoTerminado"
        class="word-list-container"
      >

        <h2>
          Palabras
        </h2>

        <ul class="word-list">

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

            @pointerdown.prevent="
              iniciarSeleccion(
                $event,
                letra,
                filaIndex,
                columnaIndex
              )
            "
            @pointerenter="
              continuarSeleccion(
                letra,
                filaIndex,
                columnaIndex
              )
            "
            @dragstart.prevent
          >

            {{ letra }}

          </button>

        </template>

      </div>


      <!-- Pantalla final -->

      <div
        v-if="juegoTerminado"
        class="game-over"
      >

        <h2>
          ¡Juego terminado!
        </h2>

        <p>
          Encontraste todas las palabras.
        </p>


        <div class="final-stats">

          <p>
            <strong>Aciertos:</strong>
            {{ aciertos }}
          </p>

          <p class="error-stat">
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


        <div class="final-actions">
          <button
            class="restart-button"
            @click="reiniciarJuego"
          >
            Volver a jugar
          </button>
          <button
            class="menu-button"
            @click="router.push('/home')"
          >
            Menú principal
          </button>
        </div>

      </div>


    </template>

  </div>

</template>


<style scoped>

.game {

  max-width: 750px;

  margin: 40px auto;

  text-align: center;

}


/* ==========================================
   CARGANDO Y ERROR
========================================== */

.loading {

  margin: 40px 0;

  font-size: 20px;

}


.error-carga {

  margin: 40px 0;

  padding: 20px;

  border-radius: 10px;

  background-color: #f8d7da;

  color: #842029;

}


/* ==========================================
   ESTADÍSTICAS
========================================== */

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


/* ==========================================
   PALABRA ACTUAL
========================================== */

.current-word {

  margin: 20px 0;

  font-size: 18px;

}


.current-word span {

  font-weight: bold;

  margin-left: 8px;

}


/* ==========================================
   PALABRAS POR ENCONTRAR
========================================== */

.word-list-container h2 {

  margin-bottom: 12px;

}

.word-list {

  display: flex;

  flex-wrap: wrap;

  justify-content: center;

  gap: 8px;

  margin: 0 auto 18px;

  padding: 0;

  list-style: none;

}

.word-list li {

  display: inline-flex;

  align-items: center;

  gap: 6px;

  padding: 7px 12px;

  border: 1px solid rgba(79, 70, 229, 0.2);

  border-radius: 12px;

  background: rgba(255, 255, 255, 0.62);

  color: #312e81;

  font-weight: 600;

}

.word-list li span {

  color: #16a34a;

  font-weight: 800;

}


/* ==========================================
   TABLERO
========================================== */

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

  border: 1px solid rgba(79, 70, 229, 0.22);

  border-radius: 10px;

  background: rgba(255, 255, 255, 0.58);

  color: #312e81;

  box-shadow: 0 2px 6px rgba(49, 46, 129, 0.08);

  backdrop-filter: blur(6px);

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  font-size: 18px;

  font-weight: bold;

  cursor: pointer;

  touch-action: none;

  user-select: none;

  -webkit-user-select: none;

}


/* ==========================================
   SELECCIÓN ACTUAL
========================================== */

.board button.seleccionada {

  border-color: #4f46e5;

  background-color: rgba(99, 102, 241, 0.42);

  color: #312e81;

  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.22), 0 4px 10px rgba(49, 46, 129, 0.16);

}


/* ==========================================
   PALABRA ENCONTRADA
========================================== */

.board button.encontrada {

  border-color: #16a34a;

  background-color: #22c55e;

  color: white;

  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.24);

}


/* ==========================================
   BOTÓN COMPROBAR
========================================== */

.check-button {

  padding: 10px 20px;

  cursor: pointer;

  border: none;

  border-radius: 8px;

  font-size: 16px;

}


/* ==========================================
   MENSAJES
========================================== */

.correcto {

  color: green;

  font-weight: bold;

}


.incorrecto {

  color: red;

  font-weight: bold;

}


/* ==========================================
   PANTALLA FINAL
========================================== */

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


/* ==========================================
   LISTA DE PALABRAS
========================================== */

ul {

  list-style: none;

  padding: 0;

}


li {

  margin: 8px;

}

</style>

<style scoped>
.game-over { position: fixed; z-index: 1100; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(560px,calc(100vw - 32px)); padding: 34px; border: 1px solid rgba(255,255,255,.8); border-radius: 28px; background: #fff; box-shadow: 0 30px 90px rgba(15,23,42,.4), 0 0 0 100vmax rgba(15,23,42,.42); text-align: center; }

.final-stats { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin: 24px 0; }
.final-stats p { display: grid; gap: 4px; margin: 0; padding: 14px 10px; border-radius: 16px; background: #f1f5f9; }
@media(max-width:560px){.game-over{padding:24px 18px}.final-stats{gap:8px}}
</style>

<style scoped>
.game-over{background:linear-gradient(135deg,#15803d 0%,#22c55e 48%,#16a34a 100%);background-size:180% 180%;color:#fff;border-color:rgba(255,255,255,.65);animation:resultado-brillo 4s ease-in-out infinite,resultado-entrada .3s ease-out}
.game-over h2,.game-over p,.game-over strong{color:#fff}
.final-stats p{background:rgba(255,255,255,.17)}
.final-stats .error-stat{background:rgba(255,255,255,.17)}
.final-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.final-actions button{margin:0;padding:12px 24px;border:0;border-radius:8px;font-weight:700;cursor:pointer}
.menu-button{background:rgba(255,255,255,.95);color:#166534}
.menu-button:hover{background:#dcfce7}
@media(max-width:480px){.final-actions{flex-direction:column}.final-actions button{width:100%}}
@keyframes resultado-brillo{0%,100%{background-position:0% 50%;box-shadow:0 30px 90px rgba(15,23,42,.4),0 0 0 100vmax rgba(15,23,42,.42),0 0 18px rgba(34,197,94,.2)}50%{background-position:100% 50%;box-shadow:0 30px 90px rgba(15,23,42,.4),0 0 0 100vmax rgba(15,23,42,.42),0 0 34px rgba(34,197,94,.55)}}
@keyframes resultado-entrada{from{opacity:0;transform:translate(-50%,-47%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@media(prefers-reduced-motion:reduce){.game-over{animation:none;background-position:50% 50%}}
</style>
