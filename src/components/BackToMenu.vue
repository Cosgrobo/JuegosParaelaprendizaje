<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeButton from './HomeButton.vue'

const route = useRoute()
const titulos = {
  sopa: 'Sopa de letras',
  'crucigrama-personalizado': 'Crucigrama',
  crucigrama: 'Crucigrama',
  ruleta: 'Ruleta de preguntas',
  memorama: 'Memorama',
  preguntas: 'Preguntas',
  DetectiveView: 'Detective Escolar',
  'crear-juego': 'Crear juego',
  'editar-juego': 'Editar juego',
  perfil: 'Mi perfil'
}
const tituloPagina = computed(() => titulos[route.name] || 'Juegos Educativos')
</script>

<template>
  <nav class="game-navbar" aria-label="Navegación del juego">
    <span class="brand">{{ tituloPagina }}</span>
    <HomeButton variant="dark" />
  </nav>
</template>

<style scoped>
.game-navbar {
  width: min(100%, 1100px);
  margin: 0 auto 16px;
  min-height: 62px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  border: 1px solid rgba(199, 210, 254, 0.75);
  border-radius: 18px;
  background: linear-gradient(105deg, #312e81 0%, #4f46e5 72%, #6366f1 100%);
  box-shadow: 0 8px 22px rgba(49, 46, 129, 0.16);
}

.brand {
  color: #fff;
  font-weight: 700;
}


@media (max-width: 480px) {
  .game-navbar {
    min-height: 56px;
    padding: 8px 12px;
  }

  .brand {
    font-size: 14px;
  }

}
</style>
