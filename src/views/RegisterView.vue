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
  router.push('/')
}
</script>

<template>
  <div class="registro">
    <div class="registro-card">

      <h1>🎮 Juegos Educativos</h1>

      <h2>Crear cuenta</h2>

      <form @submit.prevent="registrarUsuario">

        <input
          v-model="nombre"
          type="text"
          placeholder="Nombre completo"
          maxlength="100"
        >

        <input
          v-model="usuario"
          type="text"
          placeholder="Nombre de usuario"
          maxlength="50"
        >

        <input
          v-model="contraseña"
          type="password"
          placeholder="Contraseña"
        >

        <input
          v-model="confirmarContraseña"
          type="password"
          placeholder="Confirmar contraseña"
        >

        <button
          type="submit"
          :disabled="cargando"
        >
          {{ cargando ? 'Registrando...' : 'Registrarse' }}
        </button>

      </form>

      <p
        v-if="mensaje"
        :class="tipoMensaje"
      >
        {{ mensaje }}
      </p>

      <button
        class="volver"
        type="button"
        @click="volverLogin"
      >
        Volver al inicio de sesión
      </button>

    </div>
  </div>
</template>

<style scoped>
.registro {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f6f8;
}

.registro-card {
  width: 350px;
  padding: 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.registro-card h1 {
  margin-bottom: 10px;
}

.registro-card h2 {
  margin-bottom: 25px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}

button {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-top: 20px;
  color: #dc2626;
}

.exito {
  margin-top: 20px;
  color: #16a34a;
}

.volver {
  margin-top: 20px;
  background: #6b7280;
}
</style>