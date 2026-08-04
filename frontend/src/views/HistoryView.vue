<!-- Consulta, filtra, recupera y exporta el historial. -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
const favoriteOnly = ref(false);
const page = ref(1);
const pageSize = ref(10);
const detailItem = ref(null);
const pendingDelete = ref(null);
const confirmClear = ref(false);
const lastDeleted = ref(null);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
let searchTimer;
let undoTimer;

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await platformApi.history({
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      type: type.value,
      search: search.value,
      sort: sort.value,
      favorite: favoriteOnly.value
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

const requestDelete = (item) => {
  pendingDelete.value = item;
};

const remove = async () => {
  const item = pendingDelete.value;
  pendingDelete.value = null;
  if (!item) return;
  try {
    await platformApi.deleteHistory(item.id);
    lastDeleted.value = item;
    window.clearTimeout(undoTimer);
    undoTimer = window.setTimeout(() => lastDeleted.value = null, 10000);
    push('Registro movido temporalmente fuera del historial.', 'success');
    await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const undoDelete = async () => {
  if (!lastDeleted.value) return;
  const item = lastDeleted.value;
  lastDeleted.value = null;
  window.clearTimeout(undoTimer);
  try {
    await platformApi.restoreHistory(item.id);
    push('Registro recuperado.', 'success');
    await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const clearAll = async () => {
  confirmClear.value = false;
  if (!total.value) return;
  try {
    const response = await platformApi.clearHistory();
    push(`${response.deleted || total.value} registros retirados del historial.`, 'success');
    page.value = 1;
    await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const toggleFavorite = async (item) => {
  const next = !item.favorite;
  try {
    const response = await platformApi.setHistoryFavorite(item.id, next);
    item.favorite = response.operation.favorite;
    push(next ? 'Registro agregado a favoritos.' : 'Registro retirado de favoritos.', 'success');
    if (favoriteOnly.value && !next) await load();
  } catch (exception) {
    error.value = exception.message;
  }
};

const exportHistory = async (format) => {
  try {
    const response = await platformApi.history({
      limit: 500,
      offset: 0,
      type: type.value,
      search: search.value,
      sort: sort.value,
      favorite: favoriteOnly.value
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'json') {
      downloadFile(`miaservicios-historial-${timestamp}.json`, JSON.stringify(response.items, null, 2), 'application/json;charset=utf-8');
      return;
    }
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Favorito', 'Operacion', 'Entrada', 'Resultado', 'TiempoMs', 'Fecha'],
      ...response.items.map((item) => [item.favorite ? 'Si' : 'No', operationLabels[item.type], item.inputPreview, resultToText(item), item.processingMs, item.createdAt])
    ];
    downloadFile(`miaservicios-historial-${timestamp}.csv`, rows.map((row) => row.map(escape).join(',')).join('\n'), 'text/csv;charset=utf-8');
  } catch (exception) {
    error.value = exception.message;
  }
};

const printHistory = async () => {
  try {
    const response = await platformApi.history({
      limit: 500,
      offset: 0,
      type: type.value,
      search: search.value,
      sort: sort.value,
      favorite: favoriteOnly.value
    });
    const popup = window.open('', '_blank');
    if (!popup) {
      push('El navegador bloqueó la ventana de impresión.', 'danger');
      return;
    }
    popup.opener = null;
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
    const rows = response.items.map((item) => `<tr><td>${escape(operationLabels[item.type])}</td><td>${escape(item.inputPreview)}</td><td>${escape(resultToText(item))}</td><td>${escape(formatDate(item.createdAt, 'short'))}</td></tr>`).join('');
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Historial | MiaServicios</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#16191d}h1{margin-bottom:4px}p{color:#555}table{border-collapse:collapse;width:100%;margin-top:24px;font-size:12px}th,td{border:1px solid #ccc;padding:8px;vertical-align:top;text-align:left}th{background:#f1f3f5}</style></head><body><h1>MiaServicios</h1><p>Historial de resultados</p><table><thead><tr><th>Herramienta</th><th>Contenido</th><th>Resultado</th><th>Fecha</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  } catch (exception) {
    error.value = exception.message;
  }
};

const copyDetail = async () => {
  if (!detailItem.value) return;
  await navigator.clipboard.writeText(resultToText(detailItem.value));
  push('Resultado copiado.', 'success');
};

watch([type, sort, pageSize, favoriteOnly], () => {
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
onBeforeUnmount(() => {
  window.clearTimeout(searchTimer);
  window.clearTimeout(undoTimer);
});
</script>

<template>
  <AppShell>
    <div class="section-heading section-heading-row">
      <div>
        <h2>Historial de resultados</h2>
        <p>Encuentre tareas anteriores, marque las importantes y recupere eliminaciones recientes.</p>
      </div>
      <div class="btn-toolbar history-actions">
        <div class="btn-group mr-2">
          <button type="button" class="btn btn-outline-light btn-sm" @click="exportHistory('csv')">CSV</button>
          <button type="button" class="btn btn-outline-light btn-sm" @click="exportHistory('json')">JSON</button>
          <button type="button" class="btn btn-outline-light btn-sm" @click="printHistory"><i class="fa-solid fa-print mr-2"></i>PDF</button>
        </div>
        <button type="button" class="btn btn-outline-danger btn-sm" :disabled="!total" @click="confirmClear = true">
          <i class="fa-solid fa-trash-can mr-2"></i>Vaciar historial
        </button>
      </div>
    </div>

    <div v-if="lastDeleted" class="undo-banner">
      <div><i class="fa-solid fa-clock-rotate-left"></i><span>Se retiró un registro del historial.</span></div>
      <button type="button" class="btn btn-sm btn-outline-light" @click="undoDelete">Deshacer</button>
    </div>

    <section class="panel-card">
      <div class="history-filters">
        <div class="form-group mb-0 history-search">
          <label for="history-search">Buscar</label>
          <div class="input-group">
            <div class="input-group-prepend"><span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span></div>
            <input id="history-search" v-model="search" type="search" class="form-control" placeholder="Buscar en contenido o resultado">
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
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
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
        <label class="favorite-filter mb-0">
          <input v-model="favoriteOnly" type="checkbox">
          <span><i class="fa-solid fa-star"></i>Solo favoritos</span>
        </label>
      </div>

      <div v-if="loading" class="loading-line my-4"></div>
      <div v-if="error" class="alert alert-danger-custom mt-4">{{ error }}</div>

      <div v-if="items.length" class="table-responsive mt-4">
        <table class="table table-dark mb-0 history-table">
          <thead><tr><th class="history-favorite-column">Favorito</th><th>Herramienta</th><th>Contenido</th><th>Resultado</th><th>Respuesta</th><th>Fecha</th><th class="text-right">Acciones</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <button type="button" class="favorite-button" :class="{ 'is-active': item.favorite }" :aria-label="item.favorite ? 'Retirar de favoritos' : 'Agregar a favoritos'" @click="toggleFavorite(item)">
                  <i :class="item.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                </button>
              </td>
              <td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td>
              <td class="table-preview">{{ item.inputPreview }}</td>
              <td class="result-preview">{{ resultToText(item) }}</td>
              <td>{{ item.processingMs }} ms</td>
              <td>{{ formatDate(item.createdAt, 'short') }}</td>
              <td class="text-right history-row-actions">
                <button type="button" class="btn btn-outline-light btn-sm" aria-label="Ver detalle" @click="detailItem = item"><i class="fa-solid fa-eye"></i></button>
                <button type="button" class="btn btn-outline-danger btn-sm" aria-label="Eliminar registro" @click="requestDelete(item)"><i class="fa-solid fa-trash-can"></i></button>
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

    <div v-if="detailItem" class="app-modal-backdrop" @click.self="detailItem = null">
      <section class="app-modal history-detail-modal" role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
        <div class="app-modal-header">
          <div><span class="badge-operation">{{ operationLabels[detailItem.type] }}</span><h2 id="history-detail-title">Detalle del resultado</h2></div>
          <button type="button" class="app-modal-close" aria-label="Cerrar" @click="detailItem = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="history-detail-section"><span>Contenido revisado</span><p>{{ detailItem.inputPreview }}</p></div>
        <div class="history-detail-section"><span>Resultado</span><pre>{{ resultToText(detailItem) }}</pre></div>
        <div class="history-detail-meta"><span>{{ formatDate(detailItem.createdAt, 'long') }}</span><span>{{ detailItem.processingMs }} ms</span></div>
        <div class="app-modal-actions">
          <button type="button" class="btn btn-outline-light" @click="copyDetail"><i class="fa-regular fa-copy mr-2"></i>Copiar resultado</button>
          <button type="button" class="btn btn-primary" @click="detailItem = null">Cerrar</button>
        </div>
      </section>
    </div>

    <div v-if="pendingDelete" class="app-modal-backdrop" @click.self="pendingDelete = null">
      <section class="app-modal app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="confirm-icon"><i class="fa-solid fa-trash-can"></i></div>
        <h2 id="delete-title">Retirar este registro</h2>
        <p>Podrá deshacer esta acción durante unos segundos.</p>
        <div class="app-modal-actions">
          <button type="button" class="btn btn-outline-light" @click="pendingDelete = null">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="remove">Retirar</button>
        </div>
      </section>
    </div>

    <div v-if="confirmClear" class="app-modal-backdrop" @click.self="confirmClear = false">
      <section class="app-modal app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-title">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h2 id="clear-title">Vaciar el historial</h2>
        <p>Se retirarán todos los registros visibles de esta cuenta.</p>
        <div class="app-modal-actions">
          <button type="button" class="btn btn-outline-light" @click="confirmClear = false">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="clearAll">Vaciar historial</button>
        </div>
      </section>
    </div>
  </AppShell>
</template>
