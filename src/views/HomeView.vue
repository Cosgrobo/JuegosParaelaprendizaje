<script setup>
import { ref, onMounted } from 'vue'
import GameCard from '../components/GameCard.vue'

const juegos = ref([])
const cargando = ref(true)
const mensaje = ref('')

const obtenerJuegos = async () => {
  try {
    const respuesta = await fetch('http://localhost:3000/api/juegos')

    if (!respuesta.ok) {
      throw new Error('No se pudieron obtener los juegos')
    }

    juegos.value = await respuesta.json()

  } catch (error) {
    console.error(error)
    mensaje.value = 'No se pudieron cargar los juegos'

  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  obtenerJuegos()
})
</script>

<template>
  <div class="home">

    <header>
      <h1>🎮 Juegos Educativos</h1>
      <p>Plataforma de juegos didácticos</p>
    </header>

    <main>

      <h2>Selecciona una actividad</h2>

      <!-- Cargando -->
      <p v-if="cargando">
        Cargando juegos...
      </p>

      <!-- Error -->
      <p v-else-if="mensaje" class="error">
        {{ mensaje }}
      </p>

      <!-- Juegos -->
      <div
        v-else
        class="games"
      >

        <GameCard
          v-for="juego in juegos"
          :key="juego.id_juego"
          :id="juego.id_juego"
          :title="juego.nombre"
          :description="juego.descripcion"
          :icon="juego.tipo === 'Sopa de letras'
            ? '🔎'
            : juego.tipo === 'Crucigrama'
              ? '✏️'
              : juego.tipo === 'Ruleta'
                ? '🎡'
                : juego.tipo === 'Memorama'
                  ? '🧠'
                  : juego.tipo === 'Preguntas'
                    ? '❓'
                    : '🎮'"
          :route="
           juego.tipo === 'Sopa de letras'
            ? `/juegos/sopa/${juego.id_juego}`
             : juego.tipo === 'Crucigrama'
              ? '/juegos/crucigrama'
             : juego.tipo === 'Ruleta'
               ? '/juegos/ruleta'
              : '#'
            "
        />

      </div>

      <section class="history">
        <button @click="$router.push('/historial')">
          📊 Mi historial
        </button>
      </section>

    </main>

  </div>
</template>

<style scoped>

.home {
  min-height: 100vh;
  padding: 40px;

  background: #f4f6f8;
}

header {
  text-align: center;
  margin-bottom: 40px;
}

header h1 {
  margin-bottom: 10px;
  color: #1e3a5f;
}

header p {
  color: #64748b;
}

main {
  max-width: 1100px;
  margin: 0 auto;
}

main h2 {
  margin-bottom: 25px;
  color: #334155;
}

.games {
  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(220px, 1fr));

  gap: 20px;
}

.error {
  color: #dc2626;
}

.history {
  margin-top: 40px;
  text-align: center;
}

.history button {
  padding: 12px 20px;

  border: none;
  border-radius: 8px;

  background: #2563eb;

  color: white;

  font-size: 15px;

  cursor: pointer;
}

.history button:hover {
  background: #1d4ed8;
}

</style>