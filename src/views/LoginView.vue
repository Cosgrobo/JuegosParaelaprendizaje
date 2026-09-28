<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const usuario = ref('')
const contraseña = ref('')
const mensaje = ref('')
const cargando = ref(false)

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
  router.push('/registro')
}
</script>

<template>
  <div class="login">

    <div class="login-card">

      <!-- Encabezado -->
      <div class="encabezado">

        <div class="logo">
          🎮
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
            <span class="icono">👤</span>

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
            <span class="icono">🔒</span>

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
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

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

  padding: 20px;
}

/* Tarjeta */

.login-card {
  width: 100%;
  max-width: 390px;

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

  font-size: 36px;

  box-shadow:
    0 8px 20px rgba(37, 99, 235, 0.12);
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

.icono {
  position: absolute;
  left: 13px;

  font-size: 17px;

  pointer-events: none;
}

input {
  width: 100%;

  box-sizing: border-box;

  padding: 13px 13px 13px 43px;

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

/* Adaptación para pantallas pequeñas */

@media (max-width: 480px) {

  .login-card {
    padding: 30px 24px;
  }

  .encabezado h1 {
    font-size: 24px;
  }

}

</style>
