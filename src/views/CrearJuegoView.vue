<template>
  <div class="crear-juego">
    <HomeButton />

    <div class="contenedor">

      <h1>Crear juego</h1>

      <p class="subtitulo">
        Crea un nuevo juego educativo
      </p>

      <form @submit.prevent="crearJuego">

        <!-- Nombre -->
        <div class="campo">
          <label>Nombre del juego</label>

          <input
            v-model="nombre"
            type="text"
            placeholder="Ej. Animales vertebrados"
            required
          >
        </div>

        <!-- Descripción -->
        <div class="campo">
          <label>Descripción</label>

          <textarea
            v-model="descripcion"
            placeholder="Describe brevemente el juego"
            required
          ></textarea>
        </div>

        <div v-if="tipoSeleccionado === 'Crucigrama'" class="configuracion-sopa">
          <h2>Palabras del crucigrama</h2>
          <p class="ayuda">Escribe la respuesta y una pista. Indica la casilla inicial (fila 1–10, columna 1–15) y la dirección. Evita que las palabras se crucen con letras distintas.</p>
          <div v-for="(item, index) in palabrasCrucigrama" :key="index" class="palabra-item">
            <div class="numero">{{ index + 1 }}</div>
            <div class="campos-palabra">
              <input v-model="item.palabra" type="text" placeholder="Respuesta" required>
              <input v-model="item.pista" type="text" placeholder="Pista" required>
              <div class="posicion-palabra">
                <label>Fila <input v-model.number="item.fila" type="number" min="1" max="10" required></label>
                <label>Columna <input v-model.number="item.columna" type="number" min="1" max="15" required></label>
                <label>Dirección <select v-model="item.direccion"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label>
              </div>
            </div>
            <button v-if="palabrasCrucigrama.length > 1" type="button" class="btn-eliminar" @click="palabrasCrucigrama.splice(index, 1)">×</button>
          </div>
          <button type="button" class="btn-agregar" @click="agregarPalabraCrucigrama">+ Agregar palabra</button>
        </div>

        <!-- Instrucciones -->
        <div class="campo">
          <label>Instrucciones</label>

          <textarea
            v-model="instrucciones"
            placeholder="Escribe las instrucciones para los alumnos"
            required
          ></textarea>
        </div>

        <!-- Tipo de juego -->
        <div class="campo">
          <label>Tipo de juego</label>

          <select
            v-model="idTipo"
            required
          >
            <option value="" disabled>
              Selecciona un tipo
            </option>

            <option
              v-for="tipo in tipos"
              :key="tipo.id_tipo"
              :value="tipo.id_tipo"
            >
              {{ tipo.nombre }}
            </option>
          </select>
        </div>


        <!-- ================================= -->
        <!-- CONFIGURACIÓN SOPA DE LETRAS -->
        <!-- ================================= -->

        <div
          v-if="tipoSeleccionado === 'Sopa de letras'"
          class="configuracion-sopa"
        >

          <h2>Palabras de la sopa</h2>

          <p class="ayuda">
            Agrega las palabras que los alumnos deberán encontrar.
          </p>

          <div
            v-for="(item, index) in palabras"
            :key="index"
            class="palabra-item"
          >

            <div class="numero">
              {{ index + 1 }}
            </div>

            <div class="campos-palabra">

              <input
                v-model="item.palabra"
                type="text"
                placeholder="Palabra"
                required
              >

              <input
                v-model="item.pista"
                type="text"
                placeholder="Pista (opcional)"
              >

            </div>

            <button
              v-if="palabras.length > 1"
              type="button"
              class="btn-eliminar"
              @click="eliminarPalabra(index)"
            >
              ×
            </button>

          </div>


          <button
            type="button"
            class="btn-agregar"
            @click="agregarPalabra"
          >
            + Agregar palabra
          </button>

        </div>

<!-- ================================= -->
<!-- CONFIGURACIÓN MEMORAMA -->
<!-- ================================= -->

<div
  v-if="tipoSeleccionado === 'Memorama'"
  class="configuracion-sopa"
>
  <h2>Parejas del memorama</h2>

  <p class="ayuda">
    Agrega los elementos que los alumnos deberán relacionar.
    Por ejemplo, un concepto con su definición.
  </p>

  <div
    v-for="(item, index) in parejasMemorama"
    :key="index"
    class="palabra-item"
  >
    <div class="numero">
      {{ index + 1 }}
    </div>

    <div class="campos-palabra">
      <input
        v-model="item.elemento_1"
        type="text"
        placeholder="Concepto"
        required
      >

      <input
        v-model="item.elemento_2"
        type="text"
        placeholder="Definición o pareja"
        required
      >
    </div>

    <button
      v-if="parejasMemorama.length > 1"
      type="button"
      class="btn-eliminar"
      @click="eliminarParejaMemorama(index)"
    >
      ×
    </button>
  </div>

  <button
    type="button"
    class="btn-agregar"
    @click="agregarParejaMemorama"
  >
    + Agregar pareja
  </button>
</div>

<!-- ================================= -->
<!-- CONFIGURACIÓN DETECTIVE -->
<!-- ================================= -->

<div
  v-if="tipoSeleccionado === 'Detective'"
  class="configuracion-sopa"
>
  <h2>Enigmas del detective</h2>

  <p class="ayuda">
    Agrega los casos que los alumnos deberán resolver.
    Cada enigma necesita una materia, un título, una respuesta
    y tres pistas.
  </p>

  <div
    v-for="(item, index) in enigmasDetective"
    :key="index"
    class="palabra-item detective-item"
  >
    <div class="numero">
      {{ index + 1 }}
    </div>

    <div class="campos-palabra campos-detective">

      <input
        v-model="item.materia"
        type="text"
        placeholder="Materia"
        required
      >

      <input
        v-model="item.titulo"
        type="text"
        placeholder="Título del caso"
        required
      >

      <input
        v-model="item.respuesta"
        type="text"
        placeholder="Respuesta correcta"
        required
      >

      <input
        v-model="item.pista_1"
        type="text"
        placeholder="Pista 1 - Contextual (100 pts)"
        required
      >

      <input
        v-model="item.pista_2"
        type="text"
        placeholder="Pista 2 - Dato clave (60 pts)"
        required
      >

      <input
        v-model="item.pista_3"
        type="text"
        placeholder="Pista 3 - Muy reveladora (30 pts)"
        required
      >

    </div>

    <button
      v-if="enigmasDetective.length > 1"
      type="button"
      class="btn-eliminar"
      @click="eliminarEnigmaDetective(index)"
    >
      ×
    </button>

  </div>

  <button
    type="button"
    class="btn-agregar"
    @click="agregarEnigmaDetective"
  >
    + Agregar enigma
  </button>

</div>

        <div
          v-if="['Ruleta', 'Quiz', 'Preguntas'].includes(tipoSeleccionado)"
          class="configuracion-sopa"
        >

          <h2>
            {{ ['Quiz', 'Preguntas'].includes(tipoSeleccionado) ? 'Preguntas del Quiz' : 'Preguntas de la ruleta' }}
          </h2>

          <p class="ayuda">
            Agrega cada pregunta con cuatro opciones y selecciona la respuesta correcta.
          </p>

          <div
            v-for="(item, index) in preguntasOpcionMultiple"
            :key="index"
            class="palabra-item"
          >

            <div class="numero">
              {{ index + 1 }}
            </div>

            <div class="campos-palabra">
              <input v-model="item.pregunta" type="text" placeholder="Pregunta" required>
              <select v-model="item.respuesta_correcta" required aria-label="Respuesta correcta">
                <option value="A">Correcta: A</option>
                <option value="B">Correcta: B</option>
                <option value="C">Correcta: C</option>
                <option value="D">Correcta: D</option>
              </select>
              <input v-model="item.opcion_a" type="text" placeholder="Opción A" required>
              <input v-model="item.opcion_b" type="text" placeholder="Opción B" required>
              <input v-model="item.opcion_c" type="text" placeholder="Opción C" required>
              <input v-model="item.opcion_d" type="text" placeholder="Opción D" required>
            </div>

            <button
              v-if="preguntasOpcionMultiple.length > 1"
              type="button"
              class="btn-eliminar"
              :aria-label="`Eliminar pregunta ${index + 1}`"
              @click="eliminarPreguntaOpcionMultiple(index)"
            >
              ×
            </button>

          </div>

          <button
            type="button"
            class="btn-agregar"
            @click="agregarPreguntaOpcionMultiple"
          >
            + Agregar pregunta
          </button>

        </div>


        <!-- ================================= -->
        <!-- BOTONES -->
        <!-- ================================= -->

        <div class="acciones">

          <button
            type="button"
            class="btn-cancelar"
            @click="cancelar"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn-crear"
            :disabled="guardando"
          >
            {{ guardando ? 'Creando...' : 'Crear juego' }}
          </button>

        </div>

      </form>

    </div>

  </div>
</template>


<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeButton from '../components/HomeButton.vue'

const router = useRouter()


// ========================================
// DATOS DEL JUEGO
// ========================================

const nombre = ref('')
const descripcion = ref('')
const instrucciones = ref('')
const idTipo = ref('')


// ========================================
// TIPOS DE JUEGO
// ========================================

const tipos = ref([])


// ========================================
// PALABRAS DE LA SOPA
// ========================================

const palabras = ref([
  {
    palabra: '',
    pista: ''
  }
])

const palabrasCrucigrama = ref([{ palabra: '', pista: '', fila: 1, columna: 1, direccion: 'horizontal' }])
const preguntasOpcionMultiple = ref([{
  pregunta: '',
  opcion_a: '',
  opcion_b: '',
  opcion_c: '',
  opcion_d: '',
  respuesta_correcta: 'A'
}])

// ========================================
// PAREJAS DEL MEMORAMA
// ========================================

const parejasMemorama = ref([
  {
    elemento_1: '',
    elemento_2: ''
  }
])

function agregarParejaMemorama() {
  parejasMemorama.value.push({
    elemento_1: '',
    elemento_2: ''
  })
}

function eliminarParejaMemorama(index) {
  parejasMemorama.value.splice(index, 1)
}

// ========================================
// ENIGMAS DEL DETECTIVE
// ========================================

const enigmasDetective = ref([
  {
    materia: '',
    titulo: '',
    respuesta: '',
    pista_1: '',
    pista_2: '',
    pista_3: ''
  }
])

function agregarEnigmaDetective() {
  enigmasDetective.value.push({
    materia: '',
    titulo: '',
    respuesta: '',
    pista_1: '',
    pista_2: '',
    pista_3: ''
  })
}

function eliminarEnigmaDetective(index) {
  enigmasDetective.value.splice(index, 1)
}

// ========================================
// ESTADO
// ========================================

const guardando = ref(false)


// ========================================
// TIPO SELECCIONADO
// ========================================

const tipoSeleccionado = computed(() => {

  const tipo = tipos.value.find(
    tipo => String(tipo.id_tipo) === String(idTipo.value)
  )

  return tipo ? tipo.nombre : ''

})


// ========================================
// OBTENER TIPOS
// ========================================

async function cargarTipos() {

  try {

    const respuesta = await fetch(
      'http://localhost:3000/api/tipos-juego'
    )

    if (!respuesta.ok) {
      throw new Error('No se pudieron obtener los tipos')
    }

    tipos.value = await respuesta.json()

  } catch (error) {

    console.error(error)

    alert('No se pudieron cargar los tipos de juego')

  }

}


// ========================================
// AGREGAR PALABRA
// ========================================

function agregarPalabra() {

  palabras.value.push({
    palabra: '',
    pista: ''
  })

}


// ========================================
// ELIMINAR PALABRA
// ========================================

function eliminarPalabra(index) {

  palabras.value.splice(index, 1)

}

function agregarPalabraCrucigrama() {
  palabrasCrucigrama.value.push({
    palabra: '',
    pista: '',
    fila: Math.min(palabrasCrucigrama.value.length + 1, 10),
    columna: 1,
    direccion: 'horizontal'
  })
}

function agregarPreguntaOpcionMultiple() {
  preguntasOpcionMultiple.value.push({
    pregunta: '',
    opcion_a: '',
    opcion_b: '',
    opcion_c: '',
    opcion_d: '',
    respuesta_correcta: 'A'
  })
}

function eliminarPreguntaOpcionMultiple(index) {
  preguntasOpcionMultiple.value.splice(index, 1)
}


// ========================================
// CREAR JUEGO
// ========================================

async function crearJuego() {

  if (guardando.value) {
    return
  }

  let idJuegoCreado = null

  try {

    guardando.value = true


    // ==================================
    // CREAR JUEGO
    // ==================================

    const respuestaJuego = await fetch(
      'http://localhost:3000/api/juegos',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          nombre: nombre.value,
          descripcion: descripcion.value,
          instrucciones: instrucciones.value,
          id_tipo: idTipo.value,
          activo: true
        })
      }
    )


    const datosJuego = await respuestaJuego.json()


    if (!respuestaJuego.ok) {

      throw new Error(
        datosJuego.mensaje || 'No se pudo crear el juego'
      )

    }


    idJuegoCreado = datosJuego.juego.id_juego


    // ==================================
    // GUARDAR PALABRAS DE LA SOPA
    // ==================================

    if (tipoSeleccionado.value === 'Sopa de letras') {
      const respuestaSopa = await fetch(`http://localhost:3000/api/juegos/${idJuegoCreado}/palabras-sopa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palabras: palabras.value.map((item) => ({ palabra: item.palabra.trim(), pista: item.pista.trim() || null })) })
      })
      const datosSopa = await respuestaSopa.json()
      if (!respuestaSopa.ok) throw new Error(datosSopa.mensaje || 'No se pudo guardar la sopa de letras')

    } else if (tipoSeleccionado.value === 'Crucigrama') {
      const respuestaCrucigrama = await fetch(
        `http://localhost:3000/api/juegos/${idJuegoCreado}/crucigrama`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            palabras: palabrasCrucigrama.value.map((item) => ({
              ...item,
              fila: item.fila - 1,
              columna: item.columna - 1
            }))
          })
        }
      )
const datosCrucigrama = await respuestaCrucigrama.json()

      } else if (['Ruleta', 'Quiz', 'Preguntas'].includes(tipoSeleccionado.value)) {
        for (const item of preguntasOpcionMultiple.value) {
          const respuestaPregunta = await fetch(
            `http://localhost:3000/api/juegos/${idJuegoCreado}/preguntas`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pregunta: item.pregunta.trim(),
                opcion_a: item.opcion_a.trim(),
                opcion_b: item.opcion_b.trim(),
                opcion_c: item.opcion_c.trim(),
                opcion_d: item.opcion_d.trim(),
                respuesta_correcta: item.respuesta_correcta
              })
            }
          )
          const datosPregunta = await respuestaPregunta.json()
          if (!respuestaPregunta.ok) {
            throw new Error(datosPregunta.mensaje || 'No se pudo guardar una pregunta de la ruleta')
          }
        }

if (!respuestaCrucigrama.ok) {
  throw new Error(
    datosCrucigrama.mensaje ||
    'No se pudo guardar el crucigrama'
  )
}

} else if (tipoSeleccionado.value === 'Memorama') {

  // ==================================
  // GUARDAR PAREJAS DEL MEMORAMA
  // ==================================

  const respuestaMemorama = await fetch(
    `http://localhost:3000/api/juegos/${idJuegoCreado}/memorama`,
    {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        parejas: parejasMemorama.value.map((item) => ({
          elemento_1: item.elemento_1.trim(),
          elemento_2: item.elemento_2.trim()
        }))
      })
    }
  )

  const datosMemorama = await respuestaMemorama.json()

  if (!respuestaMemorama.ok) {
    throw new Error(
      datosMemorama.mensaje ||
      'No se pudieron guardar las parejas del memorama'
    )
  }

} else if (tipoSeleccionado.value === 'Detective') {

  // ==================================
  // GUARDAR ENIGMAS DEL DETECTIVE
  // ==================================

  const respuestaDetective = await fetch(
    `http://localhost:3000/api/juegos/${idJuegoCreado}/enigmas`,
    {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        enigmas: enigmasDetective.value.map((item) => ({
          materia: item.materia.trim(),
          titulo: item.titulo.trim(),
          respuesta: item.respuesta.trim(),
          pista_1: item.pista_1.trim(),
          pista_2: item.pista_2.trim(),
          pista_3: item.pista_3.trim()
        }))
      })
    }
  )

  const datosDetective = await respuestaDetective.json()

  if (!respuestaDetective.ok) {
    throw new Error(
      datosDetective.mensaje ||
      'No se pudieron guardar los enigmas del Detective'
    )
  }
}

    alert('Juego creado correctamente')

    router.push('/home')


  } catch (error) {

    if (idJuegoCreado) {
      try {
        const respuestaDesactivacion = await fetch(
          `http://localhost:3000/api/juegos/${idJuegoCreado}/desactivar`,
          { method: 'PATCH' }
        )

        if (!respuestaDesactivacion.ok) {
          console.error('No se pudo desactivar el juego incompleto')
        }
      } catch (errorDesactivacion) {
        console.error('No se pudo desactivar el juego incompleto:', errorDesactivacion)
      }
    }

    console.error(
      'Error al crear juego:',
      error
    )

    alert(
      error.message ||
      'Ocurrió un error al crear el juego'
    )

  } finally {

    guardando.value = false

  }

}



// ========================================
// CANCELAR
// ========================================

function cancelar() {

  router.push('/home')

}


// ========================================
// INICIAR
// ========================================

onMounted(() => {

  cargarTipos()

})

</script>

<style scoped>
.posicion-palabra{display:flex;gap:12px;flex-wrap:wrap}.posicion-palabra label{display:grid;gap:4px;font-size:.9rem}.posicion-palabra input{width:85px}.posicion-palabra select{min-width:130px}
</style>


<style scoped>

.crear-juego {
  min-height: 100vh;
  background: linear-gradient(145deg, #f4f6ff, #ecfeff);
  padding: 40px 20px;
}

.contenedor {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 35px;
  border-radius: 26px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

h1 {
  margin: 0;
  font-size: 32px;
  color: #222;
}

.subtitulo {
  margin-top: 8px;
  margin-bottom: 30px;
  color: #666;
}

.campo {
  margin-bottom: 20px;
}

.campo label {
  display: block;
  margin-bottom: 7px;
  font-weight: bold;
  color: #333;
}

.campo input,
.campo textarea,
.campo select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.campo textarea {
  min-height: 100px;
  resize: vertical;
}


/* ================================= */
/* SOPA DE LETRAS */
/* ================================= */

.configuracion-sopa {
  margin-top: 30px;
  padding: 25px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: #fafbff;
}

.configuracion-sopa h2 {
  margin-top: 0;
  margin-bottom: 5px;
}

.ayuda {
  color: #666;
  margin-bottom: 20px;
}

.palabra-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.numero {
  min-width: 28px;
  font-weight: bold;
}

.campos-palabra {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.campos-palabra input,
.campos-palabra select {
  padding: 11px;
  border: 1px solid #ccc;
  border-radius: 7px;
}

.btn-eliminar {
  border: none;
  background: #ffe5e5;
  color: #c62828;
  font-size: 22px;
  width: 35px;
  height: 35px;
  border-radius: 7px;
  cursor: pointer;
}

.btn-agregar {
  margin-top: 10px;
  padding: 10px 15px;
  border: 1px dashed #777;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}

.btn-agregar:hover {
  background: #f0f0f0;
}


/* ================================= */
/* BOTONES */
/* ================================= */

.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.acciones button {
  padding: 12px 22px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 15px;
}

.btn-cancelar {
  background: #e5e5e5;
  color: #333;
}

.btn-crear {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
}

.btn-crear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================= */
/* DETECTIVE */
/* ================================= */

.campos-detective {
  grid-template-columns: 1fr 1fr;
}

.detective-item {
  align-items: flex-start;
}

@media (max-width: 650px) {

  .contenedor {
    padding: 25px 20px;
  }

  .campos-palabra {
    grid-template-columns: 1fr;
  }

  .palabra-item {
    align-items: flex-start;
  }

}

</style>
