<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'

const route = useRoute()
const router = useRouter()

const API_SOCKET_URL = 'http://localhost:3000'
const idJuego = computed(() => Number(route.params.id))
const usuario = ref(null)
const socket = ref(null)
const sala = ref(null)
const codigoIngresado = ref('')
const cargando = ref(false)
const conectado = ref(false)
const mensaje = ref('')
const tipoMensaje = ref('error')
const partidaIniciada = ref(false)
const copiando = ref(false)

const esAnfitrion = computed(() =>
  Boolean(sala.value && usuario.value && sala.value.anfitrion_id === Number(usuario.value.id_usuario))
)

const mostrarMensaje = (texto, tipo = 'error') => {
  mensaje.value = texto
  tipoMensaje.value = tipo
}

const leerUsuario = () => {
  try {
    const guardado = localStorage.getItem('usuario')
    usuario.value = guardado ? JSON.parse(guardado) : null
  } catch {
    usuario.value = null
  }
}

const conectarSocket = () => {
  socket.value = io(API_SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000
  })

  socket.value.on('connect', () => {
    conectado.value = true
    mensaje.value = ''
  })

  socket.value.on('disconnect', () => {
    conectado.value = false
    if (sala.value && !partidaIniciada.value) {
      mostrarMensaje('Se perdió la conexión. Intentando reconectar…', 'warning')
    }
  })

  socket.value.on('connect_error', () => {
    conectado.value = false
    mostrarMensaje('No se pudo conectar con el servidor multijugador. Comprueba que el backend esté activo.', 'error')
  })

  socket.value.on('sala-actualizada', (datosSala) => {
    if (sala.value?.codigo === datosSala.codigo) {
      sala.value = datosSala
    }
  })

  socket.value.on('partida-iniciada', (datosSala) => {
    sala.value = datosSala
    partidaIniciada.value = true
    const tipoJuego = Number(datosSala.id_tipo)
    const rutaJuego = tipoJuego === 4
      ? `/juegos/memorama/${idJuego.value}`
      : tipoJuego === 6
        ? `/juegos/detective/${idJuego.value}`
        : `/juegos/preguntas/${idJuego.value}`
    router.push({
      path: rutaJuego,
      query: { sala: datosSala.codigo }
    })
  })
}

const emitirConRespuesta = (evento, datos) => new Promise((resolve) => {
  if (!socket.value?.connected) {
    resolve({ ok: false, mensaje: 'No hay conexión con el servidor.' })
    return
  }
  if (datos === undefined) {
    socket.value.emit(evento, resolve)
  } else {
    socket.value.emit(evento, datos, resolve)
  }
})

const crearSala = async () => {
  mensaje.value = ''
  if (!usuario.value?.id_usuario) {
    mostrarMensaje('Inicia sesión para crear una sala.')
    return
  }
  cargando.value = true
  const respuesta = await emitirConRespuesta('crear-sala', {
    id_juego: idJuego.value,
    id_usuario: usuario.value.id_usuario
  })
  cargando.value = false
  if (!respuesta.ok) {
    mostrarMensaje(respuesta.mensaje || 'No se pudo crear la sala.')
    return
  }
  sala.value = respuesta.sala
  partidaIniciada.value = false
  mostrarMensaje('Sala creada. Comparte el código con tus compañeros.', 'success')
}

const unirseSala = async () => {
  mensaje.value = ''
  if (!usuario.value?.id_usuario) {
    mostrarMensaje('Inicia sesión para unirte a una sala.')
    return
  }
  const codigo = codigoIngresado.value.trim().toUpperCase()
  if (codigo.length !== 6) {
    mostrarMensaje('Escribe un código de sala de seis caracteres.')
    return
  }
  cargando.value = true
  const respuesta = await emitirConRespuesta('unirse-sala', {
    codigo,
    id_usuario: usuario.value.id_usuario
  })
  cargando.value = false
  if (!respuesta.ok) {
    mostrarMensaje(respuesta.mensaje || 'No se pudo ingresar a la sala.')
    return
  }
  sala.value = respuesta.sala
  partidaIniciada.value = respuesta.sala.estado === 'en_juego'
  mostrarMensaje('Te uniste a la sala correctamente.', 'success')
}

const iniciarPartida = async () => {
  mensaje.value = ''
  cargando.value = true
  const respuesta = await emitirConRespuesta('iniciar-partida')
  cargando.value = false
  if (!respuesta.ok) {
    mostrarMensaje(respuesta.mensaje || 'No se pudo iniciar la partida.')
    return
  }
  partidaIniciada.value = true
}

const copiarCodigo = async () => {
  if (!sala.value?.codigo) return
  try {
    await navigator.clipboard.writeText(sala.value.codigo)
    copiando.value = true
    mostrarMensaje('Código copiado al portapapeles.', 'success')
    window.setTimeout(() => { copiando.value = false }, 1800)
  } catch {
    mostrarMensaje('No se pudo copiar automáticamente. Puedes seleccionar el código y copiarlo.', 'warning')
  }
}

const salirSala = () => {
  if (socket.value?.connected && sala.value) {
    socket.value.emit('salir-sala')
  }
  sala.value = null
  partidaIniciada.value = false
  mensaje.value = ''
}

const volverJuegos = () => {
  salirSala()
  router.push('/home')
}

onMounted(() => {
  leerUsuario()
  if (!usuario.value?.id_usuario) {
    mostrarMensaje('Necesitas iniciar sesión para utilizar el modo multijugador.')
    return
  }
  if (!Number.isInteger(idJuego.value) || idJuego.value <= 0) {
    mostrarMensaje('El identificador del juego no es válido.')
    return
  }
  conectarSocket()
})

onBeforeUnmount(() => {
  if (socket.value) {
    // Al iniciar, el jugador cambia a la vista del juego y conserva
    // su asiento para que el nuevo socket pueda recuperarlo.
    if (sala.value && !partidaIniciada.value) socket.value.emit('salir-sala')
    socket.value.removeAllListeners()
    socket.value.disconnect()
  }
})
</script>

<template>
  <main class="multiplayer-page">
    <header class="multiplayer-header">
      <button class="back-button" type="button" @click="volverJuegos">← Volver a juegos</button>
      <div class="connection-state" :class="{ online: conectado }">
        <span class="connection-dot"></span>
        {{ conectado ? 'Servidor conectado' : 'Conectando al servidor…' }}
      </div>
    </header>

    <section class="multiplayer-shell">
      <div class="intro-block">
        <span class="eyebrow">MODO MULTIJUGADOR</span>
        <h1>Juega y aprende <span>en equipo.</span></h1>
        <p>Crea una sala para invitar a tus compañeros o entra con el código que te compartieron.</p>
      </div>

      <div v-if="!sala" class="room-options">
        <article class="room-card create-card">
          <div class="option-icon">＋</div>
          <span class="card-kicker">ANFITRIÓN</span>
          <h2>Crea una sala</h2>
          <p>Prepara una partida y comparte el código de invitación con tus compañeros.</p>
          <button class="primary-action" type="button" :disabled="!conectado || cargando || !usuario?.id_usuario" @click="crearSala">
            {{ cargando ? 'Creando…' : 'Crear sala' }}
          </button>
        </article>

        <article class="room-card join-card">
          <div class="option-icon">⌁</div>
          <span class="card-kicker">PARTICIPANTE</span>
          <h2>Únete a una sala</h2>
          <p>Introduce el código de seis caracteres que te compartió el anfitrión.</p>
          <form class="join-form" @submit.prevent="unirseSala">
            <label for="room-code">Código de sala</label>
            <input id="room-code" v-model="codigoIngresado" type="text" maxlength="6" minlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false" @input="codigoIngresado = codigoIngresado.toUpperCase().replace(/[^A-Z0-9]/g, '')">
            <button class="secondary-action" type="submit" :disabled="!conectado || cargando || !usuario?.id_usuario">
              {{ cargando ? 'Ingresando…' : 'Unirme a la sala' }}
            </button>
          </form>
        </article>
      </div>

      <section v-else class="lobby-card">
        <div class="lobby-heading">
          <div>
            <span class="card-kicker">SALA DE JUEGO</span>
            <h2>{{ sala.nombre_juego }}</h2>
            <p>{{ sala.estado === 'esperando' ? 'Esperando a que se unan tus compañeros' : 'La sala ya fue iniciada' }}</p>
          </div>
          <span class="players-count">{{ sala.participantes.length }} / 8 jugadores</span>
        </div>

        <div class="invite-panel">
          <div>
            <span>CÓDIGO PARA INVITAR</span>
            <strong>{{ sala.codigo }}</strong>
          </div>
          <button type="button" class="copy-button" @click="copiarCodigo">{{ copiando ? 'Copiado ✓' : 'Copiar código' }}</button>
        </div>

        <div class="participants-heading">
          <h3>Participantes</h3>
          <span>{{ sala.participantes.length }} conectados</span>
        </div>
        <ul class="participants-list">
          <li v-for="participante in sala.participantes" :key="participante.id_usuario">
            <span class="avatar-initial">{{ (participante.nombre || 'J').charAt(0).toUpperCase() }}</span>
            <span class="participant-name">{{ participante.nombre }}</span>
            <span v-if="participante.es_anfitrion" class="host-label">Anfitrión</span>
            <span v-else class="ready-label">Conectado</span>
          </li>
        </ul>

        <div v-if="partidaIniciada" class="started-notice">
          <strong>¡La sala está en marcha!</strong>
          <p>La creación de salas y el inicio ya funcionan. La sincronización de respuestas, movimientos y puntuaciones de cada juego será el siguiente desarrollo.</p>
        </div>
        <div v-else class="lobby-actions">
          <button type="button" class="leave-button" @click="salirSala">Salir de la sala</button>
          <button v-if="esAnfitrion" type="button" class="primary-action start-button" :disabled="cargando || sala.participantes.length < 2" @click="iniciarPartida">
            {{ cargando ? 'Iniciando…' : sala.participantes.length < 2 ? 'Esperando otro jugador' : 'Iniciar partida' }}
          </button>
          <p v-else class="waiting-hint">El anfitrión iniciará la partida cuando todos estén listos.</p>
        </div>
      </section>

      <p v-if="mensaje" class="feedback-message" :class="`message-${tipoMensaje}`" role="status">{{ mensaje }}</p>
      <p class="account-note" v-if="!usuario?.id_usuario">Inicia sesión con tu cuenta para crear o unirte a una sala.</p>
    </section>
  </main>
</template>

<style scoped>
.multiplayer-page { min-height: 100vh; padding: 26px 22px 60px; color: #172554; background: radial-gradient(ellipse at 12% 5%, rgba(199,210,254,.55), transparent 35%), radial-gradient(ellipse at 90% 20%, rgba(186,230,253,.52), transparent 34%), linear-gradient(145deg,#f8faff,#eef2ff 55%,#f8fafc); }
.multiplayer-header { width: min(1080px,100%); margin: 0 auto 42px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.back-button { border:1px solid rgba(99,102,241,.18); background:rgba(255,255,255,.72); color:#3730a3; border-radius:13px; padding:10px 15px; font-weight:700; cursor:pointer; }
.connection-state { display:flex; align-items:center; gap:8px; color:#64748b; font-size:13px; font-weight:700; }
.connection-dot { width:9px; height:9px; border-radius:50%; background:#f59e0b; box-shadow:0 0 0 4px rgba(245,158,11,.12); }
.connection-state.online .connection-dot { background:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,.13); }
.multiplayer-shell { width:min(900px,100%); margin:0 auto; }
.intro-block { max-width:650px; margin:0 auto 34px; text-align:center; }
.eyebrow,.card-kicker { color:#6366f1; font-size:11px; font-weight:900; letter-spacing:.16em; }
.intro-block h1 { margin:13px 0 12px; color:#172554; font-size:clamp(34px,6vw,54px); line-height:1.04; letter-spacing:-.045em; }
.intro-block h1 span { color:#6366f1; }
.intro-block p { margin:0; color:#64748b; font-size:16px; line-height:1.7; }
.room-options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; }
.room-card,.lobby-card { border:1px solid rgba(255,255,255,.82); border-radius:26px; background:rgba(255,255,255,.78); box-shadow:0 20px 50px rgba(30,41,59,.08),inset 0 1px 0 #fff; backdrop-filter:blur(18px); }
.room-card { padding:28px; }
.option-icon { width:48px; height:48px; display:grid; place-items:center; margin-bottom:22px; border-radius:16px; background:#eef2ff; color:#4f46e5; font-size:28px; font-weight:700; }
.join-card .option-icon { background:#ecfeff; color:#0891b2; }
.room-card h2,.lobby-heading h2 { margin:8px 0 8px; color:#1e293b; font-size:24px; }
.room-card p,.lobby-heading p { margin:0; color:#64748b; line-height:1.65; font-size:14px; }
.primary-action,.secondary-action { width:100%; min-height:46px; margin-top:23px; border:0; border-radius:14px; color:white; font-weight:800; cursor:pointer; background:linear-gradient(135deg,#4f46e5,#6366f1); box-shadow:0 9px 20px rgba(79,70,229,.2); }
.secondary-action { background:linear-gradient(135deg,#0891b2,#06b6d4); box-shadow:0 9px 20px rgba(8,145,178,.18); }
.primary-action:disabled,.secondary-action:disabled { opacity:.48; cursor:not-allowed; box-shadow:none; }
.join-form { display:grid; gap:8px; margin-top:18px; }
.join-form label { color:#475569; font-size:12px; font-weight:800; }
.join-form input { width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:12px; outline:none; color:#1e293b; font-size:18px; font-weight:800; letter-spacing:.16em; text-align:center; text-transform:uppercase; }
.join-form input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
.join-form .secondary-action { margin-top:7px; }
.lobby-card { padding:30px; }
.lobby-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; }
.players-count { padding:8px 12px; border-radius:999px; background:#eef2ff; color:#4338ca; white-space:nowrap; font-size:12px; font-weight:800; }
.invite-panel { display:flex; align-items:center; justify-content:space-between; gap:16px; margin:26px 0; padding:20px; border:1px dashed #a5b4fc; border-radius:18px; background:#f5f7ff; }
.invite-panel div { display:grid; gap:6px; }
.invite-panel span { color:#64748b; font-size:10px; font-weight:900; letter-spacing:.14em; }
.invite-panel strong { color:#3730a3; font-size:32px; letter-spacing:.2em; }
.copy-button { padding:11px 15px; border:1px solid #c7d2fe; border-radius:12px; background:white; color:#4338ca; font-weight:800; cursor:pointer; }
.participants-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.participants-heading h3 { margin:0; font-size:17px; }
.participants-heading span { color:#64748b; font-size:12px; }
.participants-list { display:grid; gap:9px; margin:0; padding:0; list-style:none; }
.participants-list li { display:flex; align-items:center; gap:12px; padding:11px 13px; border:1px solid #e2e8f0; border-radius:14px; background:rgba(248,250,252,.8); }
.avatar-initial { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:#e0e7ff; color:#4338ca; font-weight:900; }
.participant-name { flex:1; color:#334155; font-weight:700; }
.host-label,.ready-label { color:#4338ca; font-size:11px; font-weight:800; }
.ready-label { color:#059669; }
.lobby-actions { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:24px; }
.leave-button { border:1px solid #cbd5e1; border-radius:13px; padding:12px 16px; background:white; color:#475569; font-weight:800; cursor:pointer; }
.start-button { width:auto; min-width:210px; margin:0; padding:0 18px; }
.waiting-hint { margin:0; color:#64748b; font-size:13px; }
.started-notice { margin-top:24px; padding:18px; border:1px solid #a7f3d0; border-radius:16px; background:#ecfdf5; color:#065f46; }
.started-notice p { margin:6px 0 0; color:#047857; font-size:13px; line-height:1.6; }
.feedback-message { margin:18px 0 0; padding:12px 15px; border-radius:13px; text-align:center; font-size:13px; font-weight:700; }
.message-error { background:#fef2f2; color:#b91c1c; }
.message-warning { background:#fffbeb; color:#92400e; }
.message-success { background:#ecfdf5; color:#047857; }
.account-note { margin:16px 0 0; text-align:center; color:#64748b; font-size:13px; }
@media (max-width:680px) { .multiplayer-page { padding:18px 14px 40px; } .multiplayer-header { margin-bottom:32px; } .room-options { grid-template-columns:1fr; } .room-card,.lobby-card { padding:22px; } .lobby-heading { flex-direction:column; } .invite-panel { align-items:flex-start; flex-direction:column; } .lobby-actions { align-items:stretch; flex-direction:column-reverse; } .start-button { width:100%; } .waiting-hint { text-align:center; } }
</style>
