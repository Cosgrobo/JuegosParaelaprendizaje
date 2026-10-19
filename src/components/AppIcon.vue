<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'controller'
  },

  size: {
    type: Number,
    default: 28
  }
})

const iconName = computed(() =>
  String(props.name || 'controller').toLowerCase()
)
</script>

<template>
  <span
    class="app-icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`
    }"
    aria-hidden="true"
  >

    <!-- SOPA DE LETRAS -->
    <svg
      v-if="iconName === 'search'"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>


    <!-- CRUCIGRAMA -->
    <svg
      v-else-if="iconName === 'grid'"
      viewBox="0 0 24 24"
    >
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>


    <!-- RULETA -->
    <svg
      v-else-if="iconName === 'wheel'"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v8l6.5 3.5" />
      <path d="M12 12 6 18" />
    </svg>


    <!-- MEMORAMA -->
    <svg
      v-else-if="iconName === 'cards'"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="6" width="8" height="11" rx="2" />
      <rect x="11" y="8" width="8" height="11" rx="2" />
    </svg>


    <!-- PREGUNTAS -->
    <svg
      v-else-if="iconName === 'question'"
      viewBox="0 0 24 24"
    >
      <path d="M9.5 9a2.8 2.8 0 1 1 4.5 2.2c-1 .8-2 1.4-2 3" />
      <circle cx="12" cy="18" r="1" />
      <circle cx="12" cy="12" r="9" />
    </svg>


    <!-- DETECTIVE -->
    <svg
      v-else-if="iconName === 'detective'"
      viewBox="0 0 24 24"
    >
      <path d="M6 10c1.5-3 4-4.5 6-4.5S16.5 7 18 10" />
      <path d="M8 9.5 6 8l2-2 2 1" />
      <path d="m16 9.5 2-1.5-2-2-2 1" />

      <circle cx="10" cy="12" r="1" />
      <circle cx="14" cy="12" r="1" />

      <path d="M9.5 15c1.4 1 3.6 1 5 0" />
      <path d="M4 10.5c0 5 3.6 8.5 8 8.5s8-3.5 8-8.5" />
    </svg>


    <!-- USUARIO -->
    <svg
      v-else-if="iconName === 'user'"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>


    <!-- CONTROL -->
    <svg
      v-else
      viewBox="0 0 24 24"
    >
      <path d="M8 9H6v2H4v2h2v2h2v-2h2v-2H8Z" />

      <circle cx="16.5" cy="10.5" r="1.1" />
      <circle cx="18.8" cy="13.1" r="1.1" />

      <path
        d="
          M7 18
          c-1.7 0-2.8-1.6-3.1-3.2
          L3 10.9
          C2.7 8.6 4.5 7 6.8 7
          h10.4
          c2.3 0 4.1 1.6 3.8 3.9
          l-.9 3.9
          C19.8 16.4 18.7 18 17 18
          c-1 0-1.7-.3-2.7-1.3
          l-.8-.8
          c-.4-.4-.6-.6-1.5-.6
          s-1.1.2-1.5.6
          l-.8.8
          C8.7 17.7 8 18 7 18Z
        "
      />
    </svg>

  </span>
</template>

<style scoped>
.app-icon {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  flex: 0 0 auto;
}

svg {
  width: 100%;
  height: 100%;

  fill: none;

  stroke: currentColor;

  stroke-width: 1.9;

  stroke-linecap: round;

  stroke-linejoin: round;
}
</style>