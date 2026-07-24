<!-- Ejecuta y presenta las operaciones de procesamiento de texto. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { platformApi } from '../services/platformApi.js';
import { downloadFile } from '../utils/formatters.js';

const { push } = useNotifier();
const operations = [
  { id: 'summarize', label: 'Resumen', icon: 'fa-solid fa-align-left', description: 'Reduce el contenido conservando las ideas principales.' },
  { id: 'sentiment', label: 'Sentimiento', icon: 'fa-solid fa-scale-balanced', description: 'Estima la orientacion positiva, neutral o negativa.' },
  { id: 'keywords', label: 'Palabras clave', icon: 'fa-solid fa-tags', description: 'Obtiene los terminos con mayor frecuencia relevante.' },
  { id: 'classify', label: 'Clasificacion', icon: 'fa-solid fa-folder-tree', description: 'Asigna una categoria tematica y nivel de confianza.' },
  { id: 'statistics', label: 'Estadisticas', icon: 'fa-solid fa-chart-simple', description: 'Calcula lectura, densidad y estructura del contenido.' },
  { id: 'normalize', label: 'Normalizacion', icon: 'fa-solid fa-broom', description: 'Corrige espacios, saltos y signos de puntuacion.' }
];
const examples = [
  {
    label: 'Atención al cliente',
    text: 'Durante el último mes se redujo el tiempo de respuesta a los clientes y aumentó el porcentaje de consultas resueltas en el primer contacto. Las solicitudes más frecuentes estuvieron relacionadas con entregas, cambios y actualización de datos. Se recomienda reforzar las respuestas preventivas y revisar los casos que superaron el tiempo esperado.'
  },
  {
    label: 'Operaciones',
    text: 'El proceso de distribucion mejoro el tiempo promedio de entrega y redujo los errores de inventario. El equipo mantuvo una coordinacion estable entre almacen, transporte y servicio al cliente. Todavia existe riesgo de demora en periodos de alta demanda, por lo que se requiere monitoreo continuo.'
  },
  {
    label: 'Seguridad',
    text: 'Se detecto un intento de acceso no autorizado sobre una cuenta de prueba. La sesion fue bloqueada, los tokens fueron revocados y no se encontro perdida de informacion. El equipo recomienda revisar permisos, registros de auditoria y controles de autenticacion.'
  }
];

const selected = ref('summarize');
const executedType = ref('');
const text = ref('');
const sentences = ref(3);
const keywordLimit = ref(8);
const casing = ref('preserve');
const loading = ref(false);
const error = ref('');
const response = ref(null);
const copied = ref(false);
const selectedOperation = computed(() => operations.find((item) => item.id === selected.value));
const textMetrics = computed(() => {
  const value = text.value.trim();
  const words = value ? value.split(/\s+/).length : 0;
  const sentencesCount = value ? value.split(/(?<=[.!?])\s+/).filter(Boolean).length : 0;
  return { characters: text.value.length, words, sentences: sentencesCount, reading: Math.max(words / 200, 0).toFixed(2) };
});
const validText = computed(() => text.value.trim().length >= 20 && text.value.length <= 20000);

const payload = () => ({
  text: text.value,
  ...(selected.value === 'summarize' ? { sentences: sentences.value } : {}),
  ...(selected.value === 'keywords' ? { limit: keywordLimit.value } : {}),
  ...(selected.value === 'normalize' ? { casing: casing.value } : {})
});

const clear = () => {
  text.value = '';
  response.value = null;
  error.value = '';
  executedType.value = '';
};

const loadExample = (value) => {
  text.value = value;
  response.value = null;
  error.value = '';
};

const submit = async () => {
  if (!validText.value) {
    error.value = 'Ingrese un texto de 20 a 20000 caracteres.';
    return;
  }
  loading.value = true;
  error.value = '';
  response.value = null;
  try {
    response.value = await platformApi.runOperation(selected.value, payload());
    executedType.value = selected.value;
    push('La tarea fue completada y guardada en el historial.', 'success');
  } catch (exception) {
    error.value = exception.message;
  } finally {
    loading.value = false;
  }
};

const resultText = () => {
  if (!response.value) return '';
  const result = response.value.result;
  if (executedType.value === 'summarize') return result.summary;
  if (executedType.value === 'sentiment') return `Resultado: ${result.label}\nPuntaje: ${result.score}\nCoincidencias positivas: ${result.positiveMatches}\nCoincidencias negativas: ${result.negativeMatches}`;
  if (executedType.value === 'keywords') return result.keywords.map((item) => `${item.word}: ${item.count}`).join('\n');
  if (executedType.value === 'classify') return `Categoria: ${result.category.replace('_', ' ')}\nConfianza: ${Math.round(result.confidence * 100)}%`;
  if (executedType.value === 'statistics') return Object.entries(result).map(([key, value]) => `${key}: ${value}`).join('\n');
  if (executedType.value === 'normalize') return result.text;
  return JSON.stringify(result, null, 2);
};

const copyResult = async () => {
  await navigator.clipboard.writeText(resultText());
  copied.value = true;
  push('Resultado copiado al portapapeles.', 'success');
  window.setTimeout(() => copied.value = false, 1800);
};

const exportResult = (format) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (format === 'json') {
    downloadFile(`mia-${executedType.value}-${timestamp}.json`, JSON.stringify({ operation: executedType.value, input: text.value, ...response.value }, null, 2), 'application/json;charset=utf-8');
  } else {
    downloadFile(`mia-${executedType.value}-${timestamp}.txt`, resultText());
  }
};

onMounted(() => {
  const draft = sessionStorage.getItem('mia_lab_draft');
  if (!draft) return;
  try {
    const parsed = JSON.parse(draft);
    text.value = parsed.text || '';
    selected.value = parsed.operation || 'summarize';
  } finally {
    sessionStorage.removeItem('mia_lab_draft');
  }
});
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Herramientas de texto</h2>
      <p>Elija una herramienta, agregue su contenido y obtenga un resultado listo para revisar, copiar o descargar.</p>
    </div>

    <section class="operation-grid">
      <button v-for="operation in operations" :key="operation.id" type="button" class="operation-card" :class="{ 'is-active': selected === operation.id }" @click="selected = operation.id">
        <i :class="operation.icon"></i>
        <strong>{{ operation.label }}</strong>
        <span>{{ operation.description }}</span>
      </button>
    </section>

    <div class="lab-grid">
      <section class="panel-card">
        <div class="panel-title">
          <div>
            <h2>{{ selectedOperation.label }}</h2>
            <div class="panel-subtitle">{{ selectedOperation.description }}</div>
          </div>
          <button type="button" class="btn btn-outline-light btn-sm" @click="clear"><i class="fa-solid fa-eraser mr-2"></i>Limpiar</button>
        </div>

        <div class="example-row">
          <span>Ejemplos:</span>
          <button v-for="example in examples" :key="example.label" type="button" class="btn btn-sm btn-outline-secondary" @click="loadExample(example.text)">{{ example.label }}</button>
        </div>

        <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

        <div class="form-group">
          <label for="text-input">Contenido</label>
          <textarea id="text-input" v-model="text" class="form-control text-editor" rows="13" maxlength="20000" placeholder="Escriba o pegue el contenido que desea revisar"></textarea>
          <div class="editor-metrics">
            <span>{{ textMetrics.characters }} caracteres</span>
            <span>{{ textMetrics.words }} palabras</span>
            <span>{{ textMetrics.sentences }} oraciones</span>
            <span>{{ textMetrics.reading }} min de lectura</span>
          </div>
        </div>

        <div v-if="selected === 'summarize'" class="form-group">
          <label for="sentences">Cantidad de oraciones</label>
          <select id="sentences" v-model.number="sentences" class="custom-select">
            <option v-for="value in 10" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>

        <div v-if="selected === 'keywords'" class="form-group">
          <label for="keyword-limit">Cantidad de términos</label>
          <select id="keyword-limit" v-model.number="keywordLimit" class="custom-select">
            <option v-for="value in [5, 8, 10, 12, 15, 20, 25]" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>

        <div v-if="selected === 'normalize'" class="form-group">
          <label for="casing">Tratamiento de mayúsculas</label>
          <select id="casing" v-model="casing" class="custom-select">
            <option value="preserve">Conservar formato</option>
            <option value="lower">Convertir a minúsculas</option>
            <option value="upper">Convertir a mayúsculas</option>
          </select>
        </div>

        <button type="button" class="btn btn-primary" :disabled="loading || !validText" @click="submit">
          <i :class="loading ? 'fa-solid fa-circle-notch fa-spin' : selectedOperation.icon" class="mr-2"></i>
          {{ loading ? 'Procesando' : 'Obtener resultado' }}
        </button>
      </section>

      <section class="panel-card result-panel">
        <div class="panel-title">
          <h2>Resultado</h2>
          <div v-if="response" class="btn-group">
            <button type="button" class="btn btn-outline-light btn-sm" @click="copyResult"><i class="fa-regular fa-copy mr-2"></i>{{ copied ? 'Copiado' : 'Copiar' }}</button>
            <button type="button" class="btn btn-outline-light btn-sm" @click="exportResult('txt')">TXT</button>
            <button type="button" class="btn btn-outline-light btn-sm" @click="exportResult('json')">JSON</button>
          </div>
        </div>

        <div v-if="loading" class="result-placeholder"><div><i class="fa-solid fa-circle-notch fa-spin"></i>Procesando el contenido</div></div>
        <div v-else-if="!response" class="result-placeholder"><div><i class="fa-solid fa-file-lines"></i>El resultado aparecera en este panel.</div></div>

        <template v-else>
          <div v-if="executedType === 'summarize'" class="result-box">{{ response.result.summary }}</div>

          <div v-else-if="executedType === 'sentiment'" class="result-metric">
            <div><span>Resultado</span><strong>{{ response.result.label }}</strong></div>
            <div><span>Puntaje</span><strong>{{ response.result.score }}</strong></div>
            <div><span>Positivas</span><strong>{{ response.result.positiveMatches }}</strong></div>
            <div><span>Negativas</span><strong>{{ response.result.negativeMatches }}</strong></div>
          </div>

          <div v-else-if="executedType === 'keywords'" class="keyword-list">
            <span v-for="keyword in response.result.keywords" :key="keyword.word" class="keyword-chip">{{ keyword.word }} <strong>{{ keyword.count }}</strong></span>
          </div>

          <div v-else-if="executedType === 'classify'" class="result-metric">
            <div><span>Categoria</span><strong>{{ response.result.category.replace('_', ' ') }}</strong></div>
            <div><span>Confianza</span><strong>{{ Math.round(response.result.confidence * 100) }}%</strong></div>
          </div>

          <div v-else-if="executedType === 'statistics'" class="result-metric result-metric-wide">
            <div><span>Caracteres</span><strong>{{ response.result.characters }}</strong></div>
            <div><span>Palabras</span><strong>{{ response.result.words }}</strong></div>
            <div><span>Palabras unicas</span><strong>{{ response.result.uniqueWords }}</strong></div>
            <div><span>Oraciones</span><strong>{{ response.result.sentences }}</strong></div>
            <div><span>Parrafos</span><strong>{{ response.result.paragraphs }}</strong></div>
            <div><span>Densidad lexica</span><strong>{{ response.result.lexicalDensity }}</strong></div>
            <div><span>Promedio por palabra</span><strong>{{ response.result.averageWordLength }}</strong></div>
            <div><span>Lectura estimada</span><strong>{{ response.result.estimatedReadingMinutes }} min</strong></div>
          </div>

          <div v-else-if="executedType === 'normalize'" class="result-box result-box-pre">{{ response.result.text }}</div>

          <div class="result-footer">
            <span>Resultado generado por MiaServicios</span>
            <span>Tiempo: {{ response.processingMs }} ms</span>
          </div>
        </template>
      </section>
    </div>
  </AppShell>
</template>
