<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  id: Number,
  title: String,
  description: String,
  icon: String,
  route: String,
  unit: String,

  kind: {
    type: String,
    default: ''
  }
})

const claseTema = computed(() => {
  const tipo =
    String(props.kind || '')
      .toLowerCase()

  if (
    tipo.includes('crucigrama')
  ) {
    return 'theme-violet'
  }

  if (
    tipo.includes('sopa')
  ) {
    return 'theme-blue'
  }

  if (
    tipo.includes('memorama')
  ) {
    return 'theme-green'
  }

  if (
    tipo.includes('detective')
  ) {
    return 'theme-gold'
  }

  if (
    tipo.includes('ruleta')
  ) {
    return 'theme-cyan'
  }

  if (
    tipo.includes('quiz') ||
    tipo.includes('preguntas')
  ) {
    return 'theme-pink'
  }

  return 'theme-blue'
})


const desactivarJuego = async () => {

  const confirmar =
    confirm(
      `¿Seguro que quieres eliminar el juego "${props.title}"?`
    )

  if (!confirmar) {
    return
  }

  try {

    const respuesta =
      await fetch(
        `http://localhost:3000/api/juegos/${props.id}/desactivar`,
        {
          method: 'PATCH'
        }
      )


    const datos =
      await respuesta.json()


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


    alert(
      'No se pudo desactivar el juego'
    )

  }

}
</script>


<template>

  <article
    class="game-card"
    :class="claseTema"
  >

    <div class="card-glow"></div>


    <div class="card-tools">

      <button
        type="button"
        class="icon-action edit-action"
        :aria-label="`Editar ${title}`"
        title="Editar juego"
        @click="$router.push(`/juegos/editar/${id}`)"
      >

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="m14 5 5 5M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z"
          />

        </svg>

      </button>


      <button
        type="button"
        class="icon-action delete-action"
        :aria-label="`Desactivar ${title}`"
        title="Desactivar juego"
        @click="desactivarJuego"
      >

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
          />

        </svg>

      </button>

    </div>


    <div class="game-icon">

      <AppIcon
        :name="icon"
        :size="34"
      />

    </div>


    <div class="game-content">

      <div class="meta-line">

        <span
          v-if="unit"
          class="game-unit"
        >
          {{ unit }}
        </span>


        <span
          v-if="kind"
          class="game-type"
        >
          {{ kind }}
        </span>

      </div>


      <h3>
        {{ title }}
      </h3>


      <p>
        {{ description }}
      </p>

    </div>


    <div class="game-actions">

      <button
        class="play-button"
        @click="$router.push(route)"
      >

        <span class="play-arrow">
          ▶
        </span>

        <span>
          Jugar
        </span>

      </button>

    </div>

  </article>

</template>


<style scoped>
.game-card {
  --accent-a: #2563eb;
  --accent-b: #4f46e5;
  --accent-soft: rgba(99, 102, 241, 0.12);

  position: relative;

  overflow: hidden;

  min-height: 330px;

  padding: 26px;

  display: flex;

  flex-direction: column;

  border-radius: 28px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.62
    );

  background:
    linear-gradient(
      160deg,
      rgba(
        255,
        255,
        255,
        0.84
      ),
      rgba(
        255,
        255,
        255,
        0.62
      )
    );

  box-shadow:
    0 18px 36px
    rgba(
      30,
      41,
      59,
      0.08
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.76
    );

  backdrop-filter:
    blur(16px)
    saturate(140%);

  -webkit-backdrop-filter:
    blur(16px)
    saturate(140%);

  transition:
    transform
    0.22s ease,
    box-shadow
    0.22s ease,
    border-color
    0.22s ease;
}


.game-card:hover {
  transform:
    translateY(-7px);

  border-color:
    rgba(
      165,
      180,
      252,
      0.9
    );

  box-shadow:
    0 22px 42px
    rgba(
      49,
      46,
      129,
      0.12
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.82
    );
}


.card-glow {
  position: absolute;

  inset:
    -30%
    auto
    auto
    -20%;

  width: 160px;
  height: 160px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      var(--accent-soft),
      transparent 68%
    );

  pointer-events: none;
}


.card-tools {
  position: absolute;

  top: 14px;
  right: 14px;

  display: flex;

  gap: 6px;

  z-index: 2;
}


.icon-action {
  width: 36px;
  height: 36px;

  display: grid;

  place-items: center;

  padding: 7px;

  border:
    1px solid
    rgba(
      148,
      163,
      184,
      0.14
    );

  border-radius: 12px;

  background:
    rgba(
      255,
      255,
      255,
      0.54
    );

  cursor: pointer;

  backdrop-filter:
    blur(10px);

  -webkit-backdrop-filter:
    blur(10px);

  transition:
    background
    0.16s ease,
    transform
    0.16s ease,
    border-color
    0.16s ease;
}


.icon-action:hover {
  transform:
    translateY(-1px);
}


.icon-action svg {
  width: 19px;
  height: 19px;

  fill: none;

  stroke: currentColor;

  stroke-width: 1.8;

  stroke-linecap: round;

  stroke-linejoin: round;
}


.edit-action {
  color:
    var(--accent-b);
}


.edit-action:hover {
  background:
    rgba(
      238,
      242,
      255,
      0.88
    );

  border-color:
    rgba(
      99,
      102,
      241,
      0.22
    );
}


.delete-action {
  color:
    #e11d48;
}


.delete-action:hover {
  background:
    rgba(
      255,
      241,
      242,
      0.92
    );

  border-color:
    rgba(
      244,
      63,
      94,
      0.20
    );
}


.game-icon {
  width: 86px;
  height: 86px;

  margin:
    8px auto 18px;

  display: grid;

  place-items: center;

  border-radius: 28px;

  color:
    var(--accent-b);

  border:
    1px solid
    rgba(
      191,
      219,
      254,
      0.9
    );

  background:
    linear-gradient(
      145deg,
      rgba(
        239,
        246,
        255,
        0.92
      ),
      rgba(
        238,
        242,
        255,
        0.75
      )
    );

  box-shadow:
    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.9
    ),

    0 12px 20px
    rgba(
      99,
      102,
      241,
      0.08
    );
}


.game-content {
  flex: 1;
}


.meta-line {
  display: flex;

  gap: 8px;

  justify-content: center;

  flex-wrap: wrap;

  margin-bottom: 10px;
}


.game-unit,
.game-type {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: fit-content;

  padding:
    6px 11px;

  border-radius: 999px;

  font-size: 11.5px;

  font-weight: 800;

  letter-spacing: 0.03em;

  text-transform: uppercase;
}


.game-unit {
  background:
    rgba(
      238,
      242,
      255,
      0.92
    );

  color:
    #4338ca;
}


.game-type {
  background:
    rgba(
      239,
      246,
      255,
      0.9
    );

  color:
    #1d4ed8;
}


.game-content h3 {
  margin:
    0 0 10px;

  color:
    #1e1b4b;

  font-size:
    clamp(
      1.35rem,
      1rem + 0.45vw,
      1.65rem
    );

  letter-spacing:
    -0.03em;

  text-align: center;

  line-height: 1.1;
}


.game-content p {
  margin: 0;

  color:
    #64748b;

  line-height: 1.55;

  text-align: center;

  min-height: 48px;
}


.game-actions {
  margin-top: 22px;
}


.play-button {
  width: 100%;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 9px;

  padding:
    13px 16px;

  border: none;

  border-radius: 16px;

  background:
    linear-gradient(
      135deg,
      var(--accent-a),
      var(--accent-b)
    );

  color: white;

  font-size: 15px;

  font-weight: 800;

  cursor: pointer;

  box-shadow:
    0 10px 20px
    rgba(
      79,
      70,
      229,
      0.18
    ),

    inset
    0 1px 0
    rgba(
      255,
      255,
      255,
      0.20
    );

  transition:
    transform
    0.2s ease,
    filter
    0.2s ease;
}


.play-button:hover {
  transform:
    translateY(-1px);

  filter:
    brightness(1.04);
}


.play-arrow {
  font-size: 12px;
}


.theme-blue {
  --accent-a: #2563eb;
  --accent-b: #3b82f6;
  --accent-soft: rgba(59, 130, 246, 0.15);
}


.theme-violet {
  --accent-a: #6d28d9;
  --accent-b: #8b5cf6;
  --accent-soft: rgba(139, 92, 246, 0.16);
}


.theme-green {
  --accent-a: #059669;
  --accent-b: #10b981;
  --accent-soft: rgba(16, 185, 129, 0.16);
}


.theme-gold {
  --accent-a: #ca8a04;
  --accent-b: #f59e0b;
  --accent-soft: rgba(245, 158, 11, 0.16);
}


.theme-cyan {
  --accent-a: #0891b2;
  --accent-b: #06b6d4;
  --accent-soft: rgba(6, 182, 212, 0.16);
}


.theme-pink {
  --accent-a: #db2777;
  --accent-b: #ec4899;
  --accent-soft: rgba(236, 72, 153, 0.16);
}
</style>