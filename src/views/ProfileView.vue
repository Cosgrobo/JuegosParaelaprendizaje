<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import HomeButton from '../components/HomeButton.vue'

const router = useRouter()

const usuario = ref(null)
const fotoPerfil = ref('')
const errorFoto = ref('')

const resultados = ref([])
const cargandoResultados = ref(false)
const errorResultados = ref('')
const unidadSeleccionada = ref('todas')

const resultadosPorUnidad = computed(() => {
  const grupos = new Map()

  for (const resultado of resultados.value) {
    const clave = resultado.id_unidad == null
      ? 'sin-unidad'
      : String(resultado.id_unidad)

    if (!grupos.has(clave)) {
      grupos.set(clave, {
        id_unidad: resultado.id_unidad,
        nombre: resultado.unidad || 'Sin unidad asignada',
        resultados: [],
        totalPuntos: 0
      })
    }

    const grupo = grupos.get(clave)
    grupo.resultados.push(resultado)
    grupo.totalPuntos += Number(resultado.puntuacion) || 0
  }

  return [...grupos.values()].sort((a, b) => {
    if (a.id_unidad == null) return 1
    if (b.id_unidad == null) return -1
    return Number(a.id_unidad) - Number(b.id_unidad)
  })
})

const gruposVisibles = computed(() => {
  if (unidadSeleccionada.value === 'todas') {
    return resultadosPorUnidad.value
  }

  return resultadosPorUnidad.value.filter((grupo) =>
    String(grupo.id_unidad ?? 'sin-unidad') === unidadSeleccionada.value
  )
})

const iniciales = computed(() => {
  const nombre = usuario.value?.nombre || usuario.value?.usuario || 'U'

  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
})

const cargarResultados = async () => {
  if (!usuario.value?.id_usuario) {
    return
  }

  cargandoResultados.value = true
  errorResultados.value = ''

  try {
    const respuesta = await fetch(
      `http://localhost:3000/api/resultados/usuario/${usuario.value.id_usuario}`
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || 'No se pudo obtener el historial'
      )
    }

    resultados.value = datos

  } catch (error) {
    console.error(
      'Error al cargar el historial:',
      error
    )

    errorResultados.value =
      'No se pudo cargar el historial de partidas.'
  } finally {
    cargandoResultados.value = false
  }
}

const formatearTiempo = (segundos) => {
  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60

  return `${minutos} min ${segundosRestantes} s`
}

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaTexto = String(fecha)
  const partesFecha = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const fechaLocal = partesFecha
    ? new Date(
      Number(partesFecha[1]),
      Number(partesFecha[2]) - 1,
      Number(partesFecha[3])
    )
    : new Date(fechaTexto)

  if (Number.isNaN(fechaLocal.getTime())) {
    return 'Sin fecha'
  }

  return fechaLocal.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

onMounted(() => {
  try {
    usuario.value = JSON.parse(
      localStorage.getItem('usuario')
    )

    fotoPerfil.value =
      localStorage.getItem('fotoPerfil') || ''

  } catch {
    usuario.value = null
  }

  if (!usuario.value) {
    router.replace('/')
    return
  }

  cargarResultados()
})

async function cambiarFoto(evento) {
  const archivo = evento.target.files?.[0]

  evento.target.value = ''
  errorFoto.value = ''

  if (!archivo) return

  if (!archivo.type.startsWith('image/')) {
    errorFoto.value =
      'Selecciona un archivo de imagen.'

    return
  }

  try {
    const imagen = await createImageBitmap(archivo)

    const lado = Math.min(
      imagen.width,
      imagen.height
    )

    const x =
      (imagen.width - lado) / 2

    const y =
      (imagen.height - lado) / 2

    const canvas =
      document.createElement('canvas')

    canvas.width = 256
    canvas.height = 256

    canvas
      .getContext('2d')
      .drawImage(
        imagen,
        x,
        y,
        lado,
        lado,
        0,
        0,
        256,
        256
      )

    imagen.close()

    const fotoComprimida =
      canvas.toDataURL(
        'image/webp',
        0.8
      )

    localStorage.setItem(
      'fotoPerfil',
      fotoComprimida
    )

    fotoPerfil.value =
      fotoComprimida

  } catch (error) {
    console.error(
      'No se pudo guardar la foto de perfil:',
      error
    )

    errorFoto.value =
      'No se pudo guardar la foto. Prueba con otra imagen.'
  }
}

function cerrarSesion() {
  localStorage.removeItem('usuario')
  router.push('/')
}
</script>

<template>
  <div
    v-if="usuario"
    class="profile-page"
  >
    <header class="profile-navbar">
      <HomeButton variant="dark" />

      <span class="navbar-title">
        Mi perfil
      </span>
    </header>

    <main class="profile-content">

      <section
        class="profile-card"
        aria-labelledby="profile-heading"
      >

        <!-- INFORMACIÓN DEL USUARIO -->

        <div class="profile-heading">

          <div class="avatar-wrap">

            <div class="avatar">

              <img
                v-if="fotoPerfil"
                :src="fotoPerfil"
                alt="Foto de perfil"
              >

              <span
                v-else
                aria-hidden="true"
              >
                {{ iniciales }}
              </span>

            </div>

            <label
              class="photo-button"
              for="foto-perfil"
            >
              Cambiar foto
            </label>

            <input
              id="foto-perfil"
              class="file-input"
              type="file"
              accept="image/*"
              aria-label="Elegir foto de perfil"
              @change="cambiarFoto"
            >

          </div>

          <div>

            <p class="eyebrow">
              CUENTA
            </p>

            <h1 id="profile-heading">
              {{ usuario.nombre || usuario.usuario }}
            </h1>

            <p class="profile-handle">
              @{{ usuario.usuario }}
            </p>

          </div>

          <button
            class="logout-button"
            type="button"
            @click="cerrarSesion"
          >
            Cerrar sesión
          </button>

        </div>

        <div class="divider"></div>

        <h2>
          Información de usuario
        </h2>

        <dl class="profile-details">

          <div class="detail-row">

            <dt>Nombre</dt>

            <dd>
              {{ usuario.nombre || 'Sin nombre' }}
            </dd>

          </div>

          <div class="detail-row">

            <dt>Nombre de usuario</dt>

            <dd>
              {{ usuario.usuario || 'No disponible' }}
            </dd>

          </div>

        </dl>

        <p
          v-if="errorFoto"
          class="photo-error"
          role="alert"
        >
          {{ errorFoto }}
        </p>


        <!-- HISTORIAL DE PARTIDAS -->

        <div class="divider"></div>

        <section class="history-section">

          <h2>
            Historial de partidas
          </h2>

          <label
            v-if="!cargandoResultados && !errorResultados && resultados.length > 0"
            class="unit-filter"
          >
            <span>Clasificar por unidad</span>
            <select v-model="unidadSeleccionada">
              <option value="todas">Todas las unidades</option>
              <option
                v-for="grupo in resultadosPorUnidad"
                :key="grupo.id_unidad ?? 'sin-unidad'"
                :value="String(grupo.id_unidad ?? 'sin-unidad')"
              >
                {{ grupo.nombre }}
              </option>
            </select>
          </label>

          <!-- CARGANDO -->

          <p
            v-if="cargandoResultados"
            class="history-message"
          >
            Cargando historial...
          </p>

          <!-- ERROR -->

          <p
            v-else-if="errorResultados"
            class="history-error"
          >
            {{ errorResultados }}
          </p>

          <!-- SIN PARTIDAS -->

          <p
            v-else-if="resultados.length === 0"
            class="history-message"
          >
            Todavía no tienes partidas registradas.
          </p>

          <!-- RESULTADOS -->

          <div
            v-else
            class="unit-results-list"
          >

            <section
              v-for="grupo in gruposVisibles"
              :key="grupo.id_unidad ?? 'sin-unidad'"
              class="unit-results-group"
            >

              <header class="unit-results-header">
                <div>
                  <h3>{{ grupo.nombre }}</h3>
                  <span>{{ grupo.resultados.length }} partidas</span>
                </div>
                <div class="unit-total-score">
                  <span>Total de la unidad</span>
                  <strong>{{ grupo.totalPuntos }} <small>pts</small></strong>
                </div>
              </header>

              <div class="results-list">

            <article
              v-for="resultado in grupo.resultados"
              :key="resultado.id_resultado"
              class="result-card"
            >

              <div class="result-header">

                <div>

                  <h3>
                    {{ resultado.juego }}
                  </h3>

                  <span class="game-type">
                    {{ resultado.tipo }}
                  </span>
                  <span class="unit-badge">
                    {{ resultado.unidad || 'Sin unidad asignada' }}
                  </span>

                </div>

                <div class="score">
                  {{ resultado.puntuacion }}
                  <span>pts</span>
                </div>

              </div>

              <div class="result-details">

                <div class="result-detail">

                  <span>
                    Fecha
                  </span>

                  <strong>
                    {{ formatearFecha(resultado.fecha) }}
                  </strong>

                </div>

                <div class="result-detail">

                  <span>
                    Tiempo
                  </span>

                  <strong>
                    {{ formatearTiempo(resultado.tiempo_transcurrido) }}
                  </strong>

                </div>

                <div class="result-detail">

                  <span>
                    Aciertos
                  </span>

                  <strong class="correct">
                    {{ resultado.aciertos }}
                  </strong>

                </div>

                <div class="result-detail">

                  <span>
                    Errores
                  </span>

                  <strong class="incorrect">
                    {{ resultado.errores }}
                  </strong>

                </div>

              </div>

            </article>

              </div>
            </section>

          </div>

        </section>


      </section>

    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #f4f6ff 0%, #f8faff 52%, #ecfeff 100%);
  color: #1e293b;
}

.profile-navbar {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background: linear-gradient(105deg, #312e81, #4f46e5);
  box-shadow: 0 8px 24px rgba(49, 46, 129, 0.18);
}

.navbar-title {
  color: #fff;
  font-weight: 700;
}

.profile-content {
  display: flex;
  justify-content: center;
  padding: 56px 20px;
}

.profile-card {
  width: min(100%, 700px);
  box-sizing: border-box;
  padding: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 26px;
  background: white;
  box-shadow: 0 18px 38px rgba(49, 46, 129, 0.12);
}

.profile-heading {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrap {
  position: relative;
  flex: 0 0 76px;
  text-align: center;
}

.avatar {
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: linear-gradient(145deg, #c7d2fe, #a5f3fc);
  color: #3730a3;
  font-size: 25px;
  font-weight: 700;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-button {
  display: inline-block;
  margin-top: 7px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.photo-button:hover {
  text-decoration: underline;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
  border: 0;
}

.photo-error {
  margin: 12px 0 0;
  color: #b91c1c;
  font-size: 14px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  color: #312e81;
  font-size: 26px;
}

.profile-handle {
  margin: 6px 0 0;
  color: #64748b;
}

.divider {
  height: 1px;
  margin: 30px 0;
  background: #e2e8f0;
}

h2 {
  margin: 0 0 16px;
  font-size: 17px;
}

.profile-details {
  margin: 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row dt {
  color: #64748b;
}

.detail-row dd {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}


/* =========================
   HISTORIAL
   ========================= */

.history-section {
  margin-top: 4px;
}

.unit-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 18px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.unit-filter select {
  min-width: min(260px, 55%);
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #1e293b;
  font: inherit;
}

.history-message {
  margin: 0;
  padding: 20px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
}

.history-error {
  margin: 0;
  padding: 15px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  text-align: center;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.unit-results-list {
  display: grid;
  gap: 20px;
}

.unit-results-group {
  padding: 18px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: linear-gradient(145deg, #f8fafc, #eef2ff);
}

.unit-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.unit-results-header h3 {
  margin: 0;
  color: #312e81;
  font-size: 19px;
}

.unit-results-header > div:first-child > span,
.unit-total-score > span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.unit-total-score {
  text-align: right;
}

.unit-total-score strong {
  color: #2563eb;
  font-size: 22px;
}

.unit-total-score small {
  font-size: 12px;
}

.result-card {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.unit-results-group .result-card {
  background: #fff;
}

.result-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.result-header h3 {
  margin: 0;
  color: #1e3a5f;
  font-size: 17px;
}

.game-type {
  display: inline-block;
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
}

.unit-badge {
  display: inline-flex;
  align-items: center;
  margin: 5px 0 0 8px;
  padding: 4px 9px;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 11px;
  font-weight: 700;
  vertical-align: middle;
}

.score {
  color: #2563eb;
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
}

.score span {
  font-size: 12px;
  font-weight: 500;
}

.result-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 18px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
}

.result-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-detail span {
  color: #64748b;
  font-size: 12px;
}

.result-detail strong {
  color: #1e293b;
  font-size: 14px;
}

.result-detail .correct {
  color: #15803d;
}

.result-detail .incorrect {
  color: #b91c1c;
}

.logout-button {
  margin-left: auto;
  align-self: flex-start;
  flex: 0 0 auto;
  padding: 11px 17px;
  border: 1px solid #fed7aa;
  border-radius: 13px;
  background: #fff;
  color: #c2410c;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.logout-button:hover {
  background: #fff7ed;
}

@media (max-width: 600px) {
  .profile-navbar {
    padding: 0 18px;
  }

  .profile-content {
    padding: 30px 14px;
  }

  .profile-card {
    padding: 25px 20px;
  }

  .profile-heading {
    flex-wrap: wrap;
  }

  .logout-button {
    margin-left: auto;
  }

  .profile-heading {
    gap: 14px;
  }

  .avatar {
    width: 62px;
    height: 62px;
    flex-basis: 62px;
  }

  .avatar-wrap {
    flex-basis: 62px;
  }

  h1 {
    font-size: 22px;
  }

  .result-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .unit-filter {
    align-items: stretch;
    flex-direction: column;
  }

  .unit-filter select {
    width: 100%;
  }

  .unit-results-group {
    padding: 14px;
  }

  .unit-results-header {
    align-items: flex-start;
  }

  .unit-results-header h3 {
    font-size: 16px;
  }

  .unit-total-score strong {
    font-size: 18px;
  }
}
</style>
