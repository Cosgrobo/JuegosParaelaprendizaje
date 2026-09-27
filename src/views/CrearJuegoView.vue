<template>
  <div class="crear-juego">

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


// ========================================
// CREAR JUEGO
// ========================================

async function crearJuego() {

  if (guardando.value) {
    return
  }

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


    const idJuego = datosJuego.juego.id_juego


    // ==================================
    // GUARDAR PALABRAS DE LA SOPA
    // ==================================

    if (tipoSeleccionado.value === 'Sopa de letras') {

      for (const item of palabras.value) {

        if (!item.palabra.trim()) {
          continue
        }

        const respuestaPalabra = await fetch(
          `http://localhost:3000/api/juegos/${idJuego}/palabras-sopa`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              palabra: item.palabra.trim(),
              pista: item.pista.trim() || null
            })
          }
        )


        const datosPalabra =
          await respuestaPalabra.json()


        if (!respuestaPalabra.ok) {

          throw new Error(
            datosPalabra.mensaje ||
            'No se pudo guardar una palabra'
          )

        }

      }

    }


    alert('Juego creado correctamente')

    router.push('/home')


  } catch (error) {

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

.crear-juego {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 40px 20px;
}

.contenedor {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 35px;
  border-radius: 15px;
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

.campos-palabra input {
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
  background: #2563eb;
  color: white;
}

.btn-crear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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