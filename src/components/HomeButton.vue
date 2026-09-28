<script setup>
defineProps({
  variant: {
    type: String,
    default: 'light'
  }
})
</script>

<template>
  <router-link
    to="/home"
    class="home-button"
    :class="`home-button--${variant}`"
    aria-label="Volver al menú"
    title="Volver al menú"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9" />
    </svg>
  </router-link>
</template>

<style scoped>
.home-button {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid rgba(79, 70, 229, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.48);
  color: #3730a3;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.home-button:hover {
  transform: translateY(-1px);
  border-color: rgba(79, 70, 229, 0.45);
  background: rgba(255, 255, 255, 0.72);
}

.home-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.home-button--dark {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.home-button--dark:hover {
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.22);
}

svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
</style>