<!-- Informa cuando una lista no contiene registros. -->
<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'fa-solid fa-inbox' }
});
</script>

<template>
  <div class="empty-state">
    <i :class="icon"></i>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot></slot>
  </div>
</template>
