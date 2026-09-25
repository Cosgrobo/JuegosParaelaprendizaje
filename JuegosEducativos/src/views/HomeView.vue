<script setup>
import GameCard from '../components/GameCard.vue'
</script>

<template>
  <div class="home">
    
    <header>
      <h1>🎮 Juegos Educativos</h1>
      <p>Plataforma de juegos didácticos</p>
    </header>

    <main>
      <h2>Selecciona una actividad</h2>

      <div class="games">

        <GameCard
          title="Sopa de letras"
          description="Encuentra las palabras relacionadas con el tema."
          icon="🔎"
          route="/juegos/sopa"
        />

        <GameCard
          title="Crucigrama"
          description="Resuelve las pistas y completa el crucigrama."
          icon="✏️"
          route="/juegos/crucigrama"
        />

        <GameCard
          title="Ruleta"
          description="Gira la ruleta y responde la pregunta."
          icon="🎡"
          route="/juegos/ruleta"
        />

        <GameCard
          title="Memorama"
          description="Encuentra las parejas relacionadas."
          icon="🧠"
          route="/juegos/memorama"
        />

        <GameCard
          title="Preguntas"
          description="Pon a prueba tus conocimientos."
          icon="❓"
          route="/juegos/preguntas"
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
}

header {
  text-align: center;
  margin-bottom: 40px;
}

header h1 {
  margin-bottom: 10px;
}

main {
  max-width: 1000px;
  margin: auto;
}

main h2 {
  text-align: center;
  margin-bottom: 30px;
}

.games {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.history {
  text-align: center;
  margin-top: 40px;
}

.history button {
  padding: 12px 25px;
  cursor: pointer;
}

</style>