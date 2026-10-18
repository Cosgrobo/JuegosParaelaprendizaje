<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const usuario = ref('')
const contraseña = ref('')
const mensaje = ref('')
const cargando = ref(false)
const animandoRegistro = ref(false)

const iniciarSesion = async () => {
  mensaje.value = ''
  cargando.value = true

  try {
    const respuesta = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: usuario.value,
        contraseña: contraseña.value
      })
    })

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      mensaje.value = datos.mensaje
      return
    }

    localStorage.setItem(
      'usuario',
      JSON.stringify(datos.usuario)
    )

    router.push('/home')

  } catch (error) {
    console.error(error)
    mensaje.value = 'No se pudo conectar con el servidor'

  } finally {
    cargando.value = false
  }
}

const irARegistro = () => {
  if (animandoRegistro.value) return

  animandoRegistro.value = true
  window.setTimeout(() => router.push('/registro'), 650)
}
</script>

<template>
  <div class="login" :class="{ 'saliendo-registro': animandoRegistro }">

    <aside class="login-visual" aria-label="Aprende jugando">
      <div class="feature-card">
        <div class="feature-content">
      <div class="visual-copy">
      <span class="visual-kicker">APRENDE JUGANDO</span>
      <h2>Descubre, juega y aprende algo nuevo.</h2>
      <p>Pequeños retos que convierten cada momento en una aventura.</p>
      </div>

      <div class="visual-art" aria-hidden="true">
        <div class="scene-grid"></div>
        <div class="scene-orbit orbit-outer"></div>
        <div class="scene-orbit orbit-inner"></div>
        <div class="scene-spark spark-top">✦</div>
        <div class="scene-spark spark-bottom">✧</div>
        <div class="scene-core"><span>J</span><i></i></div>

        <div class="scene-widget">
          <div class="widget-heading">
            <span><i></i> TU ESPACIO DE JUEGO</span>
            <b>03</b>
          </div>
          <div class="widget-game">
            <div class="game-symbol">Aa</div>
            <div class="game-copy"><b>Reto de palabras</b><small>Aprende a tu ritmo</small></div>
            <span class="game-arrow">↗</span>
          </div>
          <div class="widget-progress"><span></span></div>
          <div class="widget-caption"><span>Progreso de hoy</span><b>72%</b></div>
        </div>

        <div class="scene-chip chip-points"><span>✦</span> +120 pts</div>
        <div class="scene-chip chip-streak"><span>↗</span> ¡Sigue así!</div>
      </div>
        </div>
      </div>
    </aside>

    <div class="login-card">

      <!-- Encabezado -->
      <div class="encabezado">

        <div class="logo" aria-hidden="true">
          <svg viewBox="0 0 64 56" role="img">
            <path d="M18 8h28c6 0 10 4 12 11l4 21c.8 4-3.4 7-6.8 4L45 36H19L8.8 44c-3.4 3-7.6 0-6.8-4l4-21C8 12 12 8 18 8Z" />
            <path d="M20 17v13M12.5 23.5h15" />
            <circle cx="43" cy="22" r="2.5" />
            <circle cx="51" cy="29" r="2.5" />
          </svg>
        </div>

        <h1>Juegos Educativos</h1>

        <p>
          Aprende jugando
        </p>

      </div>

      <!-- Formulario -->
      <form @submit.prevent="iniciarSesion">

        <div class="campo">

          <label for="usuario">
            Usuario
          </label>

          <div class="input-container">

            <input
              id="usuario"
              v-model="usuario"
              type="text"
              placeholder="Escribe tu usuario"
              required
            >
          </div>

        </div>

        <div class="campo">

          <label for="contraseña">
            Contraseña
          </label>

          <div class="input-container">

            <input
              id="contraseña"
              v-model="contraseña"
              type="password"
              placeholder="Escribe tu contraseña"
              required
            >
          </div>

        </div>

        <!-- Botón principal -->
        <button
          class="login-button"
          type="submit"
          :disabled="cargando"
        >
          {{ cargando ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>

      </form>

      <!-- Mensaje de error -->
      <p
        v-if="mensaje"
        class="mensaje"
      >
        {{ mensaje }}
      </p>

      <!-- Registro -->
      <div class="registro">

        <p>
          ¿No tienes una cuenta?
        </p>

        <button
          type="button"
          :disabled="animandoRegistro"
          class="registro-button"
          @click="irARegistro"
        >
          Registrarse
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>

.login {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(390px, 470px);
  justify-content: stretch;
  align-items: center;
  gap: clamp(36px, 6vw, 96px);

  background:
    radial-gradient(
      circle at top left,
      #dbeafe 0%,
      transparent 35%
    ),
    radial-gradient(
      circle at bottom right,
      #e0e7ff 0%,
      transparent 35%
    ),
    #eef4ff;

  padding: 42px clamp(24px, 6vw, 96px) 42px clamp(24px, 4vw, 64px);
}

.login::after {
  position: fixed;
  z-index: 5;
  inset: 0;
  content: '';
  background: #fff;
  pointer-events: none;
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform .65s cubic-bezier(.65, 0, .35, 1);
}

.login.saliendo-registro::after { transform: scaleX(1); }

.login-visual {
  width: 100%;
  max-width: none;
  justify-self: start;
}

.feature-card {
  position: relative;
  z-index: 6;
  width: min(1120px, 86vw);
  margin-left: calc(-1 * clamp(24px, 4vw, 64px));
  padding: 24px 76px 20px 42px;
  transform: translateX(-40%);
  transition: transform .65s cubic-bezier(.65, 0, .35, 1);
  overflow: hidden;
  border: 1px solid #e0e7ff;
  border-left: 0;
  border-radius: 0 34px 34px 0;
  background: #fff;
  box-shadow: 0 24px 54px rgba(49, 46, 129, 0.16);
}

.saliendo-registro .feature-card { transform: translateX(calc(-40% - 120vw)); }

.feature-content {
  width: min(440px, 100%);
  margin-left: 52%;
}

.visual-kicker {
  display: inline-block;
  margin-bottom: 12px;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.visual-copy h2 {
  max-width: 570px;
  margin: 0;
  color: #24205f;
  font-size: clamp(36px, 4.2vw, 56px);
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.visual-copy > p {
  max-width: 470px;
  margin: 18px 0 0;
  color: #5c6787;
  font-size: 18px;
  line-height: 1.6;
}

.visual-art {
  position: relative;
  width: calc(100% + 28px);
  max-width: calc(100% + 28px);
  height: 330px;
  margin: 16px 0 0 -28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 26px;
  background: linear-gradient(125deg, #3730a3 0%, #6366f1 58%, #22d3ee 125%);
  box-shadow: 0 24px 54px rgba(49, 46, 129, 0.22);
}

.visual-art::before {
  position: absolute;
  content: '';
  inset: 0;
  background:
    radial-gradient(circle at 82% 20%, rgba(255, 255, 255, 0.2), transparent 35%),
    radial-gradient(circle at 15% 90%, rgba(34, 211, 238, 0.32), transparent 38%);
}

.art-glow {
  position: absolute;
  top: -35px;
  right: 2%;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  filter: blur(2px);
}

.learning-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  transform: translate(-50%, -50%) rotate(-5deg);
}

.letters-grid {
  display: grid;
  grid-template-columns: repeat(3, 76px);
  justify-content: center;
  gap: 10px;
}

.letters-grid b {
  display: grid;
  height: 76px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  background: #fff;
  color: #3730a3;
  font-size: 31px;
  box-shadow: 0 12px 24px rgba(22, 24, 79, 0.18);
}

.letters-grid .letter-highlight {
  background: #fbbf24;
  color: #713f12;
  transform: scale(1.08) rotate(2deg);
}

.floating-tile {
  position: absolute;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 14px 28px rgba(22, 24, 79, 0.22);
}

.floating-tile svg {
  width: 38px;
  height: 38px;
}

.puzzle-tile {
  top: 28px;
  left: 12%;
  width: 92px;
  height: 92px;
  transform: rotate(-11deg);
  border-radius: 22px;
  background: #fbbf24;
  color: #713f12;
}

.puzzle-tile svg { fill: currentColor; }

.bulb-tile {
  right: 8%;
  bottom: 42px;
  width: 82px;
  height: 82px;
  transform: rotate(9deg);
  border-radius: 21px;
  background: #fb7185;
  color: #881337;
}

.bulb-tile svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
}

.floating-label {
  position: absolute;
  padding: 9px 13px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.9);
  color: #3730a3;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 9px 22px rgba(22, 24, 79, 0.16);
}

.label-left { bottom: 30px; left: 16%; }
.label-right { top: 35px; right: 8%; }

/* Ilustración educativa con una interfaz flotante y luces ambientales */
.visual-art {
  border: 1px solid rgba(255, 255, 255, .18);
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
  isolation: isolate;
}

.visual-art::before {
  inset: 4% 8%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, .16), transparent 52%),
    radial-gradient(ellipse at 68% 30%, rgba(34, 211, 238, .13), transparent 40%);
  filter: blur(18px);
}

.scene-grid {
  position: absolute;
  inset: 0;
  opacity: .23;
  background-image: radial-gradient(rgba(79, 70, 229, .62) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(ellipse at center, #000 0%, transparent 68%);
}

.scene-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(165, 180, 252, .24);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.orbit-outer { width: 270px; height: 270px; border-color: rgba(99, 102, 241, .28); animation: orbit-turn 28s linear infinite; }
.orbit-inner { width: 205px; height: 205px; border-color: rgba(79, 70, 229, .22); border-style: dashed; opacity: .65; animation: orbit-turn 36s linear infinite reverse; }

.scene-core {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 146px;
  height: 146px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, .58);
  border-radius: 42px;
  background: linear-gradient(145deg, #818cf8, #4f46e5 60%, #312e81);
  box-shadow: 0 22px 48px rgba(49, 46, 129, .3), inset 0 1px rgba(255,255,255,.42);
  transform: translate(-50%, -50%);
  animation: core-drift 6s ease-in-out infinite;
}

.scene-core span {
  color: #fff;
  font-size: 76px;
  font-weight: 800;
  letter-spacing: -.1em;
  text-shadow: 0 5px 24px rgba(165, 180, 252, .65);
  transform: rotate(9deg);
}

.scene-core i {
  position: absolute;
  top: 17px;
  right: 17px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #67e8f9;
  box-shadow: 0 0 18px #67e8f9;
}

.scene-widget {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  width: min(340px, 72%);
  padding: 17px 18px 15px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(239,242,255,.92));
  box-shadow: 0 22px 45px rgba(8, 10, 43, .34);
  transform: translate(-50%, -50%) rotate(2deg);
  animation: widget-float 5s ease-in-out infinite;
}

.widget-heading, .widget-heading > span, .widget-game, .widget-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.widget-heading { color: #73799a; font-size: 9px; font-weight: 800; letter-spacing: .12em; }
.widget-heading > span { justify-content: flex-start; gap: 7px; }
.widget-heading i { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.12); }
.widget-heading b { color: #8589a6; font-size: 11px; }

.widget-game { justify-content: flex-start; gap: 11px; margin-top: 15px; }
.game-symbol { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border-radius: 13px; background: linear-gradient(145deg, #c4b5fd, #818cf8); color: white; font-size: 17px; font-weight: 800; box-shadow: inset 0 1px rgba(255,255,255,.45); }
.game-copy { display: grid; gap: 3px; flex: 1; }
.game-copy b { color: #25274e; font-size: 12px; }
.game-copy small { color: #8b90aa; font-size: 10px; }
.game-arrow { color: #4f46e5; font-size: 19px; }

.widget-progress { height: 5px; margin-top: 15px; overflow: hidden; border-radius: 99px; background: #e4e7f2; }
.widget-progress span { display: block; width: 72%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6366f1, #22d3ee); }
.widget-caption { margin-top: 8px; color: #8b90aa; font-size: 9px; }
.widget-caption b { color: #4f46e5; font-size: 10px; }

.scene-spark { position: absolute; z-index: 1; color: #a5f3fc; text-shadow: 0 0 18px rgba(103,232,249,.8); }
.spark-top { top: 18%; right: 24%; font-size: 28px; }
.spark-bottom { bottom: 16%; left: 22%; font-size: 22px; }

.scene-chip {
  position: absolute;
  z-index: 3;
  padding: 9px 13px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 13px;
  background: rgba(31, 36, 91, .62);
  color: #f8fafc;
  font-size: 10px;
  font-weight: 750;
  box-shadow: 0 12px 28px rgba(8,10,43,.25);
  backdrop-filter: blur(10px);
}

.scene-chip span { margin-right: 4px; color: #67e8f9; }
.chip-points { top: 17%; left: 8%; transform: rotate(-7deg); animation: chip-drift 5.4s ease-in-out infinite; }
.chip-streak { right: 7%; bottom: 16%; transform: rotate(5deg); animation: chip-drift 6s ease-in-out infinite reverse; }

@keyframes widget-float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -9px; }
}

@keyframes orbit-turn { to { rotate: 360deg; } }
@keyframes core-drift { 0%, 100% { translate: 0 0; rotate: -9deg; } 50% { translate: 0 -7px; rotate: -6deg; } }
@keyframes chip-drift { 0%, 100% { translate: 0 0; } 50% { translate: 0 -7px; } }

@media (max-width: 980px) {
  .login {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 26px;
    padding: 36px 24px;
  }

  .login-visual {
    max-width: 550px;
    justify-self: center;
    order: 2;
  }

  .feature-card {
    width: 100%;
    margin-left: 0;
    padding: 24px 40px 24px 28px;
    transform: none;
    border: 1px solid #e0e7ff;
    border-radius: 28px;
  }

  .feature-content {
    width: 100%;
    margin-left: 0;
  }

  .visual-copy h2,
  .visual-copy > p {
    max-width: 550px;
  }

  .visual-art {
    width: 100%;
    height: 320px;
    margin: 16px 0 0;
    border-radius: 22px;
    transform: none;
  }

  .learning-card {
    left: 50%;
  }

  .puzzle-tile {
    left: 8%;
  }

  .label-left {
    left: 12%;
  }

  .login-card {
    order: 1;
    transform: none;
  }
}

/* Tarjeta */

.login-card {
  width: 100%;
  max-width: 470px;
  transform: translateY(-20px);

  padding: 40px;

  background: #ffffff;

  border: 1px solid #e2e8f0;

  border-radius: 30px;

  box-shadow:
    0 20px 45px rgba(30, 58, 95, 0.10);

  text-align: center;
}

/* Encabezado */

.encabezado {
  margin-bottom: 32px;
}

.logo {
  width: 70px;
  height: 70px;

  margin: 0 auto 15px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(145deg, #eef2ff, #ecfeff);

  border-radius: 20px;

  box-shadow:
    0 8px 20px rgba(37, 99, 235, 0.12);
}

.logo svg {
  width: 50px;
  height: 46px;
  fill: none;
  stroke: #4f46e5;
  stroke-width: 2.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.encabezado h1 {
  margin: 0;

  color: #312e81;

  font-size: 27px;
  font-weight: 700;
}

.encabezado p {
  margin-top: 8px;

  color: #64748b;

  font-size: 15px;
}

/* Formulario */

form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  text-align: left;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.campo label {
  color: #334155;

  font-size: 14px;
  font-weight: 600;
}

/* Inputs */

.input-container {
  position: relative;

  display: flex;
  align-items: center;
}

input {
  width: 100%;

  box-sizing: border-box;

  padding: 13px;

  border: 1px solid #cbd5e1;

  border-radius: 10px;

  background: #f8fafc;

  color: #1e293b;

  font-size: 15px;

  outline: none;

  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

input::placeholder {
  color: #94a3b8;
}

input:focus {
  background: #ffffff;

  border-color: #4f46e5;

  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* Botón iniciar sesión */

.login-button {
  margin-top: 5px;

  padding: 13px;

  border: none;

  border-radius: 10px;

  background: linear-gradient(135deg, #4f46e5, #6366f1);

  color: white;

  font-size: 15px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.login-button:hover {
  background: linear-gradient(135deg, #3730a3, #4f46e5);

  transform: translateY(-1px);

  box-shadow:
    0 7px 15px rgba(37, 99, 235, 0.22);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;

  transform: none;

  box-shadow: none;
}

/* Mensaje */

.mensaje {
  margin: 18px 0 0;

  padding: 10px;

  border-radius: 8px;

  background: #fef2f2;

  color: #b91c1c;

  font-size: 14px;
}

/* Registro */

.registro {
  margin-top: 28px;

  padding-top: 22px;

  border-top: 1px solid #e2e8f0;
}

.registro p {
  margin: 0 0 10px;

  color: #64748b;

  font-size: 14px;
}

.registro-button {
  padding: 9px 18px;

  border: none;

  border-radius: 8px;

  background: transparent;

  color: #4f46e5;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s,
    color 0.2s;
}

.registro-button:hover {
  background: #eef2ff;

  color: #3730a3;
}

.registro-button:disabled { cursor: wait; }

/* Adaptación para pantallas pequeñas */

@media (max-width: 480px) {

  .login {
    justify-content: center;
    padding: 26px 18px;
  }

  .login-visual {
    text-align: center;
  }

  .feature-card {
    padding: 22px 24px 22px 16px;
    border-radius: 24px;
  }

  .visual-copy h2 {
    font-size: 32px;
  }

  .visual-copy > p {
    margin: 12px auto 0;
    font-size: 15px;
  }

  .visual-art {
    width: 100%;
    height: 285px;
    margin-top: 18px;
    margin-left: 0;
    border-radius: 26px;
    transform: none;
  }

  .puzzle-tile {
    top: 10px;
    left: 2%;
    width: 62px;
    height: 62px;
  }

  .puzzle-tile svg { width: 30px; height: 30px; }

  .bulb-tile {
    right: 2%;
    bottom: 20px;
    width: 62px;
    height: 62px;
  }

  .bulb-tile svg { width: 30px; height: 30px; }

  .label-left { left: 12px; bottom: 15px; }
  .label-right { top: 15px; right: 12px; }

  .learning-card {
    width: 230px;
    left: 50%;
  }

  .puzzle-tile { left: 2%; }
  .label-left { left: 12px; }

  .letters-grid { grid-template-columns: repeat(3, 58px); gap: 8px; }
  .letters-grid b { height: 58px; border-radius: 17px; font-size: 24px; }

  .login-card {
    max-width: 390px;
  }

  .login-card {
    padding: 30px 24px;
    transform: none;
  }

  .encabezado h1 {
    font-size: 24px;
  }

}

@media (prefers-reduced-motion: reduce) {
  .login::after,
  .feature-card { transition-duration: .01ms; }
  .scene-widget,
  .scene-core,
  .scene-orbit,
  .scene-chip { animation: none; }
}

</style>
