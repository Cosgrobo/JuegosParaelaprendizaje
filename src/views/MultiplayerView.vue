<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
const modoLobby = computed(() => route.query.modo === 'crear' || route.query.juego ? 'crear' : 'unirse')
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
const token = localStorage.getItem('token')
if (!usuario || !token) router.replace('/')
const headers = computed(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }))
const juegos = ref([]), codigo = ref(''), sala = ref(null), contenido = ref([]), tipo = ref(''), error = ref(''), aviso = ref(''), cargando = ref(false)
const idJuego = ref(''), limite = ref(300), respuesta = ref(''), seleccion = ref(''), seleccionadas = ref([]), girando = ref(false), anguloRuleta = ref(0), giroSolicitado = ref(false)
let polling = null
let accionesRuletaVistas = new Set()
const miId = Number(usuario?.id_usuario)
const miTurno = computed(() => Number(sala.value?.sala?.turno_usuario) === miId)
const esAnfitrion = computed(() => Number(sala.value?.sala?.id_anfitrion) === miId)
const permitido = computed(() => sala.value?.sala?.modalidad === 'colaborativa' || miTurno.value)
const esSopa = computed(() => tipo.value.toLowerCase().includes('sopa'))
const esCrucigrama = computed(() => tipo.value.toLowerCase().includes('crucigrama'))
const respuestasCrucigrama = ref({})
const progresoSopa = computed(() => avance.value.progreso_por_usuario || {})
const misPalabras = computed(() => (progresoSopa.value[String(miId)] || []).map(String))
const palabrasRestantes = computed(() => Math.max(0, Number(avance.value.total || 0) - misPalabras.value.length))
const rankingSopa = computed(() => (sala.value?.participantes || []).map(j => ({ ...j, encontradas: (progresoSopa.value[String(j.id_usuario)] || []).length, restantes: Math.max(0, Number(avance.value.total || 0) - (progresoSopa.value[String(j.id_usuario)] || []).length) })).sort((a,b) => b.puntuacion-a.puntuacion))
const rivalCerca = computed(() => rankingSopa.value.find(j => Number(j.id_usuario) !== miId && j.restantes > 0 && j.restantes <= 2))
const avance = computed(() => sala.value?.avance || {})
const juegoEnCurso = computed(() => sala.value?.sala?.estado === 'en_curso')
const segmentosRuleta = computed(() => contenido.value.filter(item => item.id_pregunta))
const gradienteRuleta = computed(() => { const n=Math.max(1,segmentosRuleta.value.length); const colors=['#6256e8','#18a9b8','#ec8d36','#d94c7d','#5269c9','#39a77a']; return `conic-gradient(${Array.from({length:n},(_,i)=>`${colors[i%colors.length]} ${i*100/n}% ${(i+1)*100/n}%`).join(',')})` })
const tiempo = computed(() => { const n = Math.max(0, sala.value?.sala?.tiempo_restante || 0); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}` })
const tableroCrucigrama = computed(() => {
  const tablero = Array.from({length:10}, () => Array.from({length:15}, () => ({letra:'', activa:false, numero:null})))
  const resueltas = new Map((sala.value?.acciones || []).filter(a => a.tipo_accion === 'crucigrama' && a.acierto).map(a => [String(a.objetivo), String(a.detalle?.palabra || '')]))
  contenido.value.forEach((item,index) => {
    const id=String(item.id_palabra), solucion=resueltas.get(id) || ''
    const vertical=String(item.direccion).toLowerCase()==='vertical'
    for (let i=0; i<Number(item.longitud || solucion.length); i++) {
      const fila=Number(item.fila)+(vertical?i:0), columna=Number(item.columna)+(vertical?0:i)
      if (!tablero[fila]?.[columna]) continue
      const celda=tablero[fila][columna]
      celda.activa=true
      if (i===0) celda.numero=index+1
      if (solucion[i]) celda.letra=solucion[i]
    }
  })
  return tablero
})
const resultadoFinal = ref(null)
const resultadoFinalMostrado = ref('')
function formatearDuracion(segundos) { const n=Math.max(0,Number(segundos)||0); return Math.floor(n/60) + ' min ' + (n%60) + ' s' }
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, { ...options, headers: { ...headers.value, ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.mensaje || 'No se pudo completar la solicitud')
  return data
}
async function cargarJuegos() {
  try {
    const r = await fetch('/api/juegos')
    if (!r.ok) throw new Error()
    juegos.value = await r.json()
    const solicitado = String(route.query.juego || '')
    idJuego.value = juegos.value.some(j => String(j.id_juego) === solicitado)
      ? solicitado
      : juegos.value[0]?.id_juego || ''
  }
  catch { error.value = 'No se pudieron cargar los juegos. Confirma que el backend esté iniciado.' }
}
async function crearSala() { error.value=''; try { const r = await api('/salas', { method:'POST', body: JSON.stringify({ id_juego:Number(idJuego.value), limite_segundos:Number(limite.value) }) }); codigo.value=r.codigo; await unirse(true) } catch(e) { error.value=e.message } }
async function unirse(silencioso=false) { error.value=''; try { await api(`/salas/${encodeURIComponent(codigo.value.trim().toUpperCase())}/unirse`,{method:'POST',body:'{}'}); await actualizar(); iniciarPolling(); if(!silencioso) aviso.value='Te uniste a la sala.' } catch(e) { error.value=e.message } }
async function actualizar() {
  if (!codigo.value || !token) return
  try {
    const estado = await api(`/salas/${encodeURIComponent(codigo.value.trim().toUpperCase())}`)
    sala.value = estado
    const spins=(estado.acciones||[]).filter(a=>a.tipo_accion==='girar')
    if (!accionesRuletaVistas.size) spins.forEach(a=>accionesRuletaVistas.add(Number(a.id_accion)))
    if (estado.sala.estado === 'en_curso') {
      const c = await api(`/salas/${encodeURIComponent(codigo.value.trim().toUpperCase())}/contenido`)
      contenido.value = c.contenido
      tipo.value = c.tipo
      if (String(c.tipo).toLowerCase().includes('ruleta')) {
        for (const spin of spins) {
          if (accionesRuletaVistas.has(Number(spin.id_accion))) continue
          accionesRuletaVistas.add(Number(spin.id_accion))
          if (Number(spin.id_usuario)!==miId) animarRuleta(spin.detalle?.segmento ?? 0, spin.detalle?.total_segmentos || c.contenido.length)
        }
      }
    }
    if (estado.sala.estado === 'finalizada' && resultadoFinalMostrado.value !== estado.sala.codigo) {
      resultadoFinalMostrado.value = estado.sala.codigo
      const jugadores = [...(estado.participantes || [])].sort((a,b) => Number(b.puntuacion)-Number(a.puntuacion))
      const maximo = Number(jugadores[0]?.puntuacion || 0)
      const lideres = jugadores.filter(j => Number(j.puntuacion) === maximo)
      const general = estado.partida?.resultado_general
      const empate = general === 'empate' || (general !== 'ganador' && lideres.length > 1)
      const ganadores = general === 'ganador' ? jugadores.filter(j => j.resultado === 'ganador') : lideres
      const colaborativa = general === 'objetivo_cumplido'
      resultadoFinal.value = {
        titulo: colaborativa ? '¡Objetivo colaborativo cumplido!' : empate ? '¡La partida terminó en empate!' : general === 'tiempo_agotado' ? '¡Se agotó el tiempo!' : '¡Partida terminada!',
        etiqueta: colaborativa ? 'Mayor puntuación del equipo' : general === 'tiempo_agotado' ? 'Líder al finalizar' : empate ? 'Jugadores empatados' : 'Ganador',
        jugadores: (colaborativa || general === 'tiempo_agotado' || empate ? lideres : ganadores).map(j => ({ nombre:j.nombre, puntuacion:j.puntuacion })),
        duracion: formatearDuracion(estado.partida?.tiempo_transcurrido ?? estado.sala.tiempo_transcurrido),
        codigo: estado.sala.codigo
      }
    }
  } catch(e) { if(!sala.value) error.value=e.message }
}function iniciarPolling() { clearInterval(polling); polling=setInterval(actualizar,1500) }
async function iniciarPartida() { error.value=''; try { await api(`/salas/${codigo.value}/iniciar`,{method:'POST',body:'{}'}); await actualizar() } catch(e) { error.value=e.message } }
async function accion(item, valor, type='respuesta', selecciones=null) {
  error.value=''; aviso.value=''
  try {
    const data=await api(`/salas/${codigo.value}/acciones`,{method:'POST',body:JSON.stringify({clave_accion:crypto.randomUUID(),tipo_accion:type,objetivo:item,respuesta:valor,...(selecciones?{selecciones}:{})})})
    aviso.value=data.mensaje
    respuesta.value=''; seleccion.value=''; seleccionadas.value=[]
    await actualizar()
    return data
  } catch(e) { error.value=e.message; return null }
}
async function responderCrucigrama(item) {
  const valor=String(respuestasCrucigrama.value[item.id_palabra] || '').trim()
  if (!valor || encontrada(item.id_palabra)) return
  await accion(item.id_palabra,valor,'crucigrama')
}
function animarRuleta(segmento,total) {
  if (girando.value) return
  girando.value=true
  const n=Math.max(1,Number(total)||1), centro=(Number(segmento)%n)*360/n+180/n
  const actual=((anguloRuleta.value%360)+360)%360
  anguloRuleta.value += 1800 + ((360-centro-actual+720)%360)
  window.setTimeout(async()=>{ girando.value=false; await actualizar() },4200)
}
async function girar() {
  if(giroSolicitado.value||girando.value)return
  error.value=''; giroSolicitado.value=true
  try {
    const data=await api(`/salas/${codigo.value}/girar`,{method:'POST',body:JSON.stringify({clave_accion:crypto.randomUUID()})})
    animarRuleta(data.segmento,data.total_segmentos)
    await actualizar()
  } catch(e) { error.value=e.message } finally { giroSolicitado.value=false }
}
let seleccionEnCurso = false
function iniciarSeleccion(evento,fila,columna) {
  if (evento.button!==0 || !evento.isPrimary || !juegoEnCurso.value) return
  seleccionadas.value=[]
  aviso.value=''
  error.value=''
  seleccionEnCurso=true
  agregarCeldasSeleccionadas(fila,columna)
}
function continuarSeleccion(fila,columna) {
  if (!seleccionEnCurso || !juegoEnCurso.value) return
  agregarCeldasSeleccionadas(fila,columna)
}
function agregarCeldasSeleccionadas(fila,columna) {
  const celdas=seleccionadas.value
  if (!celdas.length) { seleccionadas.value=[{fila,columna}]; return }
  const existente=celdas.findIndex(c=>c.fila===fila&&c.columna===columna)
  if (existente!==-1) {
    if (existente<celdas.length-1) seleccionadas.value=celdas.slice(0,existente+1)
    return
  }
  const origen=celdas[0]
  const df=fila-origen.fila, dc=columna-origen.columna
  const pasos=Math.max(Math.abs(df),Math.abs(dc))
  if (!pasos) return
  const sf=celdas.length===1?Math.sign(df):celdas[1].fila-origen.fila
  const sc=celdas.length===1?Math.sign(dc):celdas[1].columna-origen.columna
  if (df!==sf*pasos || dc!==sc*pasos || pasos<celdas.length) return
  for (let paso=celdas.length; paso<=pasos; paso++) {
    const f=origen.fila+sf*paso, c=origen.columna+sc*paso
    if (!avance.value.tablero?.[f]?.[c]) return
    seleccionadas.value.push({fila:f,columna:c})
  }
}
async function finalizarSeleccion(evento) {
  if (!seleccionEnCurso || evento?.target?.closest?.('.sopa-controls')) return
  seleccionEnCurso=false
  if (seleccionadas.value.length<2) { seleccionadas.value=[]; return }
  await enviarSopa()
}function cancelarSeleccion() { if (seleccionEnCurso) { seleccionEnCurso=false; seleccionadas.value=[] } }
function seguirSeleccionPuntero(evento) {
  if (!seleccionEnCurso) return
  const elemento=document.elementFromPoint(evento.clientX,evento.clientY)?.closest?.('[data-sopa-cell]')
  if (!elemento) return
  const fila=Number(elemento.dataset.fila), columna=Number(elemento.dataset.columna)
  if (Number.isInteger(fila) && Number.isInteger(columna)) agregarCeldasSeleccionadas(fila,columna)
}
const letraSeleccionada = computed(() => seleccionadas.value.map(c=>avance.value.tablero?.[c.fila]?.[c.columna]||'').join(''))
function celdaSopa(fila,columna) {
  const acciones=sala.value?.acciones?.filter(a=>a.tipo_accion==='sopa'&&a.acierto&&a.detalle?.seleccion?.some(c=>Number(c.fila)===fila&&Number(c.columna)===columna)) || []
  if (!acciones.length) return ''
  return acciones.some(a=>Number(a.id_usuario)===miId) ? 'mine' : 'rival'
}
async function enviarSopa() { if(seleccionadas.value.length>=2) { seleccionEnCurso=false; const extremos=[seleccionadas.value[0],seleccionadas.value[seleccionadas.value.length-1]].map(cell=>({...cell})); await accion('busqueda','', 'sopa', extremos) } }
function alternarCarta(token) { if(seleccionadas.value.includes(token)) seleccionadas.value=seleccionadas.value.filter(x=>x!==token); else if(seleccionadas.value.length<2) seleccionadas.value.push(token) }
async function enviarMemorama() { if(seleccionadas.value.length===2) await accion('memorama','', 'memorama', [...seleccionadas.value]) }
function encontrada(id) { return (avance.value.completados||[]).map(String).includes(String(id)) }
function autor(id) { return sala.value?.participantes?.find(p=>Number(p.id_usuario)===Number(id))?.nombre || 'Jugador' }
async function salirSala() { try { await api(`/salas/${codigo.value}/desconectarse`,{method:'POST',body:'{}'}) } catch {} sala.value=null; contenido.value=[]; codigo.value=''; clearInterval(polling) }
onMounted(cargarJuegos); onBeforeUnmount(()=>clearInterval(polling))
</script>

<template>
  <main class="multi-page" :class="{ 'rival-close-pressure': esSopa && juegoEnCurso && rivalCerca }" @pointerup.window="finalizarSeleccion" @pointercancel.window="cancelarSeleccion" @pointermove.window="seguirSeleccionPuntero">
    <header class="multi-header"><button class="back" @click="router.push('/home')">← Volver a juegos</button><div><span class="eyebrow">JUEGA EN EQUIPO</span><h1>Multijugador</h1></div><span class="who">{{ usuario?.nombre || usuario?.usuario }}</span></header>
    <section v-if="!sala" class="lobby-grid" :class="{ 'join-only-grid': modoLobby === 'unirse' }">
      <article v-if="modoLobby === 'crear'" class="panel"><span class="tag">CREAR PARTIDA</span><h2>Prepara una sala</h2><p v-if="route.query.juego">Se creará una sala para el juego que seleccionaste. Configura el tiempo y comparte el código.</p><p v-else>Elige un juego y configura el tiempo de la partida para compartir la sala.</p>
        <label v-if="!route.query.juego">Juego<select v-model="idJuego"><option v-for="j in juegos" :key="j.id_juego" :value="j.id_juego">{{ j.nombre }} · {{ j.tipo }}</option></select></label>
        <div v-else class="selected-game"><span>Juego seleccionado</span><strong>{{ juegos.find(j => String(j.id_juego) === String(idJuego))?.nombre }}</strong><small>{{ juegos.find(j => String(j.id_juego) === String(idJuego))?.tipo }}</small></div>
        <label>Duración de la partida<select v-model.number="limite"><option :value="120">2 minutos</option><option :value="300">5 minutos</option><option :value="600">10 minutos</option><option :value="900">15 minutos</option></select></label>
        <button class="primary" :disabled="!juegos.length" @click="crearSala">Crear sala</button>
      </article>
      <article v-if="modoLobby === 'unirse'" class="panel join-panel"><span class="tag">UNIRSE A UNA PARTIDA</span><h2>¿Tienes un código?</h2><p>Ingresa el código que te compartió el anfitrión para entrar a la misma partida.</p><label>Código de sala<input v-model="codigo" maxlength="8" placeholder="Ej. A4B91F2C" @keyup.enter="unirse"></label><button class="secondary" @click="unirse">Unirse a una partida</button></article>
    </section>
    <section v-else class="room-layout">
      <article class="panel room-main"><div class="room-top"><div><span class="tag">SALA {{ sala.sala.codigo }}</span><h2>{{ sala.sala.juego }}</h2><p>{{ sala.sala.tipo }} · {{ esSopa ? 'Carrera de palabras: gana quien complete primero' : esCrucigrama ? (sala.sala.modalidad==='colaborativa' ? 'Colaborativa: resuelvan juntos' : 'Competitiva por turnos') : sala.sala.modalidad==='colaborativa'?'Colaborativa':'Competitiva por turnos' }}</p></div><button class="quiet" @click="salirSala">Salir de la sala</button></div>
        <div class="room-status"><span :class="['status-dot',sala.sala.estado]"></span>{{ sala.sala.estado==='esperando'?'Esperando jugadores':sala.sala.estado==='en_curso'?'Partida en curso':'Partida finalizada' }}<strong v-if="juegoEnCurso">{{ tiempo }}</strong></div>
        <div v-if="sala.sala.estado==='esperando'" class="waiting"><div class="share-code">{{ sala.sala.codigo }}</div><p>Comparte este código para invitar hasta 30 participantes. La partida se habilita cuando haya al menos dos conectados.</p><button v-if="esAnfitrion" class="primary" :disabled="sala.participantes.filter(p=>p.conectado).length<2" @click="iniciarPartida">Iniciar partida</button><small v-else>El anfitrión iniciará cuando todos estén listos.</small></div>
        <template v-else>
          <div v-if="!esSopa" class="progress-line"><span>Avance</span><strong>{{ avance.completados?.length||0 }} / {{ avance.total||0 }}</strong><div class="progress-track"><i :style="{width:`${avance.total?100*(avance.completados?.length||0)/avance.total:0}%`}"></i></div></div>
          <div v-if="juegoEnCurso && !esSopa && (!esCrucigrama || sala.sala.modalidad!=='colaborativa')" class="turn-banner">{{ permitido?'Es tu turno. ¡Haz tu jugada!':`Turno de ${autor(sala.sala.turno_usuario)}` }}</div>
          <section v-if="esSopa" class="sopa-race">
            <div class="sopa-scoreboard">
              <div class="my-race"><span>Tu avance</span><strong>{{ misPalabras.length }} / {{ avance.total }}</strong><small>{{ sala.participantes.find(j => Number(j.id_usuario)===miId)?.puntuacion || 0 }} puntos · {{ palabrasRestantes }} por encontrar</small></div>
              <div v-for="jugador in rankingSopa" :key="jugador.id_usuario" class="race-player" :class="{ 'is-me': Number(jugador.id_usuario)===miId }"><span>{{ Number(jugador.id_usuario)===miId ? 'Tú' : jugador.nombre }}</span><b>{{ jugador.encontradas }}/{{ avance.total }}</b><small>{{ jugador.puntuacion }} pts</small></div>
            </div>
            <div v-if="rivalCerca && juegoEnCurso" class="pressure-alert">⚡ {{ rivalCerca.nombre }} está a {{ rivalCerca.restantes }} {{ rivalCerca.restantes===1?'palabra':'palabras' }} de terminar. ¡Acelera!</div>
            <div class="sopa-instructions"><b>Encuentra las palabras en el tablero:</b><span>Mantén pulsado y arrastra en línea recta sobre las letras. Suelta para comprobar la palabra; también puedes ir en diagonal.</span></div>
            <div class="word-list"><span v-for="item in contenido" :key="item.id_palabra" :class="{ mine: misPalabras.includes(String(item.id_palabra)), claimed: avance.primer_descubridor?.[String(item.id_palabra)] && !misPalabras.includes(String(item.id_palabra)) }"><b>{{ item.palabra || item.pista || 'Palabra' }}</b><small v-if="misPalabras.includes(String(item.id_palabra))">✓ Tú</small><small v-else-if="avance.primer_descubridor?.[String(item.id_palabra)]">{{ autor(avance.primer_descubridor[String(item.id_palabra)]) }} primero</small></span></div>
            <div v-if="!avance.tablero && juegoEnCurso" class="sopa-missing">El tablero todavía no llegó desde el servidor. Reinicia el backend con Ctrl+C y <code>node server.js</code>, y luego recarga esta sala.</div>
<div v-if="avance.tablero" class="wordsearch-grid" :style="{ '--grid-size': avance.tablero.length }">
              <template v-for="(fila, f) in avance.tablero" :key="'fila-'+f"><button v-for="(letra, c) in fila" :key="`${f}-${c}`" type="button" :data-sopa-cell="true" :data-fila="f" :data-columna="c" :disabled="!juegoEnCurso" :class="{ selected: seleccionadas.some(x=>x.fila===f&&x.columna===c), found: celdaSopa(f,c)==='mine', 'found-rival': celdaSopa(f,c)==='rival' }" @pointerdown.prevent="iniciarSeleccion($event,f,c)" @pointerenter="continuarSeleccion(f,c)" @dragstart.prevent>{{ letra }}</button></template>
            </div>
            <div class="sopa-controls"><strong class="selected-word">{{ letraSeleccionada || 'Arrastra una palabra; se comprobará al soltar' }}</strong><button class="quiet" :disabled="!seleccionadas.length" @click="seleccionadas=[]; seleccionEnCurso=false">Limpiar selección</button></div>
<p v-if="aviso||error" class="sopa-feedback" :class="{ 'feedback-error': error }">{{ error || aviso }}</p>
          </section>          <section v-else-if="esCrucigrama" class="crossword-multiplayer">
            <div class="crossword-board-wrap"><div class="crossword-board">
              <template v-for="(fila,f) in tableroCrucigrama" :key="'crucigrama-'+f"><div v-for="(celda,c) in fila" :key="`${f}-${c}`" :class="['crossword-cell',{active:celda.activa,revealed:celda.letra}]"><small v-if="celda.numero">{{ celda.numero }}</small><b>{{ celda.letra }}</b></div></template>
            </div></div>
            <div class="crossword-clues">
              <section><h3>Horizontales</h3><article v-for="item in contenido.filter(p=>p.direccion==='horizontal')" :key="item.id_palabra" class="crossword-clue"><div class="clue-text"><b>{{ contenido.findIndex(p=>String(p.id_palabra)===String(item.id_palabra))+1 }}. {{ item.pista }}</b><small>{{ item.longitud }} casillas</small><small v-if="encontrada(item.id_palabra)" class="clue-solved">✓ La resolvió {{ autor(sala.acciones.find(a=>a.objetivo==String(item.id_palabra)&&a.acierto)?.id_usuario) }} · +10 pts</small></div><form v-if="!encontrada(item.id_palabra)" @submit.prevent="responderCrucigrama(item)"><input v-model="respuestasCrucigrama[item.id_palabra]" :disabled="!juegoEnCurso||!permitido" :maxlength="item.longitud" autocomplete="off" placeholder="Respuesta"><button :disabled="!juegoEnCurso||!permitido||!respuestasCrucigrama[item.id_palabra]?.trim()">Resolver</button></form></article></section>
              <section><h3>Verticales</h3><article v-for="item in contenido.filter(p=>p.direccion==='vertical')" :key="item.id_palabra" class="crossword-clue"><div class="clue-text"><b>{{ contenido.findIndex(p=>String(p.id_palabra)===String(item.id_palabra))+1 }}. {{ item.pista }}</b><small>{{ item.longitud }} casillas</small><small v-if="encontrada(item.id_palabra)" class="clue-solved">✓ La resolvió {{ autor(sala.acciones.find(a=>a.objetivo==String(item.id_palabra)&&a.acierto)?.id_usuario) }} · +10 pts</small></div><form v-if="!encontrada(item.id_palabra)" @submit.prevent="responderCrucigrama(item)"><input v-model="respuestasCrucigrama[item.id_palabra]" :disabled="!juegoEnCurso||!permitido" :maxlength="item.longitud" autocomplete="off" placeholder="Respuesta"><button :disabled="!juegoEnCurso||!permitido||!respuestasCrucigrama[item.id_palabra]?.trim()">Resolver</button></form></article></section>
            </div>
          </section>          <div v-else-if="tipo.toLowerCase().includes('ruleta')||tipo.toLowerCase().includes('pregunta')" class="question-area roulette-area"><div class="roulette-wrap"><span class="roulette-pointer">▼</span><div class="roulette-wheel" :style="{background:gradienteRuleta,transform:`rotate(${anguloRuleta}deg)`}"><span v-for="(item,i) in segmentosRuleta" :key="item.id_pregunta" class="wheel-label" :title="item.pregunta" :style="{transform:`translate(-50%,-50%) rotate(${(i+.5)*360/Math.max(1,segmentosRuleta.length)}deg) translateY(-100px) rotate(-${(i+.5)*360/Math.max(1,segmentosRuleta.length)}deg)`}">{{ item.pregunta }}</span><b class="wheel-hub">{{ girando?'…':'GIRO' }}</b></div></div><p>{{ girando?'La ruleta está girando…':permitido?'Es tu turno para girar.':`Turno de ${autor(sala.sala.turno_usuario)}` }}</p><div class="roulette-possibilities"><b>Preguntas que pueden tocar:</b><ol><li v-for="item in segmentosRuleta" :key="'posible-'+item.id_pregunta">{{ item.pregunta }}</li></ol></div><button v-if="!sala.pregunta_actual" class="primary" :disabled="!permitido||!juegoEnCurso||girando||giroSolicitado" @click="girar">{{ girando||giroSolicitado?'Girando…':'Girar ruleta' }}</button><div v-if="sala.pregunta_actual&&!girando" class="roulette-question"><h3>{{ sala.pregunta_actual.pregunta }}</h3><button v-for="key in ['a','b','c','d']" :key="key" class="option" :disabled="!permitido" @click="accion(sala.pregunta_actual.id_pregunta,key,'pregunta')">{{ key.toUpperCase() }} · {{ sala.pregunta_actual['opcion_'+key] }}</button></div></div>
          <div v-else-if="tipo.toLowerCase().includes('memorama')" class="memory-grid"><button v-for="c in avance.cartas||[]" :key="c.token" :disabled="!juegoEnCurso||!permitido||encontrada(c.token)" :class="['memory-card',{revealed:seleccionadas.includes(c.token)||sala.acciones.some(a=>a.tipo_accion==='memorama'&&a.detalle?.reveladas?.some(r=>r.token===c.token))||encontrada(c.token)}]" @click="alternarCarta(c.token)">{{ seleccionadas.includes(c.token)||sala.acciones.some(a=>a.tipo_accion==='memorama'&&a.detalle?.reveladas?.some(r=>r.token===c.token))||encontrada(c.token)?(c.elemento||'✓'):'?' }}</button><button class="primary" :disabled="seleccionadas.length!==2||!permitido" @click="enviarMemorama">Comprobar pareja</button></div>
          <div v-else-if="contenido.length" class="challenge-list"><div v-for="item in contenido" :key="item.id_enigma" class="challenge"><div><b>{{ item.titulo }} · {{ item.materia }}</b><small>{{ item.pista_1 }} · {{ item.pista_2 }} · {{ item.pista_3 }}</small></div><form v-if="!encontrada(item.id_enigma)" @submit.prevent="accion(item.id_enigma,respuesta,'detective')"><input v-model="respuesta" :disabled="!permitido||!juegoEnCurso" placeholder="Tu respuesta"><button :disabled="!permitido||!juegoEnCurso">Resolver</button></form><span v-else class="done">✓ Resuelto</span></div></div>
          <div v-if="sala.sala.estado==='finalizada'" class="result-box"><h3>{{ sala.partida?.resultado_general==='empate'?'¡Hay empate!':sala.partida?.resultado_general==='objetivo_cumplido'?'¡Objetivo colaborativo cumplido!':sala.partida?.resultado_general==='ganador'?`Resultado: Ganador: ${sala.participantes.find(jugador=>jugador.resultado==='ganador')?.nombre||'Sin nombre'}`:`Resultado: ${sala.partida?.resultado_general||'partida finalizada'}` }}</h3><p>Resultados guardados para todos los participantes.</p></div>
        </template>
      </article>
      <aside class="panel players-panel"><span class="tag">PARTICIPANTES</span><h3>{{ sala.participantes.length }} / {{ sala.sala.max_jugadores }}</h3><div v-for="p in sala.participantes" :key="p.id_usuario" class="player-row"><span class="avatar">{{ p.nombre?.[0]||'J' }}</span><div><b>{{ p.nombre }}</b><small>{{ Number(p.id_usuario)===Number(sala.sala.id_anfitrion)?'Anfitrión':Number(p.id_usuario)===Number(sala.sala.turno_usuario)&&juegoEnCurso?'Su turno':'Participante' }}</small></div><span :class="['online-dot',{off:!p.conectado}]"></span><strong v-if="juegoEnCurso">{{ p.puntuacion }} pts</strong><small v-else>{{ p.conectado?'Conectado':'Desconectado' }}</small></div><div v-if="juegoEnCurso" class="score-summary">Aciertos y errores se actualizan al registrar cada respuesta.</div></aside>
    </section>
    <div v-if="resultadoFinal" class="modal-backdrop" role="presentation">
      <section class="finish-modal" role="dialog" aria-modal="true" aria-labelledby="finish-title">
        <button class="modal-close" aria-label="Cerrar resultado" @click="resultadoFinal=null">×</button>
        <span class="tag">RESULTADO · SALA {{ resultadoFinal.codigo }}</span>
        <h2 id="finish-title">{{ resultadoFinal.titulo }}</h2>
        <p class="finish-label">{{ resultadoFinal.etiqueta }}</p>
        <div v-for="jugador in resultadoFinal.jugadores" :key="jugador.nombre" class="finish-winner">
          <span class="avatar">{{ jugador.nombre?.[0] || 'J' }}</span>
          <strong>{{ jugador.nombre }}</strong>
          <b>{{ jugador.puntuacion }} pts</b>
        </div>
        <div class="finish-time"><span>Tiempo de partida</span><strong>{{ resultadoFinal.duracion }}</strong></div>
        <div class="finish-actions">
          <button class="secondary" @click="resultadoFinal=null; router.push('/perfil')">Ver historial</button>
          <button class="primary" @click="resultadoFinal=null">Continuar</button>
        </div>
      </section>
    </div>
    <p v-if="error" class="notice error">{{ error }}</p><p v-if="aviso" class="notice success">{{ aviso }}</p>
  </main>
</template>

<style scoped>
.multi-page{min-height:100vh;padding:32px clamp(18px,5vw,76px) 60px;background:radial-gradient(circle at 90% 4%,#e0e7ff 0,transparent 28%),#f5f7ff;color:#20234a}.multi-header{max-width:1200px;margin:auto auto 32px;display:flex;align-items:center;gap:24px}.multi-header>div{flex:1}.multi-header h1{font-size:clamp(30px,4vw,46px);margin:4px 0;color:#282263;letter-spacing:-.04em}.eyebrow,.tag{font-size:11px;font-weight:800;letter-spacing:.14em;color:#6259cf}.back,.quiet{border:0;background:#fff;color:#45436f;padding:11px 16px;border-radius:12px;font-weight:700;cursor:pointer}.who{color:#5d6280;font-weight:650}.lobby-grid,.room-layout{max-width:1200px;margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:22px}.panel{background:#fff;border:1px solid #e8eaf4;border-radius:24px;padding:clamp(22px,3vw,36px);box-shadow:0 18px 48px #2c31700b}.panel h2{margin:10px 0;color:#29265e;font-size:27px}.panel p{color:#717791;line-height:1.55}.panel label{display:grid;gap:8px;margin:20px 0 0;color:#424663;font-size:13px;font-weight:700}.panel input,.panel select{min-width:0;width:100%;padding:12px;border:1px solid #dfe2ed;border-radius:11px;color:#2d3150;background:#fbfcff;font:inherit}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.primary,.secondary{margin-top:22px;border:0;border-radius:12px;padding:13px 18px;background:linear-gradient(120deg,#4f46e5,#7770ef);color:white;font-weight:750;cursor:pointer}.secondary{background:#eeefff;color:#4c46b2}.primary:disabled,.secondary:disabled{opacity:.45;cursor:not-allowed}.join-panel{background:linear-gradient(150deg,#fff,#f5f5ff)}.room-layout{grid-template-columns:minmax(0,1fr) 320px}.room-main{min-height:500px}.room-top{display:flex;justify-content:space-between;gap:20px}.room-top h2{margin-bottom:0}.room-top p{margin-top:6px}.room-status{display:flex;align-items:center;gap:9px;margin:24px 0;padding:12px 14px;background:#f7f8fc;border-radius:12px;color:#555b77}.room-status strong{margin-left:auto}.status-dot,.online-dot{width:9px;height:9px;border-radius:50%;background:#16b981}.status-dot.esperando{background:#f59e0b}.status-dot.finalizada{background:#818cf8}.waiting{text-align:center;padding:28px 10px}.share-code{font:800 34px ui-monospace,monospace;letter-spacing:.18em;color:#4f46e5}.waiting p{max-width:460px;margin:12px auto}.waiting small{color:#777}.players-panel h3{font-size:22px;margin:10px 0 24px}.player-row{display:flex;align-items:center;gap:11px;padding:14px 0;border-bottom:1px solid #f0f1f6}.avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;background:#eeedff;color:#4d46ba;font-weight:800}.player-row>div{flex:1;display:grid;gap:4px}.player-row b{font-size:14px}.player-row small{font-size:11px;color:#80859b}.player-row strong{font-size:12px;color:#4f46e5}.online-dot.off{background:#c7cad5}.progress-line{display:grid;grid-template-columns:1fr auto;gap:9px;margin:25px 0}.progress-line span,.progress-line strong{font-size:13px;color:#5a5f7a}.progress-track{grid-column:1/-1;height:8px;background:#eceef7;border-radius:9px;overflow:hidden}.progress-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4f46e5,#22c6ca);transition:width .3s}.turn-banner{padding:13px;border-radius:12px;background:#eff6ff;color:#3e55a1;font-weight:750;margin-bottom:18px}.challenge-list{display:grid;gap:10px}.challenge{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:14px;border:1px solid #eceef6;border-radius:14px}.challenge>div{display:grid;gap:6px;flex:1}.challenge b{font-size:14px}.challenge small{color:#82869b;font-size:12px}.challenge form{display:flex;gap:7px}.challenge form input{width:145px;padding:9px}.challenge form button{border:0;border-radius:9px;padding:8px 12px;background:#4f46e5;color:#fff;font-weight:700}.challenge form button:disabled{opacity:.4}.done{color:#07936e;font-weight:750;font-size:13px}.question-area{max-width:600px;margin:30px auto;display:grid;gap:10px}.question-area h3{text-align:center;color:#28265c}.option{padding:13px;text-align:left;border:1px solid #e2e4ef;border-radius:11px;background:#fff;cursor:pointer}.option:hover:not(:disabled){border-color:#7770ef;background:#f6f5ff}.option:disabled{opacity:.55}.roulette-wrap{position:relative;width:min(300px,78vw);aspect-ratio:1;margin:12px auto 4px}.roulette-pointer{position:absolute;z-index:2;left:50%;top:-10px;transform:translateX(-50%);color:#30276e;font-size:25px;filter:drop-shadow(0 2px 2px #0003)}.roulette-wheel{position:absolute;inset:0;border:8px solid #fff;border-radius:50%;box-shadow:0 8px 25px #27205c30,inset 0 0 0 2px #ffffffa8;transition:transform 4.2s cubic-bezier(.12,.72,.12,1);overflow:hidden}.wheel-label{position:absolute;left:50%;top:50%;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#ffffffdc;color:#26215d;font-weight:850;font-size:13px}.wheel-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:64px;height:64px;border:5px solid #fff;border-radius:50%;background:#322b7b;color:#fff;font-size:11px;box-shadow:0 2px 8px #0004}.roulette-question{display:grid;gap:10px;margin-top:12px}.roulette-question h3{margin-bottom:5px}.roulette-area>p{min-height:22px}.question-area>p{text-align:center}.memory-grid{display:grid;grid-template-columns:repeat(4,minmax(60px,1fr));gap:9px}.memory-card{min-height:80px;border:1px solid #e4e4f2;border-radius:12px;background:#6e67dc;color:#fff;font-weight:750;cursor:pointer}.memory-card.revealed{background:#eff0ff;color:#373175}.score-summary{margin-top:20px;padding:13px;background:#f7f8fc;border-radius:12px;color:#777d96;font-size:12px;line-height:1.5}.result-box{margin-top:22px;padding:18px;text-align:center;border-radius:14px;background:#f0efff;color:#373175}.result-box h3{margin:0}.result-box p{margin-bottom:0}.notice{max-width:1200px;margin:18px auto 0;padding:12px 16px;border-radius:11px}.notice.error{background:#fff0f0;color:#b42335}.notice.success{background:#eafaf4;color:#087c5b}@media(max-width:800px){.lobby-grid,.room-layout{grid-template-columns:1fr}.players-panel{order:-1}.multi-header{flex-wrap:wrap}.who{margin-left:auto}.room-top{flex-wrap:wrap}.challenge{align-items:flex-start;flex-direction:column}.challenge form{width:100%}.challenge form input{flex:1}.memory-grid{grid-template-columns:repeat(3,minmax(60px,1fr))}}
.modal-backdrop{position:fixed;z-index:20;inset:0;display:grid;place-items:center;padding:20px;background:rgba(22,25,62,.48);backdrop-filter:blur(7px)}.finish-modal{position:relative;width:min(480px,100%);padding:34px;border-radius:24px;background:#fff;box-shadow:0 28px 90px #11143d55;text-align:center;animation:finish-pop .24s ease-out}.finish-modal h2{margin:12px 0 8px;color:#29265e;font-size:27px}.finish-label{margin:0 0 12px!important;font-size:13px;font-weight:700;color:#6b6f89}.modal-close{position:absolute;right:15px;top:12px;border:0;background:transparent;font-size:27px;color:#717791;cursor:pointer}.finish-winner{display:flex;align-items:center;gap:11px;margin-top:10px;padding:12px;border-radius:13px;background:#f5f5ff;text-align:left}.finish-winner strong{flex:1;color:#29265e}.finish-winner b{color:#4f46e5}.finish-time{display:flex;justify-content:space-between;margin-top:15px;padding:14px 2px;border-top:1px solid #eceef5;color:#6f748e}.finish-time strong{color:#29265e}.finish-actions{display:flex;justify-content:center;gap:10px}.finish-actions .primary,.finish-actions .secondary{margin-top:8px}@keyframes finish-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.sopa-race{display:grid;gap:18px}.sopa-scoreboard{display:flex;flex-wrap:wrap;gap:10px}.my-race,.race-player{display:grid;gap:4px;min-width:135px;padding:11px 14px;border-radius:12px;background:#f5f5ff;color:#403b8a}.my-race{flex:1}.my-race strong{font-size:20px}.my-race small,.race-player small{font-size:11px;color:#767b96}.race-player{background:#f7f8fc;color:#535873}.race-player.is-me{outline:2px solid #a5b4fc}.race-player b{font-size:16px}.pressure-alert{padding:12px 15px;border:1px solid #fecaca;border-radius:12px;background:#fff1f2;color:#a61b2b;font-weight:750;animation:pressure-message 1.25s ease-in-out infinite}.sopa-instructions{display:grid;gap:4px;color:#4c506d;font-size:13px}.sopa-instructions span{color:#858aa0;font-size:12px}.word-list{display:flex;flex-wrap:wrap;gap:7px}.word-list span{display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid #e5e7ef;border-radius:9px;background:#fff;color:#50556e;font-size:12px}.word-list span.mine{border-color:#a7f3d0;background:#ecfdf5;color:#087c5b;text-decoration:line-through}.word-list span.claimed{background:#fff8e7;color:#95620b}.word-list small{font-size:10px;text-decoration:none}.wordsearch-grid{display:grid;grid-template-columns:repeat(var(--grid-size),minmax(0,1fr));gap:4px;width:min(100%,560px);margin:0 auto;padding:10px;border:1px solid #e7e8f2;border-radius:16px;background:#f8f9ff;touch-action:none;user-select:none;-webkit-user-select:none}.wordsearch-grid button{aspect-ratio:1;min-width:0;border:1px solid #e6e8f2;border-radius:7px;background:#fff;color:#30345a;font-size:clamp(10px,2.3vw,17px);font-weight:800;cursor:pointer}.wordsearch-grid button:hover:not(:disabled){border-color:#818cf8;background:#f0efff}.wordsearch-grid button.selected{background:#c7d2fe;border-color:#6366f1;color:#312e81}.wordsearch-grid button.found{background:#bbf7d0;border-color:#34d399;color:#065f46}.wordsearch-grid button.found-rival{background:#fed7aa;border-color:#fb923c;color:#9a3412}.wordsearch-grid button:disabled{cursor:default}.sopa-controls{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px}.sopa-controls>span{margin-right:auto;color:#737891;font-size:12px}.sopa-controls .selected-word{margin-right:auto;color:#4f46e5;font-size:13px;letter-spacing:.12em}.sopa-controls .quiet{margin-left:auto}.sopa-controls .primary,.sopa-controls .quiet{margin-top:0}.multi-page.rival-close-pressure::after{content:'';position:fixed;z-index:19;inset:0;border:8px solid rgba(239,68,68,.42);box-shadow:inset 0 0 85px rgba(239,68,68,.14);pointer-events:none;animation:pressure-flash 1.35s ease-in-out infinite}@keyframes pressure-flash{0%,100%{opacity:.2}50%{opacity:.75}}@keyframes pressure-message{0%,100%{background:#fff1f2}50%{background:#ffe4e6}}@media(prefers-reduced-motion:reduce){.multi-page.rival-close-pressure::after,.pressure-alert{animation:none}}
.sopa-missing{padding:18px;border:1px solid #f4d38a;border-radius:13px;background:#fff8e7;color:#825b13;font-size:13px;line-height:1.55}.sopa-missing code{padding:2px 5px;border-radius:5px;background:#fff0c2}
.sopa-feedback{margin:0;padding:10px 12px;border-radius:10px;background:#ecfdf5;color:#087c5b;font-size:13px;font-weight:650}.sopa-feedback.feedback-error{background:#fff1f2;color:#a61b2b}
.crossword-multiplayer{display:grid;gap:22px}.crossword-board-wrap{max-width:100%;overflow-x:auto;padding:8px 2px 14px}.crossword-board{display:grid;grid-template-columns:repeat(15,34px);grid-auto-rows:34px;gap:2px;width:max-content;margin:0 auto;padding:8px;border-radius:14px;background:#e7e9f1}.crossword-cell{position:relative;display:grid;place-items:center;width:34px;height:34px;border-radius:4px;background:#d7d9e3;color:#252951}.crossword-cell.active{border:1px solid #cdd2e2;background:#fff}.crossword-cell.revealed{border-color:#34d399;background:#dcfce7;color:#065f46}.crossword-cell small{position:absolute;top:1px;left:3px;font-size:8px;line-height:1;color:#6b7280}.crossword-cell b{font-size:17px}.crossword-clues{display:grid;grid-template-columns:1fr 1fr;gap:18px}.crossword-clues h3{margin:0 0 10px;color:#302d68}.crossword-clue{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eceef5}.clue-text{display:grid;gap:4px;flex:1}.clue-text b{font-size:13px;color:#424663}.clue-text small{font-size:11px;color:#81869c}.clue-text .clue-solved{color:#07805f;font-weight:700}.crossword-clue form{display:flex;gap:6px}.crossword-clue input{width:135px;padding:9px;text-transform:uppercase}.crossword-clue form button{border:0;border-radius:9px;padding:8px 11px;background:#4f46e5;color:#fff;font-weight:700}.crossword-clue form button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:760px){.crossword-clues{grid-template-columns:1fr}.crossword-clue{align-items:flex-start;flex-direction:column}.crossword-clue form{width:100%}.crossword-clue form input{flex:1}}
.wheel-label{width:82px;height:42px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;text-align:center;line-height:1.08;padding:3px;border-radius:8px;background:#ffffffdf;color:#26215d;font-weight:800;font-size:8px;overflow-wrap:anywhere}.roulette-possibilities{width:min(520px,100%);margin:6px auto 0;padding:12px 16px;border-radius:12px;background:#f5f5ff;color:#39366c;text-align:left}.roulette-possibilities>b{font-size:13px}.roulette-possibilities ol{margin:8px 0 0;padding-left:22px;display:grid;gap:5px}.roulette-possibilities li{font-size:12px;line-height:1.35}
.selected-game{display:grid;gap:5px;margin-top:20px;padding:14px 16px;border:1px solid #e5e7f2;border-radius:12px;background:#f8f8ff}.selected-game span,.selected-game small{color:#777d96;font-size:12px}.selected-game strong{color:#2d2a64}
.lobby-grid{max-width:640px;grid-template-columns:minmax(0,1fr);justify-content:center}
</style>













