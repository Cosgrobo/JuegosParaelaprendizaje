<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <nav class="game-navbar" aria-label="Navegación del juego">
    <span class="brand">Juegos Educativos</span>
    <button
      type="button"
      class="home-button"
      aria-label="Volver al menú principal"
      @click="router.push('/home')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
      </svg>
      <span>Menú principal</span>
    </button>
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
}

.brand {
  color: #1e3a5f;
  font-weight: 700;
}

.home-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e3a5f;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.home-button:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.home-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

@media (max-width: 480px) {
  .game-navbar {
    min-height: 56px;
    padding: 8px 12px;
  }

  .brand {
    font-size: 14px;
  }

  .home-button {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
