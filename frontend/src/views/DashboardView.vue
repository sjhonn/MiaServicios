<!-- Presenta el inicio personal y los accesos de continuidad. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import ActivityBars from '../components/ActivityBars.vue';
import EmptyState from '../components/EmptyState.vue';
import StatCard from '../components/StatCard.vue';
import { platformApi } from '../services/platformApi.js';
import { useAuthStore } from '../stores/auth.js';
import { formatDate, formatNumber, operationLabels } from '../utils/formatters.js';

const auth = useAuthStore();
const loading = ref(true);
const error = ref('');
const history = ref([]);
const stats = ref({ total: 0, totalCharacters: 0, averageMs: 0, daily: [], items: [] });
const health = ref({ services: {} });
const draft = ref(null);

const firstName = computed(() => auth.user?.name?.split(' ')[0] || 'Usuario');
const primaryOperation = computed(() => {
  const first = [...stats.value.items].sort((left, right) => right.total - left.total)[0];
  return first ? operationLabels[first.type] : 'Sin actividad';
});
const todayMessage = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
});
const draftWords = computed(() => draft.value?.text?.trim() ? draft.value.text.trim().split(/\s+/).length : 0);
const readyCount = computed(() => ['auth', 'ai', 'history'].filter((key) => {
  const value = health.value.services?.[key];
  const status = typeof value === 'string' ? value : value?.status;
  return ['ok', 'local'].includes(status);
}).length);

const quickActions = [
  { name: 'text-lab', title: 'Nueva tarea', description: 'Analice o prepare un contenido.', icon: 'fa-solid fa-pen-to-square' },
  { name: 'history', title: 'Revisar historial', description: 'Encuentre resultados anteriores.', icon: 'fa-solid fa-clock-rotate-left' },
  { name: 'templates', title: 'Usar plantilla', description: 'Empiece con contenido preparado.', icon: 'fa-solid fa-layer-group' },
  { name: 'help', title: 'Consultar ayuda', description: 'Revise guías y respuestas rápidas.', icon: 'fa-solid fa-circle-question' }
];

const loadDraft = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('mia_workspace_draft'));
    draft.value = stored?.text ? stored : null;
  } catch {
    draft.value = null;
  }
};

const loadDashboard = async () => {
  loading.value = true;
  error.value = '';
  loadDraft();
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
    <section class="welcome-panel">
      <div>
        <span class="welcome-kicker">{{ todayMessage }}, {{ firstName }}</span>
        <h2>¿Qué desea trabajar hoy?</h2>
        <p>Continúe un borrador, inicie una tarea o recupere un resultado anterior desde el mismo panel.</p>
      </div>
      <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-lg">
        <i class="fa-solid fa-plus mr-2"></i>Comenzar una tarea
      </router-link>
    </section>

    <div v-if="loading" class="loading-line mb-4"></div>
    <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

    <section v-if="draft" class="draft-banner">
      <div class="draft-banner-icon"><i class="fa-solid fa-file-pen"></i></div>
      <div class="draft-banner-copy">
        <span>Borrador disponible</span>
        <strong>{{ draftWords }} palabras listas para continuar</strong>
        <p>{{ draft.text.slice(0, 150) }}{{ draft.text.length > 150 ? '…' : '' }}</p>
      </div>
      <router-link :to="{ name: 'text-lab' }" class="btn btn-outline-light">Continuar borrador</router-link>
    </section>

    <section class="quick-action-grid">
      <router-link v-for="action in quickActions" :key="action.name" :to="{ name: action.name }" class="quick-action-card">
        <span class="quick-action-icon"><i :class="action.icon"></i></span>
        <span><strong>{{ action.title }}</strong><small>{{ action.description }}</small></span>
        <i class="fa-solid fa-arrow-right"></i>
      </router-link>
    </section>

    <section class="metric-grid">
      <StatCard label="Tareas realizadas" :value="formatNumber(stats.total)" detail="Resultados guardados" icon="fa-solid fa-list-check" />
      <StatCard label="Contenido revisado" :value="formatNumber(stats.totalCharacters)" detail="Caracteres procesados" icon="fa-solid fa-file-lines" />
      <StatCard label="Respuesta promedio" :value="`${stats.averageMs || 0} ms`" detail="Tiempo habitual de espera" icon="fa-solid fa-stopwatch" />
      <StatCard label="Resultados favoritos" :value="formatNumber(stats.favoriteTotal || 0)" :detail="`Uso frecuente: ${primaryOperation}`" icon="fa-solid fa-star" />
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

      <aside class="panel-card readiness-card">
        <div class="panel-title"><h3>Disponibilidad</h3></div>
        <div class="readiness-ring" :style="{ '--readiness': `${readyCount / 3 * 360}deg` }">
          <div><strong>{{ readyCount }}/3</strong><span>funciones listas</span></div>
        </div>
        <p>{{ readyCount === 3 ? 'MiaServicios está listo para continuar con su trabajo.' : 'Algunas funciones requieren una revisión desde Configuración.' }}</p>
        <router-link :to="{ name: 'settings' }" class="btn btn-outline-light btn-sm">Revisar configuración</router-link>
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

      <div v-if="history.length" class="recent-result-grid">
        <article v-for="item in history" :key="item.id" class="recent-result-card">
          <div class="recent-result-top"><span class="badge-operation">{{ operationLabels[item.type] }}</span><small>{{ formatDate(item.createdAt, 'short') }}</small></div>
          <p>{{ item.inputPreview }}</p>
          <div><span>{{ item.inputLength }} caracteres</span><span>{{ item.processingMs }} ms</span></div>
        </article>
      </div>

      <EmptyState v-else-if="!loading" title="Todavía no hay actividad" description="Comience una tarea para guardar su primer resultado." icon="fa-solid fa-chart-column">
        <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir espacio de trabajo</router-link>
      </EmptyState>
    </section>
  </AppShell>
</template>
