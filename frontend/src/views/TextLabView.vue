<!-- Gestiona el espacio de trabajo, comparacion y exportacion de resultados. -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { platformApi } from '../services/platformApi.js';
import { downloadFile } from '../utils/formatters.js';

const DRAFT_KEY = 'mia_workspace_draft';
const MAX_FILE_BYTES = 1024 * 1024;
const { push } = useNotifier();
const operations = [
  { id: 'summarize', label: 'Resumen', icon: 'fa-solid fa-align-left', description: 'Reduce el contenido conservando las ideas principales.' },
  { id: 'sentiment', label: 'Sentimiento', icon: 'fa-solid fa-scale-balanced', description: 'Identifica una orientación positiva, neutral o negativa.' },
  { id: 'keywords', label: 'Palabras clave', icon: 'fa-solid fa-tags', description: 'Encuentra los términos con mayor relevancia.' },
  { id: 'classify', label: 'Clasificación', icon: 'fa-solid fa-folder-tree', description: 'Organiza el contenido dentro de una categoría.' },
  { id: 'statistics', label: 'Estadísticas', icon: 'fa-solid fa-chart-simple', description: 'Mide lectura, extensión y estructura del contenido.' },
  { id: 'normalize', label: 'Limpieza', icon: 'fa-solid fa-broom', description: 'Corrige espacios, saltos y signos de puntuación.' }
];
const examples = [
  {
    label: 'Atención al cliente',
    text: 'Durante el último mes se redujo el tiempo de respuesta a los clientes y aumentó el porcentaje de consultas resueltas en el primer contacto. Las solicitudes más frecuentes estuvieron relacionadas con entregas, cambios y actualización de datos. Se recomienda reforzar las respuestas preventivas y revisar los casos que superaron el tiempo esperado.'
  },
  {
    label: 'Operaciones',
    text: 'El proceso de distribución mejoró el tiempo promedio de entrega y redujo los errores de inventario. El equipo mantuvo una coordinación estable entre almacén, transporte y servicio al cliente. Todavía existe riesgo de demora en periodos de alta demanda, por lo que se requiere monitoreo continuo.'
  },
  {
    label: 'Informe general',
    text: 'El periodo evaluado mostró avances en el cumplimiento de actividades, una mejor organización de la información y mayor claridad en el seguimiento. Se identificaron oportunidades relacionadas con la estandarización de criterios, el control de pendientes y la comunicación de resultados. El siguiente periodo debe priorizar acciones medibles y responsables definidos.'
  }
];

const selected = ref('summarize');
const executedType = ref('');
const executedInput = ref('');
const text = ref('');
const sentences = ref(3);
const keywordLimit = ref(8);
const casing = ref('preserve');
const loading = ref(false);
const error = ref('');
const response = ref(null);
const copied = ref(false);
const fileInput = ref(null);
const focusMode = ref(false);
const comparisonMode = ref(false);
const dragActive = ref(false);
const draftSavedAt = ref('');
const favoriteSaved = ref(false);
let saveTimer;

const selectedOperation = computed(() => operations.find((item) => item.id === selected.value));
const textMetrics = computed(() => {
  const value = text.value.trim();
  const words = value ? value.split(/\s+/).length : 0;
  const sentenceCount = value ? value.split(/(?<=[.!?])\s+/).filter(Boolean).length : 0;
  return {
    characters: text.value.length,
    words,
    sentences: sentenceCount,
    reading: Math.max(words / 200, 0).toFixed(2)
  };
});
const validText = computed(() => text.value.trim().length >= 20 && text.value.length <= 20000);
const executedOperation = computed(() => operations.find((item) => item.id === executedType.value));
const canCompare = computed(() => Boolean(response.value && ['summarize', 'normalize'].includes(executedType.value)));
const draftStatus = computed(() => draftSavedAt.value
  ? `Borrador guardado a las ${new Date(draftSavedAt.value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
  : 'El borrador se guarda automáticamente');

const payload = () => ({
  text: text.value,
  ...(selected.value === 'summarize' ? { sentences: sentences.value } : {}),
  ...(selected.value === 'keywords' ? { limit: keywordLimit.value } : {}),
  ...(selected.value === 'normalize' ? { casing: casing.value } : {})
});

const saveDraft = () => {
  const savedAt = new Date().toISOString();
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    text: text.value,
    operation: selected.value,
    sentences: sentences.value,
    keywordLimit: keywordLimit.value,
    casing: casing.value,
    savedAt
  }));
  draftSavedAt.value = savedAt;
};

const restoreDraft = () => {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft?.text) return false;
    text.value = draft.text;
    selected.value = draft.operation || 'summarize';
    sentences.value = Number(draft.sentences || 3);
    keywordLimit.value = Number(draft.keywordLimit || 8);
    casing.value = draft.casing || 'preserve';
    draftSavedAt.value = draft.savedAt || '';
    return true;
  } catch {
    return false;
  }
};

const resetResult = () => {
  response.value = null;
  error.value = '';
  executedType.value = '';
  executedInput.value = '';
  comparisonMode.value = false;
  favoriteSaved.value = false;
};

const clear = () => {
  text.value = '';
  resetResult();
  localStorage.removeItem(DRAFT_KEY);
  draftSavedAt.value = '';
};

const loadExample = (value) => {
  text.value = value;
  resetResult();
};

const loadTextFile = async (file) => {
  if (!file) return;
  if (file.size > MAX_FILE_BYTES) throw new Error('El archivo supera el límite de 1 MB.');
  if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
    throw new Error('Seleccione un archivo de texto en formato TXT.');
  }
  text.value = (await file.text()).slice(0, 20000);
  resetResult();
  push('Contenido importado.', 'success');
};

const importText = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  try {
    await loadTextFile(file);
  } catch (exception) {
    push(exception.message, 'danger');
  }
};

const dropText = async (event) => {
  dragActive.value = false;
  try {
    await loadTextFile(event.dataTransfer?.files?.[0]);
  } catch (exception) {
    push(exception.message, 'danger');
  }
};

const pasteContent = async () => {
  try {
    const value = await navigator.clipboard.readText();
    if (!value.trim()) throw new Error();
    text.value = value.slice(0, 20000);
    resetResult();
    push('Contenido pegado desde el portapapeles.', 'success');
  } catch {
    push('No fue posible leer el portapapeles. Pegue el contenido manualmente.', 'danger');
  }
};

const submit = async () => {
  if (!validText.value) {
    error.value = 'Ingrese un texto de 20 a 20000 caracteres.';
    return;
  }
  loading.value = true;
  error.value = '';
  response.value = null;
  comparisonMode.value = false;
  favoriteSaved.value = false;
  try {
    const requestPayload = payload();
    response.value = await platformApi.runOperation(selected.value, requestPayload);
    executedType.value = selected.value;
    executedInput.value = requestPayload.text;
    saveDraft();
    if (response.value.historySaved === false) {
      push(response.value.warning || 'El resultado fue generado, pero no se guardó en el historial.', 'info');
    } else {
      push('La tarea fue completada y guardada en el historial.', 'success');
    }
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
  if (executedType.value === 'classify') return `Categoría: ${result.category.replace('_', ' ')}\nConfianza: ${Math.round(result.confidence * 100)}%`;
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
    downloadFile(`miaservicios-${executedType.value}-${timestamp}.json`, JSON.stringify({ operation: executedType.value, input: executedInput.value, ...response.value }, null, 2), 'application/json;charset=utf-8');
  } else {
    downloadFile(`miaservicios-${executedType.value}-${timestamp}.txt`, resultText());
  }
};

const wrapCanvasLines = (context, value, maxWidth) => {
  const lines = [];
  String(value).split('\n').forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      return;
    }
    let line = words.shift();
    words.forEach((word) => {
      const test = `${line} ${word}`;
      if (context.measureText(test).width <= maxWidth) line = test;
      else {
        lines.push(line);
        line = word;
      }
    });
    lines.push(line);
  });
  return lines.slice(0, 120);
};

const exportResultImage = (format) => {
  const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  const extension = format === 'jpg' ? 'jpg' : format;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  measure.font = '28px Arial';
  const lines = wrapCanvasLines(measure, resultText(), 1240);
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = Math.max(720, 250 + lines.length * 40);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#0f1114';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#45c7df';
  context.font = '700 20px Arial';
  context.fillText('MIASERVICIOS', 80, 80);
  context.fillStyle = '#f4f6f8';
  context.font = '700 42px Arial';
  context.fillText(executedOperation.value?.label || 'Resultado', 80, 145);
  context.fillStyle = '#9da6b1';
  context.font = '22px Arial';
  context.fillText(`Generado el ${new Date().toLocaleString('es-PE')}`, 80, 190);
  context.fillStyle = '#171a1f';
  context.fillRect(60, 220, 1280, canvas.height - 280);
  context.fillStyle = '#edf1f5';
  context.font = '28px Arial';
  lines.forEach((line, index) => context.fillText(line, 90, 280 + index * 40));
  canvas.toBlob((blob) => {
    if (!blob) {
      push('No fue posible generar la imagen.', 'danger');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `miaservicios-${executedType.value}-${Date.now()}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    push(`Resultado guardado en ${extension.toUpperCase()}.`, 'success');
  }, mime, 0.92);
};

const printResult = () => {
  const popup = window.open('', '_blank');
  if (!popup) {
    push('El navegador bloqueó la ventana de impresión.', 'danger');
    return;
  }
  popup.opener = null;
  const safe = resultText().replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MiaServicios</title><style>body{font-family:Arial,sans-serif;margin:48px;color:#15191e}h1{margin-bottom:8px}p{white-space:pre-wrap;line-height:1.6;border-top:1px solid #ddd;padding-top:24px}</style></head><body><h1>MiaServicios</h1><strong>${executedOperation.value?.label || 'Resultado'}</strong><p>${safe}</p></body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
};

const saveFavorite = async () => {
  const operationId = response.value?.operationId;
  if (!operationId || response.value?.historySaved === false) {
    push('Este resultado no está disponible en el historial.', 'danger');
    return;
  }
  try {
    await platformApi.setHistoryFavorite(operationId, true);
    favoriteSaved.value = true;
    push('Resultado agregado a favoritos.', 'success');
  } catch (exception) {
    push(exception.message, 'danger');
  }
};

const handleShortcut = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    submit();
  }
};

watch([text, selected, sentences, keywordLimit, casing], () => {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveDraft, 700);
});

onMounted(() => {
  const temporaryDraft = sessionStorage.getItem('mia_lab_draft');
  if (temporaryDraft) {
    try {
      const parsed = JSON.parse(temporaryDraft);
      text.value = parsed.text || '';
      selected.value = parsed.operation || 'summarize';
    } finally {
      sessionStorage.removeItem('mia_lab_draft');
    }
  } else {
    restoreDraft();
  }
  window.addEventListener('keydown', handleShortcut);
});

onBeforeUnmount(() => {
  window.clearTimeout(saveTimer);
  window.removeEventListener('keydown', handleShortcut);
});
</script>

<template>
  <AppShell>
    <div class="workspace" :class="{ 'workspace-focus': focusMode }">
      <div class="section-heading section-heading-row">
        <div>
          <h2>Espacio de trabajo</h2>
          <p>Agregue su contenido, seleccione una tarea y revise el resultado sin perder el avance.</p>
        </div>
        <button type="button" class="btn btn-outline-light" @click="focusMode = !focusMode">
          <i :class="focusMode ? 'fa-solid fa-compress' : 'fa-solid fa-expand'" class="mr-2"></i>{{ focusMode ? 'Salir del enfoque' : 'Modo enfoque' }}
        </button>
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

          <div class="workspace-toolbar">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="pasteContent"><i class="fa-regular fa-clipboard mr-2"></i>Pegar</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="fileInput.click()"><i class="fa-solid fa-file-arrow-up mr-2"></i>Importar TXT</button>
            <input ref="fileInput" type="file" accept=".txt,text/plain" class="d-none" @change="importText">
            <span class="draft-status"><i class="fa-solid fa-cloud-arrow-up mr-2"></i>{{ draftStatus }}</span>
          </div>

          <div class="example-row">
            <span>Ejemplos:</span>
            <button v-for="example in examples" :key="example.label" type="button" class="btn btn-sm btn-outline-secondary" @click="loadExample(example.text)">{{ example.label }}</button>
          </div>

          <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

          <div class="form-group">
            <label for="text-input">Contenido</label>
            <div class="text-drop-zone" :class="{ 'is-dragging': dragActive }" @dragenter.prevent="dragActive = true" @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="dropText">
              <textarea id="text-input" v-model="text" class="form-control text-editor" rows="13" maxlength="20000" placeholder="Escriba, pegue, arrastre o importe el contenido que desea revisar"></textarea>
              <div v-if="dragActive" class="text-drop-overlay"><i class="fa-solid fa-file-arrow-down"></i><strong>Suelte el archivo TXT</strong></div>
            </div>
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

          <div class="workspace-submit-row">
            <button type="button" class="btn btn-primary" :disabled="loading || !validText" @click="submit">
              <i :class="loading ? 'fa-solid fa-circle-notch fa-spin' : selectedOperation.icon" class="mr-2"></i>
              {{ loading ? 'Procesando' : 'Obtener resultado' }}
            </button>
            <span>Atajo: Ctrl + Enter</span>
          </div>
        </section>

        <section class="panel-card result-panel">
          <div class="panel-title result-panel-title">
            <div>
              <h2>Resultado</h2>
              <div v-if="response" class="panel-subtitle">Listo para revisar, comparar, guardar o descargar.</div>
            </div>
            <div v-if="response" class="result-actions">
              <button v-if="canCompare" type="button" class="btn btn-outline-light btn-sm" :class="{ active: comparisonMode }" @click="comparisonMode = !comparisonMode"><i class="fa-solid fa-code-compare mr-2"></i>Comparar</button>
              <button type="button" class="btn btn-outline-light btn-sm" :disabled="favoriteSaved" @click="saveFavorite"><i :class="favoriteSaved ? 'fa-solid fa-star' : 'fa-regular fa-star'" class="mr-2"></i>{{ favoriteSaved ? 'Favorito' : 'Guardar' }}</button>
              <button type="button" class="btn btn-outline-light btn-sm" @click="copyResult"><i class="fa-regular fa-copy mr-2"></i>{{ copied ? 'Copiado' : 'Copiar' }}</button>
              <button type="button" class="btn btn-outline-light btn-sm" @click="printResult"><i class="fa-solid fa-print mr-2"></i>Imprimir</button>
            </div>
          </div>

          <div v-if="loading" class="result-placeholder"><div><i class="fa-solid fa-circle-notch fa-spin"></i>Procesando el contenido</div></div>
          <div v-else-if="!response" class="result-placeholder"><div><i class="fa-solid fa-file-lines"></i>El resultado aparecerá en este panel.</div></div>

          <template v-else>
            <div v-if="comparisonMode && canCompare" class="comparison-grid">
              <article><span>Contenido original</span><div class="result-box result-box-pre">{{ executedInput }}</div></article>
              <article><span>Resultado</span><div class="result-box result-box-pre">{{ resultText() }}</div></article>
            </div>
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
                <div><span>Categoría</span><strong>{{ response.result.category.replace('_', ' ') }}</strong></div>
                <div><span>Confianza</span><strong>{{ Math.round(response.result.confidence * 100) }}%</strong></div>
              </div>

              <div v-else-if="executedType === 'statistics'" class="result-metric result-metric-wide">
                <div><span>Caracteres</span><strong>{{ response.result.characters }}</strong></div>
                <div><span>Palabras</span><strong>{{ response.result.words }}</strong></div>
                <div><span>Palabras únicas</span><strong>{{ response.result.uniqueWords }}</strong></div>
                <div><span>Oraciones</span><strong>{{ response.result.sentences }}</strong></div>
                <div><span>Párrafos</span><strong>{{ response.result.paragraphs }}</strong></div>
                <div><span>Densidad léxica</span><strong>{{ response.result.lexicalDensity }}</strong></div>
                <div><span>Promedio por palabra</span><strong>{{ response.result.averageWordLength }}</strong></div>
                <div><span>Lectura estimada</span><strong>{{ response.result.estimatedReadingMinutes }} min</strong></div>
              </div>

              <div v-else-if="executedType === 'normalize'" class="result-box result-box-pre">{{ response.result.text }}</div>
            </template>

            <div class="result-export-bar">
              <span>Descargar resultado</span>
              <div class="btn-group">
                <button type="button" class="btn btn-outline-light btn-sm" @click="exportResult('txt')">TXT</button>
                <button type="button" class="btn btn-outline-light btn-sm" @click="exportResult('json')">JSON</button>
                <button type="button" class="btn btn-outline-light btn-sm" @click="exportResultImage('png')">PNG</button>
                <button type="button" class="btn btn-outline-light btn-sm" @click="exportResultImage('jpg')">JPG</button>
                <button type="button" class="btn btn-outline-light btn-sm" @click="exportResultImage('webp')">WEBP</button>
              </div>
            </div>

            <div class="result-footer">
              <span>Resultado generado por MiaServicios</span>
              <span>Tiempo: {{ response.processingMs }} ms</span>
            </div>
          </template>
        </section>
      </div>
    </div>
  </AppShell>
</template>
