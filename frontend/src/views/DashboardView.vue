<!-- Presenta actividad, accesos principales y disponibilidad para el usuario. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import ActivityBars from '../components/ActivityBars.vue';
import EmptyState from '../components/EmptyState.vue';
import StatCard from '../components/StatCard.vue';
import { platformApi } from '../services/platformApi.js';
import { formatDate, formatNumber, operationLabels } from '../utils/formatters.js';

const loading = ref(true);
const error = ref('');
const history = ref([]);
const stats = ref({ total: 0, totalCharacters: 0, averageMs: 0, daily: [], items: [] });
const health = ref({ services: {} });

const primaryOperation = computed(() => {
  const first = [...stats.value.items].sort((left, right) => right.total - left.total)[0];
  return first ? operationLabels[first.type] : 'Sin actividad';
});

const availabilityItems = computed(() => [
  { key: 'auth', label: 'Acceso a la cuenta', icon: 'fa-solid fa-user-shield' },
  { key: 'ai', label: 'Herramientas de texto', icon: 'fa-solid fa-wand-magic-sparkles' },
  { key: 'history', label: 'Historial personal', icon: 'fa-solid fa-clock-rotate-left' }
].map((item) => {
  const value = health.value.services?.[item.key];
  const status = typeof value === 'string' ? value : value?.status;
  return { ...item, ready: ['ok', 'local'].includes(status), status: ['ok', 'local'].includes(status) ? 'Listo' : 'Revisar' };
}));

const readyCount = computed(() => availabilityItems.value.filter((item) => item.ready).length);

const loadDashboard = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [historyResponse, statsResponse, healthResponse] = await Promise.all([
      platformApi.history({ limit: 6, offset: 0 }),
      platformApi.stats(),
      platformApi.health()
    ]);
    history.value = historyResponse.items;
    stats.value = statsResponse;
    health.value = healthResponse;
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
};

onMounted(loadDashboard);
</script>

<template>
  <AppShell>
    <div class="section-heading section-heading-row">
      <div>
        <h2>Tu actividad en MiaServicios</h2>
        <p>Revise lo que ha realizado, continúe una tarea y consulte sus resultados recientes desde un solo lugar.</p>
      </div>
      <router-link :to="{ name: 'text-lab' }" class="btn btn-primary">
        <i class="fa-solid fa-plus mr-2"></i>Comenzar una tarea
      </router-link>
    </div>

    <div v-if="loading" class="loading-line mb-4"></div>
    <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

    <section class="metric-grid">
      <StatCard label="Tareas realizadas" :value="formatNumber(stats.total)" detail="Resultados guardados" icon="fa-solid fa-list-check" />
      <StatCard label="Contenido revisado" :value="formatNumber(stats.totalCharacters)" detail="Caracteres analizados" icon="fa-solid fa-file-lines" />
      <StatCard label="Respuesta promedio" :value="`${stats.averageMs || 0} ms`" detail="Tiempo habitual de espera" icon="fa-solid fa-stopwatch" />
      <StatCard label="Herramienta favorita" :value="primaryOperation" detail="La más utilizada" icon="fa-solid fa-star" />
    </section>

    <section class="dashboard-grid dashboard-grid-wide">
      <article class="panel-card">
        <div class="panel-title">
          <div>
            <h2>Actividad de los últimos siete días</h2>
            <div class="panel-subtitle">Última tarea: {{ formatDate(stats.lastOperationAt, 'short') }}</div>
          </div>
        </div>
        <ActivityBars :items="stats.daily || []" />
      </article>

      <aside class="panel-card">
        <div class="panel-title"><h3>Disponibilidad</h3></div>
        <div class="service-summary">
          <strong>{{ readyCount }}/3</strong>
          <span>funciones listas para usar</span>
        </div>
        <div class="service-list mt-3">
          <div v-for="item in availabilityItems" :key="item.key" class="service-row">
            <div class="service-name"><i :class="item.icon"></i>{{ item.label }}</div>
            <div class="service-state" :class="{ 'is-warning': !item.ready }">{{ item.status }}</div>
          </div>
        </div>
      </aside>
    </section>

    <section class="panel-card mt-4">
      <div class="panel-title">
        <div>
          <h2>Resultados recientes</h2>
          <div class="panel-subtitle">Acceda rápidamente a las últimas tareas guardadas.</div>
        </div>
        <router-link :to="{ name: 'history' }" class="btn btn-outline-light btn-sm">Ver todo</router-link>
      </div>

      <div v-if="history.length" class="table-responsive">
        <table class="table table-dark mb-0">
          <thead><tr><th>Herramienta</th><th>Contenido</th><th>Respuesta</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr v-for="item in history" :key="item.id">
              <td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td>
              <td class="table-preview">{{ item.inputPreview }}</td>
              <td>{{ item.processingMs }} ms</td>
              <td>{{ formatDate(item.createdAt, 'short') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState v-else-if="!loading" title="Todavía no hay actividad" description="Comience una tarea para guardar su primer resultado." icon="fa-solid fa-chart-column">
        <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir herramientas</router-link>
      </EmptyState>
    </section>
  </AppShell>
</template>
