<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import { useRouter } from 'vue-router'

import HomeButton from '../components/HomeButton.vue'


const router = useRouter()


const usuario = ref(null)

const fotoPerfil = ref('')

const errorFoto = ref('')


const resultados = ref([])

const cargandoResultados =
  ref(false)

const errorResultados =
  ref('')

const unidadSeleccionada =
  ref('todas')


const resultadosPorUnidad =
  computed(() => {

    const grupos =
      new Map()


    for (
      const resultado
      of resultados.value
    ) {

      const clave =
        resultado.id_unidad == null
          ? 'sin-unidad'
          : String(
            resultado.id_unidad
          )


      if (
        !grupos.has(clave)
      ) {

        grupos.set(
          clave,
          {
            id_unidad:
              resultado.id_unidad,

            nombre:
              resultado.unidad ||
              'Sin unidad asignada',

            resultados: [],

            totalPuntos: 0
          }
        )

      }


      const grupo =
        grupos.get(clave)


      grupo.resultados.push(
        resultado
      )


      grupo.totalPuntos +=
        Number(
          resultado.puntuacion
        ) || 0

    }


    return [
      ...grupos.values()
    ].sort(
      (a, b) => {

        if (
          a.id_unidad == null
        ) {
          return 1
        }


        if (
          b.id_unidad == null
        ) {
          return -1
        }


        return (
          Number(a.id_unidad) -
          Number(b.id_unidad)
        )

      }
    )

  })


const gruposVisibles =
  computed(() => {

    if (
      unidadSeleccionada.value ===
      'todas'
    ) {

      return (
        resultadosPorUnidad.value
      )

    }


    return (
      resultadosPorUnidad.value
        .filter(
          (grupo) =>

            String(
              grupo.id_unidad ??
              'sin-unidad'
            ) ===
            unidadSeleccionada.value

        )
    )

  })


const iniciales =
  computed(() => {

    const nombre =
      usuario.value?.nombre ||
      usuario.value?.usuario ||
      'U'


    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (parte) =>
          parte[0]
      )
      .join('')
      .toUpperCase()

  })


const cargarResultados =
  async () => {

    if (
      !usuario.value?.id_usuario
    ) {
      return
    }


    cargandoResultados.value =
      true


    errorResultados.value =
      ''


    try {

      const respuesta =
        await fetch(
          `http://localhost:3000/api/resultados/usuario/${usuario.value.id_usuario}`
        )


      const datos =
        await respuesta.json()


      if (
        !respuesta.ok
      ) {

        throw new Error(
          datos.mensaje ||
          'No se pudo obtener el historial'
        )

      }


      resultados.value =
        datos


    } catch (error) {

      console.error(
        'Error al cargar el historial:',
        error
      )


      errorResultados.value =
        'No se pudo cargar el historial de partidas.'


    } finally {

      cargandoResultados.value =
        false

    }

  }


const formatearTiempo =
  (segundos) => {

    const minutos =
      Math.floor(
        segundos / 60
      )


    const segundosRestantes =
      segundos % 60


    return (
      `${minutos} min ${segundosRestantes} s`
    )

  }


const formatearFecha =
  (fecha) => {

    if (!fecha) {

      return 'Sin fecha'

    }


    const fechaTexto =
      String(fecha)


    const partesFecha =
      fechaTexto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      )


    const fechaLocal =
      partesFecha

        ? new Date(
          Number(
            partesFecha[1]
          ),
          Number(
            partesFecha[2]
          ) - 1,
          Number(
            partesFecha[3]
          )
        )

        : new Date(
          fechaTexto
        )


    if (
      Number.isNaN(
        fechaLocal.getTime()
      )
    ) {

      return 'Sin fecha'

    }


    return (
      fechaLocal
        .toLocaleDateString(
          'es-MX',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }
        )
    )

  }


onMounted(() => {

  try {

    usuario.value =
      JSON.parse(
        localStorage.getItem(
          'usuario'
        )
      )


    fotoPerfil.value =
      localStorage.getItem(
        'fotoPerfil'
      ) || ''


  } catch {

    usuario.value =
      null

  }


  if (
    !usuario.value
  ) {

    router.replace('/')

    return

  }


  cargarResultados()

})


async function cambiarFoto(
  evento
) {

  const archivo =
    evento.target
      .files?.[0]


  evento.target.value =
    ''


  errorFoto.value =
    ''


  if (!archivo) {

    return

  }


  if (
    !archivo.type
      .startsWith(
        'image/'
      )
  ) {

    errorFoto.value =
      'Selecciona un archivo de imagen.'


    return

  }


  try {

    const imagen =
      await createImageBitmap(
        archivo
      )


    const lado =
      Math.min(
        imagen.width,
        imagen.height
      )


    const x =
      (
        imagen.width -
        lado
      ) / 2


    const y =
      (
        imagen.height -
        lado
      ) / 2


    const canvas =
      document
        .createElement(
          'canvas'
        )


    canvas.width =
      256


    canvas.height =
      256


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

  localStorage.removeItem(
    'usuario'
  )


  router.push('/')

}
</script>


<template>

  <div
    v-if="usuario"
    class="profile-page"
  >

    <header class="profile-navbar">

      <HomeButton
        variant="dark"
      />


      <span class="navbar-title">
        Mi perfil
      </span>

    </header>


    <main class="profile-content">


      <section
        class="profile-card"
        aria-labelledby="profile-heading"
      >


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


            <h1
              id="profile-heading"
            >

              {{
                usuario.nombre ||
                usuario.usuario
              }}

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


            <dt>
              Nombre
            </dt>


            <dd>

              {{
                usuario.nombre ||
                'Sin nombre'
              }}

            </dd>


          </div>


          <div class="detail-row">


            <dt>
              Nombre de usuario
            </dt>


            <dd>

              {{
                usuario.usuario ||
                'No disponible'
              }}

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


        <div class="divider"></div>


        <section class="history-section">


          <h2>
            Historial de partidas
          </h2>


          <label
            v-if="
              !cargandoResultados &&
              !errorResultados &&
              resultados.length > 0
            "
            class="unit-filter"
          >

            <span>
              Clasificar por unidad
            </span>


            <select
              v-model="
                unidadSeleccionada
              "
            >

              <option value="todas">
                Todas las unidades
              </option>


              <option
                v-for="
                  grupo
                  in resultadosPorUnidad
                "
                :key="
                  grupo.id_unidad ??
                  'sin-unidad'
                "
                :value="
                  String(
                    grupo.id_unidad ??
                    'sin-unidad'
                  )
                "
              >

                {{ grupo.nombre }}

              </option>

            </select>

          </label>


          <p
            v-if="cargandoResultados"
            class="history-message"
          >

            Cargando historial...

          </p>


          <p
            v-else-if="errorResultados"
            class="history-error"
          >

            {{ errorResultados }}

          </p>


          <p
            v-else-if="
              resultados.length === 0
            "
            class="history-message"
          >

            Todavía no tienes partidas
            registradas.

          </p>


          <div
            v-else
            class="unit-results-list"
          >


            <section
              v-for="
                grupo
                in gruposVisibles
              "
              :key="
                grupo.id_unidad ??
                'sin-unidad'
              "
              class="unit-results-group"
            >


              <header
                class="unit-results-header"
              >


                <div>

                  <h3>
                    {{ grupo.nombre }}
                  </h3>

                  <span>
                    {{
                      grupo.resultados.length
                    }}
                    partidas
                  </span>

                </div>


                <div
                  class="unit-total-score"
                >

                  <span>
                    Total de la unidad
                  </span>

                  <strong>

                    {{
                      grupo.totalPuntos
                    }}

                    <small>
                      pts
                    </small>

                  </strong>

                </div>


              </header>


              <div class="results-list">


                <article
                  v-for="
                    resultado
                    in grupo.resultados
                  "
                  :key="
                    resultado.id_resultado
                  "
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

                        {{
                          resultado.unidad ||
                          'Sin unidad asignada'
                        }}

                      </span>


                    </div>


                    <div class="score">

                      {{
                        resultado.puntuacion
                      }}

                      <span>
                        pts
                      </span>

                    </div>


                  </div>


                  <div class="result-details">


                    <div class="result-detail">

                      <span>
                        Fecha
                      </span>

                      <strong>

                        {{
                          formatearFecha(
                            resultado.fecha
                          )
                        }}

                      </strong>

                    </div>


                    <div class="result-detail">

                      <span>
                        Tiempo
                      </span>

                      <strong>

                        {{
                          formatearTiempo(
                            resultado
                              .tiempo_transcurrido
                          )
                        }}

                      </strong>

                    </div>


                    <div class="result-detail">

                      <span>
                        Aciertos
                      </span>

                      <strong class="correct">

                        {{
                          resultado.aciertos
                        }}

                      </strong>

                    </div>


                    <div class="result-detail">

                      <span>
                        Errores
                      </span>

                      <strong class="incorrect">

                        {{
                          resultado.errores
                        }}

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

  padding:
    24px 22px 60px;

  color: #172554;

  background:
    transparent;
}


/* HEADER */

.profile-navbar {
  position: sticky;

  top: 14px;

  z-index: 20;

  width:
    min(100%, 1080px);

  min-height: 70px;

  margin:
    0 auto 28px;

  padding:
    12px 16px;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.38
    );

  border-radius: 24px;

  background:
    linear-gradient(
      135deg,
      rgba(
        29,
        53,
        72,
        0.82
      ),
      rgba(
        41,
        76,
        96,
        0.74
      ),
      rgba(
        62,
        105,
        122,
        0.62
      )
    );

  box-shadow:
    0 18px 40px
    rgba(
      15,
      23,
      42,
      0.14
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.25
    ),

    inset
    0 -1px 0
    rgba(
      255,
      255,
      255,
      0.08
    );

  backdrop-filter:
    blur(20px)
    saturate(125%);

  -webkit-backdrop-filter:
    blur(20px)
    saturate(125%);
}


.navbar-title {
  padding-right: 7px;

  color: white;

  font-weight: 800;
}


/* CONTENIDO */

.profile-content {
  width:
    min(100%, 1080px);

  margin:
    0 auto;

  padding: 0;
}


.profile-card {
  width: 100%;

  padding: 36px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.66
    );

  border-radius: 30px;

  background:
    linear-gradient(
      145deg,
      rgba(
        255,
        255,
        255,
        0.72
      ),
      rgba(
        255,
        255,
        255,
        0.52
      )
    );

  box-shadow:
    0 21px 45px
    rgba(
      30,
      41,
      59,
      0.075
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.84
    );

  backdrop-filter:
    blur(18px)
    saturate(145%);

  -webkit-backdrop-filter:
    blur(18px)
    saturate(145%);
}


/* PERFIL */

.profile-heading {
  display: grid;

  grid-template-columns:
    auto 1fr auto;

  align-items: center;

  gap: 22px;
}


.avatar-wrap {
  position: relative;

  width: 90px;

  text-align: center;
}


.avatar {
  width: 86px;

  height: 86px;

  display: grid;

  place-items: center;

  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.72
    );

  border-radius: 28px;

  background:
    linear-gradient(
      145deg,
      #d9e7ed,
      #bed5df,
      #cdeaf0
    );

  color: #294c60;

  font-size: 28px;

  font-weight: 900;

  box-shadow:
    0 15px 28px
    rgba(
      41,
      76,
      96,
      0.12
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.85
    );
}


.avatar img {
  width: 100%;

  height: 100%;

  object-fit: cover;
}


.photo-button {
  display: inline-block;

  margin-top: 8px;

  color: #365d6e;

  font-size: 12px;

  font-weight: 800;

  cursor: pointer;
}


.photo-button:hover {
  text-decoration:
    underline;
}


.file-input {
  position: absolute;

  width: 1px;

  height: 1px;

  overflow: hidden;

  clip-path:
    inset(50%);
}


.eyebrow {
  margin:
    0 0 6px;

  color: #52758a;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.12em;
}


h1 {
  margin: 0;

  color: #172554;

  font-size: 31px;

  letter-spacing:
    -0.04em;
}


.profile-handle {
  margin:
    6px 0 0;

  color: #64748b;
}


.logout-button {
  align-self: start;

  padding:
    11px 16px;

  border:
    1px solid
    rgba(
      249,
      115,
      22,
      0.25
    );

  border-radius: 14px;

  background:
    rgba(
      255,
      255,
      255,
      0.58
    );

  color: #c2410c;

  font-weight: 800;

  cursor: pointer;

  backdrop-filter:
    blur(10px);

  transition:
    transform
    0.16s ease,
    background
    0.16s ease;
}


.logout-button:hover {
  transform:
    translateY(-1px);

  background:
    rgba(
      255,
      247,
      237,
      0.90
    );
}


/* SEPARADORES */

.divider {
  height: 1px;

  margin:
    30px 0;

  background:
    rgba(
      148,
      163,
      184,
      0.17
    );
}


h2 {
  margin:
    0 0 17px;

  color: #1e293b;

  font-size: 19px;

  letter-spacing:
    -0.02em;
}


/* INFORMACIÓN */

.profile-details {
  margin: 0;
}


.detail-row {
  display: flex;

  justify-content:
    space-between;

  gap: 20px;

  padding:
    15px 17px;

  margin-bottom: 9px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.64
    );

  border-radius: 16px;

  background:
    rgba(
      255,
      255,
      255,
      0.48
    );
}


.detail-row dt {
  color: #64748b;
}


.detail-row dd {
  margin: 0;

  color: #1e293b;

  font-weight: 800;

  text-align: right;
}


.photo-error {
  color: #b91c1c;
}


/* HISTORIAL */

.history-section {
  margin-top: 3px;
}


.unit-filter {
  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 15px;

  margin-bottom: 20px;

  color: #475569;

  font-size: 14px;

  font-weight: 700;
}


.unit-filter select {
  min-width: 250px;

  padding:
    11px 13px;

  border:
    1px solid
    rgba(
      148,
      163,
      184,
      0.20
    );

  border-radius: 13px;

  background:
    rgba(
      255,
      255,
      255,
      0.65
    );

  color: #1e293b;
}


.history-message,
.history-error {
  padding: 20px;

  border-radius: 17px;

  text-align: center;
}


.history-message {
  background:
    rgba(
      255,
      255,
      255,
      0.48
    );

  color: #64748b;
}


.history-error {
  background: #fff1f2;

  color: #b91c1c;
}


/* UNIDADES */

.unit-results-list {
  display: grid;

  gap: 18px;
}


.unit-results-group {
  padding: 20px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.65
    );

  border-radius: 22px;

  background:
    rgba(
      232,
      241,
      245,
      0.48
    );

  box-shadow:
    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.70
    );
}


.unit-results-header {
  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 15px;

  margin-bottom: 15px;
}


.unit-results-header h3 {
  margin: 0;

  color: #294c60;

  font-size: 20px;
}


.unit-results-header
> div:first-child
> span,

.unit-total-score
> span {
  display: block;

  margin-top: 4px;

  color: #64748b;

  font-size: 12px;
}


.unit-total-score {
  text-align: right;
}


.unit-total-score strong {
  color: #365d6e;

  font-size: 24px;
}


.unit-total-score small {
  font-size: 12px;
}


/* RESULTADOS */

.results-list {
  display: grid;

  gap: 12px;
}


.result-card {
  padding: 18px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.72
    );

  border-radius: 18px;

  background:
    rgba(
      255,
      255,
      255,
      0.68
    );

  box-shadow:
    0 10px 24px
    rgba(
      30,
      41,
      59,
      0.04
    );
}


.result-header {
  display: flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap: 15px;
}


.result-header h3 {
  margin: 0;

  color: #172554;

  font-size: 18px;
}


.game-type {
  display: inline-block;

  margin-top: 6px;

  color: #64748b;

  font-size: 12px;
}


.unit-badge {
  display: inline-flex;

  margin:
    5px 0 0 7px;

  padding:
    4px 9px;

  border:
    1px solid
    rgba(
      62,
      105,
      122,
      0.18
    );

  border-radius: 999px;

  background:
    #eef5f7;

  color:
    #365d6e;

  font-size: 11px;

  font-weight: 800;
}


.score {
  color: #365d6e;

  font-size: 24px;

  font-weight: 900;
}


.score span {
  font-size: 12px;
}


.result-details {
  display: grid;

  grid-template-columns:
    repeat(
      4,
      1fr
    );

  gap: 10px;

  margin-top: 17px;

  padding-top: 15px;

  border-top:
    1px solid
    rgba(
      148,
      163,
      184,
      0.16
    );
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


/* RESPONSIVE */

@media (max-width: 650px) {

  .profile-page {
    padding:
      14px 12px 40px;
  }


  .profile-navbar {
    top: 8px;

    border-radius: 20px;

    margin-bottom: 18px;
  }


  .profile-card {
    padding:
      23px 18px;

    border-radius: 24px;
  }


  .profile-heading {
    grid-template-columns:
      auto 1fr;
  }


  .logout-button {
    grid-column:
      1 / -1;

    width: 100%;
  }


  .unit-filter {
    flex-direction: column;

    align-items: stretch;
  }


  .unit-filter select {
    width: 100%;

    min-width: 0;
  }


  .result-details {
    grid-template-columns:
      repeat(
        2,
        1fr
      );
  }


  .unit-results-header {
    flex-direction: column;

    align-items:
      flex-start;
  }


  .unit-total-score {
    text-align: left;
  }

}
</style>