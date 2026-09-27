<script setup>
const props = defineProps({
  id: Number,
  title: String,
  description: String,
  icon: String,
  route: String
})

const desactivarJuego = async () => {
  const confirmar = confirm(
    `¿Seguro que quieres desactivar el juego "${props.title}"?`
  )

  if (!confirmar) {
    return
  }

  try {
    const respuesta = await fetch(
      `http://localhost:3000/api/juegos/${props.id}/desactivar`,
      {
        method: 'PATCH'
      }
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      alert(datos.mensaje)
      return
    }

    alert(datos.mensaje)

    window.location.reload()

  } catch (error) {
    console.error(
      'Error al desactivar el juego:',
      error
    )

    alert('No se pudo desactivar el juego')
  }
}
</script>

<template>
  <div class="game-card">

    <div class="game-icon">
      {{ icon }}
    </div>

    <div class="game-content">
      <h3>{{ title }}</h3>

      <p>{{ description }}</p>
    </div>

    <div class="game-actions">

      <button
        class="play-button"
        @click="$router.push(route)"
      >
        ▶ Jugar
      </button>

      <div class="secondary-actions">

        <button
          class="edit-button"
          @click="$router.push(`/juegos/editar/${id}`)"
        >
          ✏️ Editar
        </button>

        <button
          class="delete-button"
          @click="desactivarJuego"
        >
          🗑️ Desactivar
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.game-card {
  background: white;
  border-radius: 16px;
  padding: 24px;

  display: flex;
  flex-direction: column;

  min-height: 300px;

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.game-card:hover {
  transform: translateY(-4px);

  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.game-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.game-content {
  flex: 1;
}

.game-content h3 {
  margin: 0 0 10px;

  font-size: 22px;
  text-align: center;
}

.game-content p {
  margin: 0;

  color: #666;
  line-height: 1.5;
  text-align: center;
}

.game-actions {
  margin-top: 20px;
}

.play-button {
  width: 100%;

  padding: 11px 15px;

  border: none;
  border-radius: 8px;

  background: #198754;
  color: white;

  font-size: 15px;
  font-weight: bold;

  cursor: pointer;

  transition: background 0.2s ease;
}

.play-button:hover {
  background: #157347;
}

.secondary-actions {
  display: flex;
  gap: 8px;

  margin-top: 8px;
}

.edit-button,
.delete-button {
  flex: 1;

  padding: 9px 10px;

  border: none;
  border-radius: 8px;

  color: white;

  font-size: 13px;

  cursor: pointer;

  transition: background 0.2s ease;
}

.edit-button {
  background: #0d6efd;
}

.edit-button:hover {
  background: #0b5ed7;
}

.delete-button {
  background: #dc3545;
}

.delete-button:hover {
  background: #bb2d3b;
}
</style>