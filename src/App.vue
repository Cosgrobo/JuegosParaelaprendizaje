<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppAmbient from './components/AppAmbient.vue'
import './assets/liquid-theme.css'

const route = useRoute()

const mostrarAmbiente = computed(() => {
  return route.path === '/home' || route.path === '/perfil'
})
</script>

<template>
  <div id="app-shell">
    <AppAmbient v-if="mostrarAmbiente" />

    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<style>
:root {
  font-family:
    'Trebuchet MS',
    'Segoe UI',
    system-ui,
    sans-serif;

  color: #172554;

  font-synthesis: none;
  text-rendering: optimizeLegibility;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  min-width: 320px;
  min-height: 100%;
}

body {
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

#app-shell {
  position: relative;
  min-height: 100vh;
}

.app-content {
  position: relative;
  z-index: 1;
}
</style>