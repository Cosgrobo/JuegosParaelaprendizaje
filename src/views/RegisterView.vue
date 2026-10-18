<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const nombre = ref('')
const usuario = ref('')
const contraseña = ref('')
const confirmarContraseña = ref('')

const mensaje = ref('')
const tipoMensaje = ref('')
const cargando = ref(false)
const animandoLogin = ref(false)

const registrarUsuario = async () => {
  mensaje.value = ''

  if (
    !nombre.value ||
    !usuario.value ||
    !contraseña.value ||
    !confirmarContraseña.value
  ) {
    mensaje.value = 'Todos los campos son obligatorios'
    tipoMensaje.value = 'error'
    return
  }

  if (contraseña.value !== confirmarContraseña.value) {
    mensaje.value = 'Las contraseñas no coinciden'
    tipoMensaje.value = 'error'
    return
  }

  cargando.value = true

  try {
    const respuesta = await fetch('http://localhost:3000/api/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombre.value,
        usuario: usuario.value,
        contraseña: contraseña.value
      })
    })

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      mensaje.value = datos.mensaje
      tipoMensaje.value = 'error'
      return
    }

    mensaje.value = 'Usuario registrado correctamente'
    tipoMensaje.value = 'exito'

    setTimeout(() => {
      router.push('/')
    }, 1500)

  } catch (error) {
    console.error(error)

    mensaje.value = 'No se pudo conectar con el servidor'
    tipoMensaje.value = 'error'

  } finally {
    cargando.value = false
  }
}

const volverLogin = () => {
  if (animandoLogin.value) return

  animandoLogin.value = true
  window.setTimeout(() => router.push('/'), 650)
}
</script>

<template>
  <main class="registro-page" :class="{ 'saliendo-login': animandoLogin }">
    <aside class="registro-visual" aria-label="Acceso para usuarios con cuenta">
      <div class="visual-panel">
        <div class="welcome-decor" aria-hidden="true">
          <span class="welcome-halo"></span>
          <span class="welcome-orbit welcome-orbit-one"></span>
          <span class="welcome-orbit welcome-orbit-two"></span>
          <span class="welcome-star welcome-star-one">✦</span>
          <span class="welcome-star welcome-star-two">✧</span>
          <span class="welcome-bubble">01</span>
        </div>
        <div class="welcome-content">
          <span class="visual-kicker">QUÉ BUENO VERTE</span>
          <h2>¡Bienvenido de vuelta!</h2>
          <p>¿Ya tienes una cuenta?</p>
          <button class="login-link" type="button" :disabled="animandoLogin" @click="volverLogin">
            Iniciar sesión
          </button>
        </div>
      </div>
    </aside>

    <section class="registro-card" aria-labelledby="registro-titulo">
      <header class="form-header">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 56"><path d="M18 8h28c6 0 10 4 12 11l4 21c.8 4-3.4 7-6.8 4L45 36H19L8.8 44c-3.4 3-7.6 0-6.8-4l4-21C8 12 12 8 18 8Z"/><path d="M20 17v13M12.5 23.5h15"/><circle cx="43" cy="22" r="2.5"/><circle cx="51" cy="29" r="2.5"/></svg>
        </div>
        <p class="brand-name">Juegos Educativos</p>
        <h2 id="registro-titulo">Crear cuenta</h2>
        <p class="form-description">Completa tus datos para comenzar.</p>
      </header>

      <form @submit.prevent="registrarUsuario">
        <div class="campo">
          <label for="nombre">Nombre completo</label>
          <input id="nombre" v-model="nombre" type="text" placeholder="Escribe tu nombre" maxlength="100" autocomplete="name" required>
        </div>
        <div class="campo">
          <label for="usuario">Nombre de usuario</label>
          <input id="usuario" v-model="usuario" type="text" placeholder="Elige un usuario" maxlength="50" autocomplete="username" required>
        </div>
        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <input id="contrasena" v-model="contraseña" type="password" placeholder="Crea una contraseña" autocomplete="new-password" required>
        </div>
        <div class="campo">
          <label for="confirmar-contrasena">Confirmar contraseña</label>
          <input id="confirmar-contrasena" v-model="confirmarContraseña" type="password" placeholder="Escribe de nuevo tu contraseña" autocomplete="new-password" required>
        </div>
        <button class="submit-button" type="submit" :disabled="cargando">
          {{ cargando ? 'Registrando...' : 'Crear mi cuenta' }}
        </button>
      </form>

      <p v-if="mensaje" class="mensaje" :class="tipoMensaje" role="status">{{ mensaje }}</p>
    </section>
  </main>
</template>

<style scoped>
.registro-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(390px, 470px) minmax(0, 1fr);
  grid-template-areas: 'form panel';
  align-items: center;
  gap: clamp(36px, 6vw, 96px);
  overflow: hidden;
  padding: 40px clamp(24px, 6vw, 96px) 40px clamp(24px, 4vw, 64px);
  background: radial-gradient(circle at top left, #dbeafe 0%, transparent 35%), radial-gradient(circle at bottom right, #e0e7ff 0%, transparent 35%), #eef4ff;
}

.registro-page::after {
  position: fixed;
  z-index: 5;
  inset: 0;
  content: '';
  background: #fff;
  pointer-events: none;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform .65s cubic-bezier(.65, 0, .35, 1);
}

.registro-page.saliendo-login::after { transform: scaleX(1); }

.registro-card {
  grid-area: form;
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 34px clamp(28px, 4vw, 48px);
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 30px;
  background: rgba(255, 255, 255, .94);
  box-shadow: 0 24px 60px rgba(49, 46, 129, .14);
}

.form-header { margin-bottom: 26px; text-align: center; }
.brand-mark { display: grid; width: 56px; height: 52px; margin: 0 auto 8px; place-items: center; color: #4f46e5; }
.brand-mark svg { width: 50px; height: 46px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
.brand-name { margin: 0 0 22px; color: #4f46e5; font-size: 14px; font-weight: 800; }
.form-header h2 { margin: 0; color: #24205f; font-size: 30px; letter-spacing: -.04em; }
.form-description { margin: 8px 0 0; color: #64748b; font-size: 14px; }
form { display: grid; gap: 16px; }
.campo { display: grid; gap: 7px; }
.campo label { color: #334155; font-size: 13px; font-weight: 700; }
.campo input { box-sizing: border-box; width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid #dbe2f0; border-radius: 13px; outline: none; background: #f8faff; color: #1e293b; font: inherit; font-size: 14px; transition: border-color .18s ease, box-shadow .18s ease, background .18s ease; }
.campo input:focus { border-color: #818cf8; background: #fff; box-shadow: 0 0 0 4px rgba(99, 102, 241, .12); }
.submit-button { min-height: 49px; margin-top: 4px; border: 0; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; font: inherit; font-size: 15px; font-weight: 750; cursor: pointer; box-shadow: 0 10px 20px rgba(79, 70, 229, .2); transition: transform .18s ease, box-shadow .18s ease; }
.submit-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 13px 24px rgba(79, 70, 229, .26); }
.submit-button:disabled { opacity: .6; cursor: not-allowed; }
.mensaje { margin: 16px 0 0; text-align: center; font-size: 14px; }
.error { color: #dc2626; }
.exito { color: #16a34a; }
.form-footer { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; margin-top: 22px; padding-top: 18px; border-top: 1px solid #e7eaf3; color: #64748b; font-size: 14px; }
.volver { padding: 4px 6px; border: 0; background: transparent; color: #4f46e5; font: inherit; font-weight: 750; cursor: pointer; }
.volver:hover { color: #3730a3; }

.registro-visual { grid-area: panel; width: 100%; justify-self: stretch; }
.visual-panel { position: relative; z-index: 6; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: min(1120px, 86vw); min-height: clamp(680px, 76vh, 740px); margin-left: calc(100% + clamp(24px, 4vw, 64px) - min(1120px, 86vw)); padding: 24px 42px 20px 76px; transform: translateX(40%); overflow: hidden; border: 1px solid #e0e7ff; border-right: 0; border-radius: 34px 0 0 34px; background: #fff; box-shadow: 0 24px 54px rgba(49, 46, 129, .16); }
.visual-panel { transition: transform .65s cubic-bezier(.65, 0, .35, 1), opacity .55s ease; }
.saliendo-login .visual-panel { transform: translateX(calc(-40% + 120vw)); opacity: 1; }
.welcome-decor { position: absolute; z-index: 0; top: 50%; left: 30%; width: min(420px, 56%); aspect-ratio: 1; pointer-events: none; transform: translate(-50%, -50%); }
.welcome-halo { position: absolute; top: 50%; left: 50%; width: 58%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(129, 140, 248, .16), rgba(34, 211, 238, .08) 52%, transparent 72%); filter: blur(4px); transform: translate(-50%, -50%); }
.welcome-orbit { position: absolute; top: 50%; left: 50%; border: 1px solid rgba(99, 102, 241, .14); border-radius: 50%; transform: translate(-50%, -50%); }
.welcome-orbit-one { width: 82%; height: 82%; border-style: dashed; animation: welcome-orbit-turn 34s linear infinite; }
.welcome-orbit-two { width: 64%; height: 64%; border-color: rgba(34, 211, 238, .2); animation: welcome-orbit-turn 25s linear infinite reverse; }
.welcome-star { position: absolute; color: #6366f1; text-shadow: 0 4px 18px rgba(99, 102, 241, .28); }
.welcome-star-one { top: 19%; right: 16%; font-size: 28px; animation: welcome-float 4.8s ease-in-out infinite; }
.welcome-star-two { bottom: 18%; left: 13%; color: #06b6d4; font-size: 22px; animation: welcome-float 5.6s ease-in-out infinite reverse; }
.welcome-bubble { position: absolute; top: 22%; left: 12%; display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid rgba(255, 255, 255, .9); border-radius: 15px; background: linear-gradient(145deg, #818cf8, #4f46e5); color: white; font-size: 12px; font-weight: 800; box-shadow: 0 10px 24px rgba(79, 70, 229, .22); transform: rotate(-10deg); animation: welcome-float 5s ease-in-out infinite; }
.welcome-content { position: absolute; z-index: 1; top: 50%; left: 30%; width: min(380px, 54%); margin: 0; text-align: center; transform: translate(-50%, -50%); }
.welcome-content h2 { margin: 0; color: #24205f; font-size: clamp(34px, 3.5vw, 48px); line-height: 1.1; letter-spacing: -.04em; }
.welcome-content p { margin: 16px 0 18px; color: #5c6787; font-size: 17px; }
.login-link { min-height: 48px; padding: 0 24px; border: 1px solid rgba(79, 70, 229, .28); border-radius: 14px; background: rgba(255, 255, 255, .7); color: #4f46e5; font: inherit; font-weight: 750; cursor: pointer; box-shadow: 0 8px 20px rgba(49, 46, 129, .09); transition: background .18s ease, transform .18s ease, border-color .18s ease; }
.login-link:hover { transform: translateY(-1px); border-color: rgba(79, 70, 229, .5); background: #eef2ff; }
.login-link:disabled, .volver:disabled { cursor: wait; }
@keyframes welcome-orbit-turn { to { rotate: 360deg; } }
@keyframes welcome-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -7px; } }
.visual-content { width: min(460px, 100%); margin-left: 52%; }
.visual-kicker { display: inline-block; margin-bottom: 12px; color: #4f46e5; font-size: 12px; font-weight: 800; letter-spacing: .15em; }
.visual-copy h1 { max-width: 500px; margin: 0; color: #24205f; font-size: clamp(34px, 4vw, 52px); line-height: 1.08; letter-spacing: -.045em; }
.visual-copy p { max-width: 430px; margin: 16px 0 0; color: #5c6787; font-size: 17px; line-height: 1.6; }
.visual-art { position: relative; height: 300px; margin: 22px 0 0; overflow: hidden; border-radius: 26px; background: linear-gradient(125deg, #3730a3 0%, #6366f1 58%, #22d3ee 125%); box-shadow: 0 20px 40px rgba(49, 46, 129, .2); }
.visual-art::before { position: absolute; inset: 0; content: ''; background: radial-gradient(circle at 78% 18%, rgba(255,255,255,.22), transparent 32%), radial-gradient(circle at 15% 90%, rgba(34,211,238,.3), transparent 38%); }
.art-orbit { position: absolute; top: 50%; left: 50%; width: 230px; height: 230px; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; transform: translate(-50%, -50%); }
.orbit-two { width: 170px; height: 170px; border-style: dashed; }
.art-card { position: absolute; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.7); background: rgba(255,255,255,.94); box-shadow: 0 14px 30px rgba(30,27,75,.2); }
.card-word { top: 50%; left: 50%; width: 142px; height: 112px; gap: 2px; border-radius: 22px; color: #3730a3; transform: translate(-50%, -50%) rotate(-5deg); }
.card-word span { color: #818cf8; font-size: 27px; font-weight: 900; letter-spacing: .12em; }
.card-word b { font-size: 15px; }
.card-puzzle, .card-bulb { width: 62px; height: 62px; border-radius: 19px; color: #4f46e5; }
.card-puzzle { top: 20%; left: 18%; transform: rotate(-12deg); }
.card-bulb { right: 17%; bottom: 18%; color: #0891b2; transform: rotate(10deg); }
.card-puzzle svg, .card-bulb svg { width: 34px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
.art-star { position: absolute; color: #fde68a; font-size: 28px; }
.star-one { top: 17%; right: 27%; }
.star-two { bottom: 17%; left: 27%; font-size: 20px; }
.art-label { position: absolute; top: 17%; right: 7%; padding: 10px 14px; border: 1px solid rgba(255,255,255,.7); border-radius: 14px; background: rgba(255,255,255,.93); color: #3730a3; font-size: 12px; font-weight: 800; box-shadow: 0 10px 24px rgba(30,27,75,.18); }
.visual-points { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 18px; color: #53617d; font-size: 13px; font-weight: 650; }
.visual-points span { display: flex; align-items: center; gap: 7px; }
.visual-points b { color: #4f46e5; font-size: 16px; }

@media (max-width: 900px) {
  .registro-page { grid-template-columns: minmax(340px, 430px) minmax(0, 1fr); gap: 28px; padding-right: 28px; }
  .visual-content { margin-left: 46%; }
  .visual-panel { width: min(1120px, 86vw); margin-left: calc(100% + 28px - min(1120px, 86vw)); padding-left: 48px; }
  .visual-art { height: 260px; }
}

@media (max-width: 700px) {
  .registro-page { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'form' 'panel'; gap: 26px; padding: 28px 18px; overflow: hidden; }
  .registro-card { max-width: 470px; justify-self: center; padding: 30px 24px; }
  .registro-visual { max-width: 550px; justify-self: center; }
  .visual-panel { box-sizing: border-box; width: 100%; min-height: 580px; margin: 0; padding: 24px 40px 24px 28px; transform: none; border: 1px solid #e0e7ff; border-radius: 28px; }
  .welcome-decor { left: 50%; width: min(420px, 96%); }
  .welcome-content { position: relative; top: auto; left: auto; width: min(380px, 100%); margin: 0; transform: none; }
  .visual-content { width: 100%; margin: 0; }
  .visual-copy h1 { font-size: 36px; }
  .visual-copy p { font-size: 15px; }
  .visual-art { height: 260px; margin-top: 18px; }
}

@media (max-width: 420px) {
  .registro-card { padding: 26px 20px; }
  .form-header h2 { font-size: 27px; }
  .visual-panel { min-height: 580px; padding: 22px 24px 22px 16px; border-radius: 24px; }
  .visual-copy h1 { font-size: 32px; }
  .visual-art { height: 230px; }
  .card-puzzle, .card-bulb { width: 54px; height: 54px; }
}

@media (prefers-reduced-motion: reduce) {
  .visual-panel { transition-duration: .01ms; }
  .welcome-orbit,
  .welcome-star,
  .welcome-bubble { animation: none; }
}
</style>
