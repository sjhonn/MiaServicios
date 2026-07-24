<!-- Muestra notificaciones globales no intrusivas. -->
<script setup>
import { useNotifier } from '../composables/useNotifier.js';

const { notifications, remove } = useNotifier();
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div v-for="item in notifications" :key="item.id" class="app-toast" :class="`is-${item.type}`">
      <i :class="item.type === 'success' ? 'fa-solid fa-circle-check' : item.type === 'danger' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info'"></i>
      <span>{{ item.message }}</span>
      <button type="button" aria-label="Cerrar" @click="remove(item.id)"><i class="fa-solid fa-xmark"></i></button>
    </div>
  </div>
</template>
