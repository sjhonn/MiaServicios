<!-- Renderiza rutas y notificaciones globales. -->
<script setup>
import AppToastStack from './components/AppToastStack.vue';
</script>

<template>
  <router-view />
  <AppToastStack />
</template>
