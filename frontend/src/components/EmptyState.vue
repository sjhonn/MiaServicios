<!-- Presenta un estado vacio con una accion opcional. -->
<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }
});
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon"><i :class="icon"></i></div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot></slot>
  </div>
</template>
