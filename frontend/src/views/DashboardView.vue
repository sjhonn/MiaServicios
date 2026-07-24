<!-- Presenta metricas, actividad y estado de servicios. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import EmptyState from '../components/EmptyState.vue';
import StatCard from '../components/StatCard.vue';
import { platformApi } from '../services/platformApi.js';

const loading = ref(true);
const error = ref('');
const history = ref([]);
const stats = ref({ total: 0, items: [] });
const health = ref({ services: {} });

const operationLabels = {
  summarize: 'Resumen',
  sentiment: 'Sentimiento',
  keywords: 'Palabras clave',
  classify: 'Clasificacion'
};

const averageMs = computed(() => {
  const total = stats.value.items.reduce((sum, item) => sum + item.averageMs * item.total, 0);
  return stats.value.total ? (total / stats.value.total).toFixed(2) : '0.00';
});

const primaryOperation = computed(() => {
  const first = [...stats.value.items].sort((left, right) => right.total - left.total)[0];
  return first ? operationLabels[first.type] : 'Sin datos';
});

const serviceCount = computed(() => Object.keys(health.value.services || {}).length || 3);

const formatDate = (value) => new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(value));

const loadDashboard = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [historyResponse, statsResponse, healthResponse] = await Promise.all([
      platformApi.history(),
      platformApi.stats(),
      platformApi.health()
    ]);
    history.value = historyResponse.items.slice(0, 6);
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
    <div class="section-heading">
      <h2>Resumen operativo</h2>
      <p>Vista consolidada del uso de las funciones NLP, rendimiento del motor y disponibilidad de los componentes.</p>
    </div>

    <div v-if="loading" class="loading-line mb-4"></div>
    <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

    <section class="metric-grid">
      <StatCard label="Operaciones" :value="stats.total" detail="Procesamientos registrados" icon="fa-solid fa-layer-group" />
      <StatCard label="Tiempo promedio" :value="`${averageMs} ms`" detail="Ejecucion local del motor" icon="fa-solid fa-gauge-high" />
      <StatCard label="Funcion principal" :value="primaryOperation" detail="Operacion mas utilizada" icon="fa-solid fa-ranking-star" />
      <StatCard label="Componentes" :value="serviceCount" detail="Servicios supervisados" icon="fa-solid fa-server" />
    </section>

    <section class="dashboard-grid">
      <article class="panel-card">
        <div class="panel-title">
          <h2>Actividad reciente</h2>
          <router-link :to="{ name: 'history' }" class="btn btn-outline-light btn-sm">Ver historial</router-link>
        </div>

        <div v-if="history.length" class="table-responsive">
          <table class="table table-dark mb-0">
            <thead>
              <tr>
                <th>Operacion</th>
                <th>Entrada</th>
                <th>Tiempo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history" :key="item.id">
                <td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td>
                <td>{{ item.inputPreview }}</td>
                <td>{{ item.processingMs }} ms</td>
                <td>{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-else-if="!loading"
          title="Todavia no hay actividad"
          description="Ejecute una operacion en el laboratorio para generar la primera entrada del historial."
          icon="fa-solid fa-chart-column"
        >
          <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir laboratorio</router-link>
        </EmptyState>
      </article>

      <aside class="panel-card">
        <div class="panel-title">
          <h3>Estado de plataforma</h3>
        </div>
        <div class="service-list">
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-shield-halved"></i>Autenticacion</div>
            <div class="service-state">{{ health.services?.auth || 'local' }}</div>
          </div>
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-brain"></i>Motor NLP</div>
            <div class="service-state">{{ health.services?.ai || 'local' }}</div>
          </div>
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-database"></i>Historial</div>
            <div class="service-state">{{ health.services?.history || 'local' }}</div>
          </div>
        </div>

        <div class="alert alert-dark-custom mt-4 mb-0">
          <strong>{{ platformApi.isDemo ? 'Modo estatico' : 'Modo microservicios' }}</strong>
          <div class="small mt-2 text-muted">
            {{ platformApi.isDemo ? 'Los datos permanecen en el almacenamiento local del navegador.' : 'El gateway orquesta servicios independientes con persistencia SQLite.' }}
          </div>
        </div>
      </aside>
    </section>
  </AppShell>
</template>
