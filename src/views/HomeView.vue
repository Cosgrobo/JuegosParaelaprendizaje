<script setup>
import { ref, onMounted } from 'vue'
import GameCard from '../components/GameCard.vue'

const juegos = ref([])
const cargando = ref(true)
const mensaje = ref('')
const iconosPorTipo = {
  'Sopa de letras': '\u{1F50D}',
  Crucigrama: '\u{1F9E9}',
  Ruleta: '\u{1F3A1}',
  Memorama: '\u{1F9E0}',
  Preguntas: '\u{2753}',
  Detective: '\u{1F575}\u{FE0F}'
}

const obtenerIcono = (tipo) => iconosPorTipo[tipo] || '\u{1F3AE}'

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

    <header class="navbar">
      <div class="brand">
      <h1>🎮 Juegos Educativos</h1>
      <p>Plataforma de juegos didácticos</p>
      </div>
      <nav class="nav-actions" aria-label="Navegación principal">
        <button class="profile-button" type="button" aria-label="Abrir perfil" @click="$router.push('/perfil')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.14 0-7.5 2.24-7.5 5v2h15v-2c0-2.76-3.36-5-7.5-5Z" /></svg>
        </button>
      </nav>
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
          :icon="obtenerIcono(juego.tipo)"
          :route="
           juego.tipo === 'Sopa de letras'
            ? `/juegos/sopa/${juego.id_juego}`
             : juego.tipo === 'Crucigrama'
              ? `/juegos/crucigrama/${juego.id_juego}`
             : juego.tipo === 'Ruleta'
               ? '/juegos/ruleta'
               : juego.tipo === 'Memorama'
                 ? '/juegos/memorama'
                 : juego.tipo === 'Preguntas'
                   ? '/juegos/preguntas'
              : '#'
            "
        />

      </div>

      <section class="create-action">
        <button class="create-button" @click="$router.push('/juegos/crear')">
          + Crear juego
        </button>
      </section>
    </main>

  </div>
</template>

<style scoped>

.home {
  min-height: 100vh;
  padding: 0 40px 40px;

  background: #f4f6f8;
}

.navbar {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 -40px 40px;
  padding: 14px 40px;
  background: white;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
}

.brand h1 {
  margin: 0 0 5px;
  color: #1e3a5f;
}

.brand p {
  margin: 0;
  color: #64748b;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

main {
  max-width: 1100px;
  margin: 0 auto;
}

main h2 {
  margin-bottom: 25px;
  color: #334155;
}

.create-button {
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-size: 15px;
  cursor: pointer;
}

.create-action {
  margin-top: 40px;
  text-align: center;
}

.create-button:hover {
  background: #15803d;
}

.profile-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid #dbe3ee;
  border-radius: 50%;
  background: #f8fafc;
  color: #1e3a5f;
  cursor: pointer;
}

.profile-button svg {
  width: 23px;
  height: 23px;
  fill: currentColor;
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

@media (max-width: 600px) {
  .home {
    padding: 0 18px 28px;
  }

  .navbar {
    margin: 0 -18px 30px;
    padding: 14px 18px;
  }

  .brand h1 {
    font-size: 20px;
  }

  .brand p {
    font-size: 13px;
  }

  .nav-actions {
    gap: 8px;
  }

  .create-button {
    padding: 10px 12px;
    font-size: 13px;
  }
}


</style>
