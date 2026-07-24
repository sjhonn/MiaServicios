<!-- Consulta y administra el historial de operaciones. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import EmptyState from '../components/EmptyState.vue';
import { platformApi } from '../services/platformApi.js';

const items = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const type = ref('all');

const labels = {
  summarize: 'Resumen',
  sentiment: 'Sentimiento',
  keywords: 'Palabras clave',
  classify: 'Clasificacion'
};

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();

  return items.value.filter((item) => {
    const matchesType = type.value === 'all' || item.type === type.value;
    const matchesSearch = !term || item.inputPreview.toLowerCase().includes(term) || labels[item.type].toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });
});

const formatDate = (value) => new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value));

const resultSummary = (item) => {
  if (item.type === 'summarize') return item.result.summary;
  if (item.type === 'sentiment') return `${item.result.label} (${item.result.score})`;
  if (item.type === 'keywords') return item.result.keywords.map((entry) => entry.word).join(', ');
  return `${item.result.category.replace('_', ' ')} (${Math.round(item.result.confidence * 100)}%)`;
};

const load = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await platformApi.history();
    items.value = response.items;
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
};

const remove = async (item) => {
  const accepted = window.confirm('Se eliminara este registro del historial.');
  if (!accepted) return;

  try {
    await platformApi.deleteHistory(item.id);
    items.value = items.value.filter((current) => current.id !== item.id);
  } catch (exception) {
    error.value = exception.message;
  }
};

onMounted(load);
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Historial de procesamiento</h2>
      <p>Registro cronologico de las operaciones realizadas por el usuario activo.</p>
    </div>

    <section class="panel-card">
      <div class="row align-items-end mb-4">
        <div class="col-md-7 mb-3 mb-md-0">
          <label for="history-search">Buscar</label>
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text bg-dark border-secondary text-muted"><i class="fa-solid fa-magnifying-glass"></i></span>
            </div>
            <input id="history-search" v-model="search" type="search" class="form-control" placeholder="Buscar por texto u operacion">
          </div>
        </div>
        <div class="col-md-5">
          <label for="history-type">Tipo de operacion</label>
          <select id="history-type" v-model="type" class="custom-select">
            <option value="all">Todas</option>
            <option value="summarize">Resumen</option>
            <option value="sentiment">Sentimiento</option>
            <option value="keywords">Palabras clave</option>
            <option value="classify">Clasificacion</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-line mb-4"></div>
      <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

      <div v-if="filteredItems.length" class="table-responsive">
        <table class="table table-dark mb-0">
          <thead>
            <tr>
              <th>Operacion</th>
              <th>Texto</th>
              <th>Resultado</th>
              <th>Rendimiento</th>
              <th>Fecha</th>
              <th class="text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td><span class="badge-operation">{{ labels[item.type] }}</span></td>
              <td style="min-width: 240px">{{ item.inputPreview }}</td>
              <td style="min-width: 220px">{{ resultSummary(item) }}</td>
              <td>{{ item.processingMs }} ms</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="text-right">
                <button type="button" class="btn btn-outline-danger btn-sm" aria-label="Eliminar registro" @click="remove(item)">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else-if="!loading"
        title="No se encontraron registros"
        description="Modifique los filtros o ejecute una nueva operacion en el laboratorio."
        icon="fa-solid fa-clock-rotate-left"
      >
        <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir laboratorio</router-link>
      </EmptyState>
    </section>
  </AppShell>
</template>
