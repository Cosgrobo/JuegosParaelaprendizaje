<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const nombre = ref('')
const descripcion = ref('')
const instrucciones = ref('')
const activo = ref(true)
const tipo = ref('')
const palabrasSopa = ref([])
const palabrasCrucigrama = ref([])

const cargando = ref(true)
const guardando = ref(false)

const mensaje = ref('')
const tipoMensaje = ref('')

const obtenerJuego = async () => {
  try {
    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${route.params.id}`
    )

    if (!respuesta.ok) {
      throw new Error('No se pudo obtener el juego')
    }

    const juego = await respuesta.json()

    nombre.value = juego.nombre
    descripcion.value = juego.descripcion
    instrucciones.value = juego.instrucciones
    activo.value = Boolean(juego.activo)
    tipo.value = juego.tipo
    if (tipo.value === 'Sopa de letras') {
      const contenido = await fetch(`http://localhost:3000/api/juegos/${route.params.id}/palabras-sopa`)
      palabrasSopa.value = await contenido.json()
    } else if (tipo.value === 'Crucigrama') {
      const contenido = await fetch(`http://localhost:3000/api/juegos/${route.params.id}/crucigrama`)
      const datos = await contenido.json()
      palabrasCrucigrama.value = datos.map((item) => ({ ...item, fila: Number(item.fila) + 1, columna: Number(item.columna) + 1 }))
    }

  } catch (error) {

    console.error(error)

    mensaje.value = 'No se pudo cargar el juego'
    tipoMensaje.value = 'error'

  } finally {

    cargando.value = false

  }
}

const guardarCambios = async () => {

  mensaje.value = ''
  guardando.value = true

  try {

    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${route.params.id}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          nombre: nombre.value,
          descripcion: descripcion.value,
          instrucciones: instrucciones.value,
          activo: activo.value
        })
      }
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {

      mensaje.value = datos.mensaje
      tipoMensaje.value = 'error'

      return
    }

    if (tipo.value === 'Sopa de letras' || tipo.value === 'Crucigrama') {
      const endpoint = tipo.value === 'Sopa de letras' ? 'palabras-sopa' : 'crucigrama'
      const contenido = tipo.value === 'Sopa de letras'
        ? { palabras: palabrasSopa.value }
        : { palabras: palabrasCrucigrama.value.map((item) => ({ ...item, fila: item.fila - 1, columna: item.columna - 1 })) }
      const respuestaContenido = await fetch(`http://localhost:3000/api/juegos/${route.params.id}/${endpoint}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contenido)
      })
      const datosContenido = await respuestaContenido.json()
      if (!respuestaContenido.ok) throw new Error(datosContenido.mensaje || 'No se pudo guardar el contenido del juego')
    }

    mensaje.value = 'Juego actualizado correctamente'
    tipoMensaje.value = 'exito'

    setTimeout(() => {
        router.push('/home')
    }, 1000)

  } catch (error) {

    console.error(error)

    mensaje.value = error.message || 'No se pudo conectar con el servidor'
    tipoMensaje.value = 'error'

  } finally {

    guardando.value = false

  }
}

const volver = () => {
  router.push('/home')
}

onMounted(() => {
  obtenerJuego()
})
</script>

<template>

  <div class="editar">

    <div class="editar-card">

      <h1>✏️ Editar juego</h1>

      <p class="subtitulo">
        Modifica la información del juego
      </p>

      <div v-if="cargando" class="cargando">
        Cargando juego...
      </div>

      <form
        v-else
        @submit.prevent="guardarCambios"
      >

        <div class="campo">

          <label for="nombre">
            Nombre
          </label>

          <input
            id="nombre"
            v-model="nombre"
            type="text"
            maxlength="100"
            required
          >

        </div>

        <div class="campo">

          <label for="descripcion">
            Descripción
          </label>

          <textarea
            id="descripcion"
            v-model="descripcion"
            rows="3"
            required
          ></textarea>

        </div>

        <div class="campo">

          <label for="instrucciones">
            Instrucciones
          </label>

          <textarea
            id="instrucciones"
            v-model="instrucciones"
            rows="5"
            required
          ></textarea>

        </div>

        <div class="campo"><label>Tipo de juego</label><input :value="tipo" disabled></div>

        <section v-if="tipo === 'Sopa de letras'" class="contenido-editor">
          <h2>Palabras de la sopa</h2>
          <div v-for="(item, index) in palabrasSopa" :key="index" class="fila-editor">
            <input v-model="item.palabra" maxlength="10" placeholder="Palabra" required>
            <input v-model="item.pista" placeholder="Pista opcional">
            <button v-if="palabrasSopa.length > 1" type="button" @click="palabrasSopa.splice(index, 1)">Quitar</button>
          </div>
          <button type="button" @click="palabrasSopa.push({ palabra: '', pista: '' })">+ Agregar palabra</button>
        </section>

        <section v-if="tipo === 'Crucigrama'" class="contenido-editor">
          <h2>Palabras del crucigrama</h2>
          <p>Usa filas 1–10 y columnas 1–15. Los cruces deben compartir la misma letra.</p>
          <div v-for="(item, index) in palabrasCrucigrama" :key="index" class="fila-editor">
            <input v-model="item.palabra" placeholder="Respuesta" required>
            <input v-model="item.pista" placeholder="Pista" required>
            <label>Fila <input v-model.number="item.fila" type="number" min="1" max="10" required></label>
            <label>Columna <input v-model.number="item.columna" type="number" min="1" max="15" required></label>
            <select v-model="item.direccion"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select>
            <button v-if="palabrasCrucigrama.length > 1" type="button" @click="palabrasCrucigrama.splice(index, 1)">Quitar</button>
          </div>
          <button type="button" @click="palabrasCrucigrama.push({ palabra: '', pista: '', fila: 1, columna: 1, direccion: 'horizontal' })">+ Agregar palabra</button>
        </section>

        <div class="activo">

          <input
            id="activo"
            v-model="activo"
            type="checkbox"
          >

          <label for="activo">
            Juego activo
          </label>

        </div>

        <p
          v-if="mensaje"
          :class="tipoMensaje"
        >
          {{ mensaje }}
        </p>

        <div class="botones">

          <button
            type="button"
            class="cancelar"
            @click="volver"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="guardar"
            :disabled="guardando"
          >
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </button>

        </div>

      </form>

    </div>

  </div>

</template>

<style scoped>
.contenido-editor{margin:24px 0;padding:20px;background:#f8fafc;border-radius:12px}.fila-editor{display:flex;gap:10px;margin:10px 0;align-items:center;flex-wrap:wrap}.fila-editor input{flex:1;min-width:130px;padding:10px}.fila-editor label{display:grid;gap:4px}.fila-editor label input{width:75px;min-width:0}

.editar {
  min-height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 30px;

  background: linear-gradient(145deg, #f4f6ff, #ecfeff);
}

.editar-card {
  width: 100%;
  max-width: 600px;

  padding: 35px;

  background: white;

  border-radius: 26px;

  box-shadow:
    0 5px 20px rgba(0, 0, 0, 0.08);
}

.editar-card h1 {
  margin-bottom: 8px;

  color: #1e3a5f;
}

.subtitulo {
  margin-bottom: 30px;

  color: #64748b;
}

form {
  display: flex;
  flex-direction: column;

  gap: 20px;
}

.campo {
  display: flex;
  flex-direction: column;

  gap: 7px;
}

.campo label {
  font-weight: 600;

  color: #334155;
}

input,
textarea {
  width: 100%;

  box-sizing: border-box;

  padding: 12px;

  border: 1px solid #cbd5e1;

  border-radius: 8px;

  font-family: inherit;

  font-size: 15px;

  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: #4f46e5;

  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.1);
}

.activo {
  display: flex;

  align-items: center;

  gap: 8px;
}

.activo input {
  width: auto;
}

.botones {
  display: flex;

  justify-content: flex-end;

  gap: 10px;

  margin-top: 10px;
}

.botones button {
  padding: 11px 18px;

  border: none;

  border-radius: 8px;

  font-size: 15px;

  cursor: pointer;
}

.cancelar {
  background: #e2e8f0;

  color: #334155;
}

.guardar {
  background: linear-gradient(135deg, #4f46e5, #6366f1);

  color: white;
}

.guardar:hover {
  background: linear-gradient(135deg, #3730a3, #4f46e5);
}

.guardar:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.error {
  padding: 10px;

  border-radius: 8px;

  background: #fef2f2;

  color: #b91c1c;
}

.exito {
  padding: 10px;

  border-radius: 8px;

  background: #f0fdf4;

  color: #15803d;
}

.cargando {
  text-align: center;

  color: #64748b;
}

</style>
