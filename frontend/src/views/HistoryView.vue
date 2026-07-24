<!-- Consulta, filtra, exporta y elimina el historial. -->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import EmptyState from '../components/EmptyState.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { platformApi } from '../services/platformApi.js';
import { downloadFile, formatDate, operationLabels, resultToText } from '../utils/formatters.js';

const { push } = useNotifier();
const items = ref([]);
const total = ref(0);
const loading = ref(true);
const error = ref('');
const search = ref('');
const type = ref('all');
const sort = ref('newest');
const page = ref(1);
const pageSize = ref(10);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
let searchTimer;

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await platformApi.history({
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      type: type.value,
      search: search.value,
      sort: sort.value
    });
    items.value = response.items;
    total.value = response.total;
    if (page.value > pageCount.value) page.value = pageCount.value;
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
};

const remove = async (item) => {
  if (!window.confirm('Se eliminara este registro del historial.')) return;
  try {
    await platformApi.deleteHistory(item.id);
    push('Registro eliminado.', 'success');
    await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const clearAll = async () => {
  if (!total.value || !window.confirm('Se eliminara todo el historial del usuario.')) return;
  try {
    const response = await platformApi.clearHistory();
    push(`${response.deleted || total.value} registros eliminados.`, 'success');
    page.value = 1;
    await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const exportHistory = async (format) => {
  try {
    const response = await platformApi.history({ limit: 500, offset: 0, type: type.value, search: search.value, sort: sort.value });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'json') {
      downloadFile(`miaservicios-historial-${timestamp}.json`, JSON.stringify(response.items, null, 2), 'application/json;charset=utf-8');
      return;
    }
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Operacion', 'Entrada', 'Resultado', 'TiempoMs', 'Fecha'],
      ...response.items.map((item) => [operationLabels[item.type], item.inputPreview, resultToText(item), item.processingMs, item.createdAt])
    ];
    downloadFile(`miaservicios-historial-${timestamp}.csv`, rows.map((row) => row.map(escape).join(',')).join('\n'), 'text/csv;charset=utf-8');
  } catch (exception) {
    error.value = exception.message;
  }
};

watch([type, sort, pageSize], () => {
  page.value = 1;
  load();
});
watch(page, load);
watch(search, () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    page.value = 1;
    load();
  }, 350);
});

onMounted(load);
</script>

<template>
  <AppShell>
    <div class="section-heading section-heading-row">
      <div>
        <h2>Historial de resultados</h2>
        <p>Encuentre tareas anteriores, revise resultados y exporte la información que necesite.</p>
      </div>
      <div class="btn-toolbar history-actions">
        <div class="btn-group mr-2">
          <button type="button" class="btn btn-outline-light btn-sm" @click="exportHistory('csv')">CSV</button>
          <button type="button" class="btn btn-outline-light btn-sm" @click="exportHistory('json')">JSON</button>
        </div>
        <button type="button" class="btn btn-outline-danger btn-sm" :disabled="!total" @click="clearAll">
          <i class="fa-solid fa-trash-can mr-2"></i>Vaciar historial
        </button>
      </div>
    </div>

    <section class="panel-card">
      <div class="history-filters">
        <div class="form-group mb-0 history-search">
          <label for="history-search">Buscar</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span></div>
            <input id="history-search" v-model="search" type="search" class="form-control" placeholder="Buscar por contenido">
          </div>
        </div>
        <div class="form-group mb-0">
          <label for="history-type">Herramienta</label>
          <select id="history-type" v-model="type" class="custom-select">
            <option value="all">Todas</option>
            <option v-for="(label, key) in operationLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="form-group mb-0">
          <label for="history-sort">Orden</label>
          <select id="history-sort" v-model="sort" class="custom-select">
            <option value="newest">Mas recientes</option>
            <option value="oldest">Mas antiguos</option>
          </select>
        </div>
        <div class="form-group mb-0">
          <label for="history-size">Filas</label>
          <select id="history-size" v-model.number="pageSize" class="custom-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-line my-4"></div>
      <div v-if="error" class="alert alert-danger-custom mt-4">{{ error }}</div>

      <div v-if="items.length" class="table-responsive mt-4">
        <table class="table table-dark mb-0 history-table">
          <thead><tr><th>Herramienta</th><th>Contenido</th><th>Resultado</th><th>Respuesta</th><th>Fecha</th><th class="text-right">Acción</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td>
              <td class="table-preview">{{ item.inputPreview }}</td>
              <td class="result-preview">{{ resultToText(item) }}</td>
              <td>{{ item.processingMs }} ms</td>
              <td>{{ formatDate(item.createdAt, 'short') }}</td>
              <td class="text-right">
                <button type="button" class="btn btn-outline-danger btn-sm" aria-label="Eliminar registro" @click="remove(item)"><i class="fa-solid fa-trash-can"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState v-else-if="!loading" title="No se encontraron registros" description="Cambie los filtros o comience una nueva tarea." icon="fa-solid fa-clock-rotate-left">
        <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir herramientas</router-link>
      </EmptyState>

      <div v-if="total" class="pagination-bar">
        <span>Mostrando {{ items.length }} de {{ total }} registros</span>
        <div class="btn-group">
          <button type="button" class="btn btn-outline-light btn-sm" :disabled="page <= 1" @click="page -= 1"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" class="btn btn-outline-light btn-sm disabled">Página {{ page }} de {{ pageCount }}</button>
          <button type="button" class="btn btn-outline-light btn-sm" :disabled="page >= pageCount" @click="page += 1"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </section>
  </AppShell>
</template>
