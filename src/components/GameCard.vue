<script setup>
defineProps({
  title: String,
  description: String,
  icon: String,
  route: String
})
</script>

<template>
  <div class="game-card">
    <div class="game-icon">
      {{ icon }}
    </div>

    <h3>{{ title }}</h3>

    <p>{{ description }}</p>

    <button @click="$router.push(route)">
      Jugar
    </button>
  </div>
</template>

<style scoped>
.game-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  width: 220px;
  text-align: center;
}

.game-icon {
  font-size: 40px;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>