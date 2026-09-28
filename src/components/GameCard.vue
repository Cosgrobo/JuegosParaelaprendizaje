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

    <div class="card-tools">
      <button
        type="button"
        class="icon-action edit-action"
        :aria-label="`Editar ${title}`"
        title="Editar juego"
        @click="$router.push(`/juegos/editar/${id}`)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14 5 5 5M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-action delete-action"
        :aria-label="`Desactivar ${title}`"
        title="Desactivar juego"
        @click="desactivarJuego"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
        </svg>
      </button>
    </div>

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

    </div>

  </div>
</template>

<style scoped>
.game-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(199, 210, 254, 0.7);
  border-radius: 24px;
  padding: 26px;

  display: flex;
  flex-direction: column;

  min-height: 316px;

  box-shadow: 0 10px 26px rgba(49, 46, 129, 0.08);

  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.game-card:hover {
  transform: translateY(-6px);

  border-color: #a5b4fc;
  box-shadow: 0 18px 34px rgba(49, 46, 129, 0.14);
}

.game-icon {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  border: 1px solid #e0e7ff;
  border-radius: 27px;
  background: linear-gradient(145deg, #eef2ff, #ecfeff);
  font-size: 43px;
  box-shadow: inset 0 1px 0 #fff;
}

.card-tools {
  position: absolute;
  top: 13px;
  right: 13px;
  display: flex;
  gap: 4px;
}

.icon-action {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 7px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.icon-action:hover {
  transform: translateY(-1px);
}

.icon-action svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.edit-action {
  color: #4f46e5;
}

.edit-action:hover {
  background: #eef2ff;
}

.delete-action {
  color: #e11d48;
}

.delete-action:hover {
  background: #fff1f2;
}

.game-content {
  flex: 1;
}

.game-content h3 {
  margin: 0 0 10px;

  color: #1e1b4b;
  font-size: 21px;
  letter-spacing: -0.02em;
  text-align: center;
}

.game-content p {
  margin: 0;

  color: #64748b;
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
  border-radius: 13px;

  background: linear-gradient(135deg, #f97316, #fb923c);
  color: white;

  font-size: 15px;
  font-weight: bold;

  cursor: pointer;

  box-shadow: 0 5px 12px rgba(249, 115, 22, 0.22);
  transition: background 0.2s ease, transform 0.2s ease;
}

.play-button:hover {
  background: linear-gradient(135deg, #ea580c, #f97316);
  transform: translateY(-1px);
}


</style>
