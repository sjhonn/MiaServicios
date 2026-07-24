<!-- Permite ejecutar las funciones NLP disponibles. -->
<script setup>
import { computed, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { platformApi } from '../services/platformApi.js';

const operations = [
  { id: 'summarize', label: 'Resumen', icon: 'fa-solid fa-align-left', description: 'Reduce el texto conservando sus ideas centrales.' },
  { id: 'sentiment', label: 'Sentimiento', icon: 'fa-solid fa-scale-balanced', description: 'Estima la polaridad general del contenido.' },
  { id: 'keywords', label: 'Palabras clave', icon: 'fa-solid fa-tags', description: 'Identifica los terminos con mayor relevancia.' },
  { id: 'classify', label: 'Clasificacion', icon: 'fa-solid fa-folder-tree', description: 'Asigna una categoria tematica al texto.' }
];

const selected = ref('summarize');
const text = ref('La plataforma MiaServicios integra una interfaz web responsive con servicios independientes para autenticacion, procesamiento de lenguaje e historial. La arquitectura busca mantener costos operativos en cero mediante herramientas de codigo abierto y almacenamiento local. El motor permite resumir documentos, analizar sentimiento, extraer palabras clave y clasificar contenido sin depender de una API comercial.');
const sentences = ref(3);
const keywordLimit = ref(8);
const loading = ref(false);
const error = ref('');
const response = ref(null);
const copied = ref(false);

const selectedOperation = computed(() => operations.find((item) => item.id === selected.value));
const characterCount = computed(() => text.value.length);

const payload = computed(() => ({
  text: text.value,
  ...(selected.value === 'summarize' ? { sentences: sentences.value } : {}),
  ...(selected.value === 'keywords' ? { limit: keywordLimit.value } : {})
}));

const submit = async () => {
  error.value = '';
  response.value = null;

  if (text.value.trim().length < 20) {
    error.value = 'Ingrese un texto de al menos 20 caracteres.';
    return;
  }

  loading.value = true;

  try {
    response.value = await platformApi.runOperation(selected.value, payload.value);
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
};

const resultText = computed(() => {
  if (!response.value) return '';
  const result = response.value.result;

  if (selected.value === 'summarize') return result.summary;
  if (selected.value === 'sentiment') return `Sentimiento: ${result.label}. Puntaje: ${result.score}.`;
  if (selected.value === 'keywords') return result.keywords.map((item) => `${item.word} (${item.count})`).join(', ');
  return `Categoria: ${result.category}. Confianza: ${Math.round(result.confidence * 100)}%.`;
});

const copyResult = async () => {
  if (!resultText.value) return;
  await navigator.clipboard.writeText(resultText.value);
  copied.value = true;
  window.setTimeout(() => copied.value = false, 1800);
};
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Laboratorio de texto</h2>
      <p>Seleccione una funcion, ingrese contenido y ejecute el procesamiento. Cada resultado se registra automaticamente en el historial.</p>
    </div>

    <div class="operation-selector">
      <button
        v-for="operation in operations"
        :key="operation.id"
        type="button"
        class="operation-card"
        :class="{ 'is-active': selected === operation.id }"
        @click="selected = operation.id; response = null; error = ''"
      >
        <i :class="operation.icon"></i>
        <strong>{{ operation.label }}</strong>
        <span>{{ operation.description }}</span>
      </button>
    </div>

    <div class="lab-grid">
      <section class="panel-card">
        <div class="panel-title">
          <h2>{{ selectedOperation.label }}</h2>
          <span class="text-muted small">{{ characterCount }} / 12000</span>
        </div>

        <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

        <div class="form-group">
          <label for="source-text">Texto de entrada</label>
          <textarea
            id="source-text"
            v-model="text"
            class="form-control"
            maxlength="12000"
            placeholder="Ingrese el contenido que desea procesar"
          ></textarea>
        </div>

        <div v-if="selected === 'summarize'" class="form-group">
          <label for="sentences">Cantidad de oraciones</label>
          <select id="sentences" v-model.number="sentences" class="custom-select">
            <option v-for="value in 8" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>

        <div v-if="selected === 'keywords'" class="form-group">
          <label for="keyword-limit">Cantidad de terminos</label>
          <select id="keyword-limit" v-model.number="keywordLimit" class="custom-select">
            <option v-for="value in [5, 8, 10, 12, 15, 20]" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>

        <button type="button" class="btn btn-primary" :disabled="loading" @click="submit">
          <i :class="loading ? 'fa-solid fa-circle-notch fa-spin' : selectedOperation.icon" class="mr-2"></i>
          {{ loading ? 'Procesando' : 'Ejecutar analisis' }}
        </button>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <h2>Resultado</h2>
          <button v-if="response" type="button" class="btn btn-outline-light btn-sm" @click="copyResult">
            <i class="fa-regular fa-copy mr-2"></i>{{ copied ? 'Copiado' : 'Copiar' }}
          </button>
        </div>

        <div v-if="loading" class="result-placeholder">
          <div><i class="fa-solid fa-circle-notch fa-spin"></i>Procesando el contenido</div>
        </div>

        <div v-else-if="!response" class="result-placeholder">
          <div><i class="fa-solid fa-file-lines"></i>El resultado aparecera en este panel.</div>
        </div>

        <template v-else>
          <div v-if="selected === 'summarize'" class="result-box">{{ response.result.summary }}</div>

          <div v-if="selected === 'sentiment'" class="result-metric">
            <div><span>Resultado</span><strong>{{ response.result.label }}</strong></div>
            <div><span>Puntaje</span><strong>{{ response.result.score }}</strong></div>
            <div><span>Coincidencias positivas</span><strong>{{ response.result.positiveMatches }}</strong></div>
            <div><span>Coincidencias negativas</span><strong>{{ response.result.negativeMatches }}</strong></div>
          </div>

          <div v-if="selected === 'keywords'" class="keyword-list">
            <span v-for="keyword in response.result.keywords" :key="keyword.word" class="keyword-chip">
              {{ keyword.word }} <strong>{{ keyword.count }}</strong>
            </span>
          </div>

          <div v-if="selected === 'classify'" class="result-metric">
            <div><span>Categoria</span><strong>{{ response.result.category.replace('_', ' ') }}</strong></div>
            <div><span>Confianza</span><strong>{{ Math.round(response.result.confidence * 100) }}%</strong></div>
          </div>

          <div class="text-muted small mt-4">
            Motor: {{ response.engine }} · Tiempo: {{ response.processingMs }} ms
          </div>
        </template>
      </section>
    </div>
  </AppShell>
</template>
