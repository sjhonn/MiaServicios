<!-- Presenta una respuesta para rutas inexistentes. -->
<script setup>
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-card">
      <div class="brand-symbol"><i class="fa-solid fa-route"></i></div>
      <span>404</span>
      <h1>Pagina no encontrada</h1>
      <p>La direccion solicitada no existe dentro de MiaServicios.</p>
      <router-link :to="{ name: auth.authenticated ? 'dashboard' : 'login' }" class="btn btn-primary">Volver al inicio</router-link>
    </div>
  </div>
</template>
