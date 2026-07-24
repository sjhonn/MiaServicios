<!-- Grafica la actividad diaria con barras CSS. -->
<script setup>
import { computed } from 'vue';

const props = defineProps({ items: { type: Array, default: () => [] } });
const maximum = computed(() => Math.max(...props.items.map((item) => item.total), 1));
const heightFor = (total) => `${Math.max(8, Math.round(total / maximum.value * 100))}%`;
const labelFor = (date) => new Intl.DateTimeFormat('es-PE', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
</script>

<template>
  <div class="activity-chart" role="img" aria-label="Actividad de los ultimos siete dias">
    <div v-for="item in items" :key="item.date" class="activity-column">
      <div class="activity-value">{{ item.total }}</div>
      <div class="activity-track"><div class="activity-bar" :style="{ height: heightFor(item.total) }"></div></div>
      <div class="activity-label">{{ labelFor(item.date) }}</div>
    </div>
  </div>
</template>
