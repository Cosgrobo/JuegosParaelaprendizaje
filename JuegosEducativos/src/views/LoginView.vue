<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const iniciarSesion = () => {
  router.push('/home')
}
</script>

<template>
  <div>
    <h1>Iniciar sesión</h1>

    <input
      type="text"
      placeholder="Usuario"
    >

    <input
      type="password"
      placeholder="Contraseña"
    >

    <button @click="iniciarSesion">
      Iniciar sesión
    </button>
  </div>
</template>