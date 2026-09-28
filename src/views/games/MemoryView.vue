<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BackToMenu from '../../components/BackToMenu.vue'

const pares = [
  { id: 1, texto: '🌱', tema: 'Naturaleza' },
  { id: 2, texto: '🌳', tema: 'Naturaleza' },
  { id: 3, texto: '🐝', tema: 'Animales' },
  { id: 4, texto: '🦋', tema: 'Animales' },
  { id: 5, texto: '🌎', tema: 'Planeta' },
  { id: 6, texto: '🌙', tema: 'Planeta' },
  { id: 7, texto: '💧', tema: 'Agua' },
  { id: 8, texto: '☁️', tema: 'Agua' }
]

const cartas = ref([])
const seleccionadas = ref([])
const encontradas = ref([])
const movimientos = ref(0)
const bloqueado = ref(false)
const segundos = ref(0)
let temporizador
let pausa

const completas = computed(() => encontradas.value.length === pares.length)
const tiempo = computed(() => `${String(Math.floor(segundos.value / 60)).padStart(2, '0')}:${String(segundos.value % 60).padStart(2, '0')}`)

function mezclar() {
  cartas.value = [...pares, ...pares].map((par, indice) => ({ ...par, uid: `${par.id}-${indice}`, visible: false }))
    .sort(() => Math.random() - 0.5)
  seleccionadas.value = []
  encontradas.value = []
  movimientos.value = 0
  segundos.value = 0
  bloqueado.value = false
}

function voltear(carta) {
  if (bloqueado.value || carta.visible || encontradas.value.includes(carta.id)) return
  carta.visible = true
  seleccionadas.value.push(carta)
  if (seleccionadas.value.length !== 2) return
  movimientos.value++
  const [primera, segunda] = seleccionadas.value
  if (primera.id === segunda.id) {
    encontradas.value.push(primera.id)
    seleccionadas.value = []
    return
  }
  bloqueado.value = true
  pausa = setTimeout(() => {
    primera.visible = false
    segunda.visible = false
    seleccionadas.value = []
    bloqueado.value = false
  }, 850)
}

onMounted(() => { mezclar(); temporizador = setInterval(() => { if (!completas.value) segundos.value++ }, 1000) })
onUnmounted(() => { clearInterval(temporizador); clearTimeout(pausa) })
</script>

<template>
  <main class="memorama">
    <BackToMenu />
    <header><h1>🧠 Memorama</h1><p>Encuentra las parejas relacionadas por tema.</p></header>
    <section class="estadisticas"><span>Movimientos: <b>{{ movimientos }}</b></span><span>Tiempo: <b>{{ tiempo }}</b></span><button @click="mezclar">Reiniciar</button></section>
    <p v-if="completas" class="victoria">¡Lo lograste! Encontraste todas las parejas en {{ movimientos }} movimientos.</p>
    <section class="tablero" aria-label="Tablero de memorama">
      <button v-for="carta in cartas" :key="carta.uid" class="carta" :class="{ revelada: carta.visible || encontradas.includes(carta.id) }" :aria-label="carta.visible || encontradas.includes(carta.id) ? carta.tema : 'Carta oculta'" @click="voltear(carta)">
        <span v-if="carta.visible || encontradas.includes(carta.id)"><strong>{{ carta.texto }}</strong><small>{{ carta.tema }}</small></span><span v-else class="reverso">?</span>
      </button>
    </section>
  </main>
</template>

<style scoped>
.memorama{max-width:760px;margin:auto;padding:32px 20px;color:#17324d}.memorama header{text-align:center}.memorama h1{font-size:2rem}.estadisticas{display:flex;justify-content:center;align-items:center;gap:24px;margin:24px 0;flex-wrap:wrap}.estadisticas button{border:0;border-radius:10px;padding:10px 18px;background:#2563eb;color:white;cursor:pointer}.tablero{display:grid;grid-template-columns:repeat(4,minmax(65px,1fr));gap:12px}.carta{min-height:120px;border:0;border-radius:14px;background:#2563eb;color:white;box-shadow:0 4px 10px #17324d22;cursor:pointer;font-size:2.2rem}.carta.revelada{background:white;color:#17324d;border:2px solid #bfdbfe}.carta span{display:grid;gap:4px}.carta small{font-size:.8rem}.reverso{font-weight:bold}.victoria{text-align:center;padding:12px;background:#dcfce7;color:#166534;border-radius:10px}@media(max-width:500px){.tablero{gap:8px}.carta{min-height:85px;font-size:1.6rem}}
</style>
