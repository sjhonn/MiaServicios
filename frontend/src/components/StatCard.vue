<!-- Presenta una metrica principal del panel. -->
<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  detail: { type: String, default: '' },
  icon: { type: String, required: true }
});
</script>

<template>
  <article class="metric-card">
    <div class="metric-icon"><i :class="icon"></i></div>
    <div>
      <div class="metric-label">{{ label }}</div>
      <div class="metric-value">{{ value }}</div>
      <div v-if="detail" class="metric-detail">{{ detail }}</div>
    </div>
  </article>
</template>
