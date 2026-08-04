<!-- Presenta la experiencia de uso y permite guardar una guía visual. -->
<script setup>
import { onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { useNotifier } from '../composables/useNotifier.js';

const STORAGE_KEY = 'mia_experience_image';
const LEGACY_STORAGE_KEY = 'mia_architecture_image_v25';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const { push } = useNotifier();
const imageInput = ref(null);
const customImage = ref(null);
const dragActive = ref(false);
const imageProcessing = ref(false);

const journey = [
  {
    title: 'Elige una herramienta',
    icon: 'fa-solid fa-wand-magic-sparkles',
    description: 'Selecciona resumen, sentimiento, palabras clave, clasificación, estadísticas o limpieza de texto.'
  },
  {
    title: 'Añade tu contenido',
    icon: 'fa-solid fa-pen-to-square',
    description: 'Escribe, pega o reutiliza una plantilla sin salir de la misma pantalla.'
  },
  {
    title: 'Ajusta lo necesario',
    icon: 'fa-solid fa-sliders',
    description: 'Configura únicamente las opciones relacionadas con la tarea elegida.'
  },
  {
    title: 'Revisa el resultado',
    icon: 'fa-solid fa-magnifying-glass-chart',
    description: 'Obtén una respuesta ordenada, legible y lista para copiar o descargar.'
  },
  {
    title: 'Guarda y continúa',
    icon: 'fa-solid fa-bookmark',
    description: 'Consulta el historial, reutiliza contenido y conserva tus avances para otra sesión.'
  }
];

const experienceAreas = [
  {
    title: 'Inicio claro',
    icon: 'fa-solid fa-house',
    description: 'El panel muestra actividad, accesos directos y el estado general sin saturar la pantalla.',
    features: ['Vista resumida', 'Acciones principales', 'Actividad reciente']
  },
  {
    title: 'Área de trabajo enfocada',
    icon: 'fa-solid fa-pen-ruler',
    description: 'La entrada y el resultado permanecen visibles para reducir pasos y evitar distracciones.',
    features: ['Editor amplio', 'Contadores útiles', 'Opciones contextuales']
  },
  {
    title: 'Resultados comprensibles',
    icon: 'fa-solid fa-file-circle-check',
    description: 'Cada respuesta se presenta según su tipo, con acciones directas para copiar o exportar.',
    features: ['Lectura rápida', 'Datos ordenados', 'Exportación']
  },
  {
    title: 'Historial práctico',
    icon: 'fa-solid fa-clock-rotate-left',
    description: 'Las tareas anteriores pueden buscarse, filtrarse, ordenarse y eliminarse de forma sencilla.',
    features: ['Búsqueda', 'Filtros', 'Control personal']
  },
  {
    title: 'Plantillas reutilizables',
    icon: 'fa-solid fa-layer-group',
    description: 'Los textos frecuentes se conservan para iniciar una tarea con menos escritura repetitiva.',
    features: ['Contenido guardado', 'Categorías', 'Uso inmediato']
  },
  {
    title: 'Cuenta bajo control',
    icon: 'fa-solid fa-user-shield',
    description: 'El usuario administra su perfil, seguridad, respaldos e información del sistema desde un solo lugar.',
    features: ['Perfil', 'Seguridad', 'Respaldo']
  }
];

const principles = [
  { title: 'Claridad', icon: 'fa-solid fa-eye', text: 'La información importante se distingue por jerarquía, contraste y espacios consistentes.' },
  { title: 'Rapidez', icon: 'fa-solid fa-bolt', text: 'Las acciones frecuentes requieren pocos pasos y mantienen botones visibles en el momento correcto.' },
  { title: 'Continuidad', icon: 'fa-solid fa-arrow-rotate-right', text: 'El historial y las plantillas permiten retomar el trabajo sin comenzar desde cero.' },
  { title: 'Confianza', icon: 'fa-solid fa-shield-halved', text: 'Los mensajes confirman cada acción y avisan antes de eliminar información importante.' }
];

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildExperienceSvg = () => {
  const nodes = [
    { x: 90, title: 'Elegir', subtitle: 'Una herramienta', icon: '01' },
    { x: 390, title: 'Añadir', subtitle: 'El contenido', icon: '02' },
    { x: 690, title: 'Ajustar', subtitle: 'Las opciones', icon: '03' },
    { x: 990, title: 'Revisar', subtitle: 'El resultado', icon: '04' },
    { x: 1290, title: 'Guardar', subtitle: 'Y continuar', icon: '05' }
  ];

  const nodeMarkup = nodes.map((node, index) => `
    <g transform="translate(${node.x} 330)">
      <rect width="220" height="170" rx="24" fill="#171a1f" stroke="#3a444f" stroke-width="2"/>
      <circle cx="42" cy="42" r="22" fill="#123640"/>
      <text x="42" y="49" text-anchor="middle" fill="#45c7df" font-size="18" font-weight="700">${node.icon}</text>
      <text x="28" y="105" fill="#f4f6f8" font-size="25" font-weight="700">${node.title}</text>
      <text x="28" y="139" fill="#9da6b1" font-size="17">${node.subtitle}</text>
    </g>
    ${index < nodes.length - 1 ? `<path d="M ${node.x + 230} 415 H ${nodes[index + 1].x - 10}" stroke="#28b9d2" stroke-width="4" stroke-linecap="round"/><path d="M ${nodes[index + 1].x - 24} 403 L ${nodes[index + 1].x - 10} 415 L ${nodes[index + 1].x - 24} 427" fill="none" stroke="#28b9d2" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
    <rect width="1600" height="900" fill="#0f1114"/>
    <circle cx="1450" cy="120" r="260" fill="#123640" opacity="0.35"/>
    <circle cx="120" cy="820" r="280" fill="#18242b" opacity="0.65"/>
    <text x="90" y="125" fill="#45c7df" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4">MIASERVICIOS</text>
    <text x="90" y="195" fill="#f4f6f8" font-family="Arial, sans-serif" font-size="52" font-weight="700">Recorrido de usuario</text>
    <text x="90" y="245" fill="#9da6b1" font-family="Arial, sans-serif" font-size="23">Una experiencia simple desde la elección de una tarea hasta el guardado del resultado.</text>
    ${nodeMarkup}
    <rect x="90" y="620" width="1420" height="125" rx="24" fill="#171a1f" stroke="#303740" stroke-width="2"/>
    <text x="125" y="672" fill="#f4f6f8" font-family="Arial, sans-serif" font-size="24" font-weight="700">Principios de experiencia</text>
    <text x="125" y="715" fill="#9da6b1" font-family="Arial, sans-serif" font-size="20">Claridad · Rapidez · Continuidad · Confianza · Diseño adaptable</text>
    <text x="90" y="835" fill="#6f7b86" font-family="Arial, sans-serif" font-size="17">Generado desde MiaServicios · ${new Date().toLocaleDateString('es-PE')}</text>
  </svg>`;
};

const exportSvg = () => {
  downloadBlob(new Blob([buildExperienceSvg()], { type: 'image/svg+xml;charset=utf-8' }), 'miaservicios-recorrido-usuario.svg');
  push('Guía visual exportada en formato SVG.', 'success');
};

const exportPng = () => {
  const svgUrl = URL.createObjectURL(new Blob([buildExperienceSvg()], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext('2d');
    if (!context) {
      URL.revokeObjectURL(svgUrl);
      push('El navegador no permite generar la imagen PNG.', 'danger');
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(svgUrl);
      if (!blob) {
        push('No fue posible generar la imagen PNG.', 'danger');
        return;
      }
      downloadBlob(blob, 'miaservicios-recorrido-usuario.png');
      push('Guía visual exportada en formato PNG.', 'success');
    }, 'image/png');
  };

  image.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    push('No fue posible preparar la guía visual.', 'danger');
  };

  image.src = svgUrl;
};

const selectImage = () => imageInput.value?.click();

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('No fue posible leer la imagen seleccionada.'));
  reader.readAsDataURL(file);
});

const rasterToOptimizedImage = (file) => new Promise((resolve, reject) => {
  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('El navegador no permite procesar la imagen.'));
      return;
    }
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob(async (blob) => {
      URL.revokeObjectURL(sourceUrl);
      if (!blob) {
        reject(new Error('No fue posible optimizar la imagen.'));
        return;
      }
      const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.webp';
      resolve({
        name: optimizedName,
        originalName: file.name,
        type: 'image/webp',
        size: blob.size,
        width,
        height,
        dataUrl: await fileToDataUrl(blob),
        updatedAt: new Date().toISOString()
      });
    }, 'image/webp', 0.86);
  };
  image.onerror = () => {
    URL.revokeObjectURL(sourceUrl);
    reject(new Error('La imagen no pudo abrirse.'));
  };
  image.src = sourceUrl;
});

const prepareImage = async (file) => {
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Use una imagen PNG, JPG, WEBP o SVG.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen no debe superar los 5 MB.');

  if (file.type === 'image/svg+xml') {
    return {
      name: file.name,
      originalName: file.name,
      type: file.type,
      size: file.size,
      width: null,
      height: null,
      dataUrl: await fileToDataUrl(file),
      updatedAt: new Date().toISOString()
    };
  }

  return rasterToOptimizedImage(file);
};

const savePreparedImage = async (file) => {
  imageProcessing.value = true;
  try {
    const image = await prepareImage(file);
    if (!image) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(image));
    customImage.value = image;
    push('Guía visual optimizada y guardada.', 'success');
  } catch (error) {
    push(error.message || 'No fue posible guardar la imagen.', 'danger');
  } finally {
    imageProcessing.value = false;
  }
};

const onImageSelected = async (event) => {
  const [file] = event.target.files || [];
  event.target.value = '';
  await savePreparedImage(file);
};

const dropImage = async (event) => {
  dragActive.value = false;
  await savePreparedImage(event.dataTransfer?.files?.[0]);
};

const removeImage = () => {
  customImage.value = null;
  localStorage.removeItem(STORAGE_KEY);
  push('Guía visual eliminada.', 'info');
};

const downloadImage = () => {
  if (!customImage.value) return;
  const link = document.createElement('a');
  link.href = customImage.value.dataUrl;
  link.download = customImage.value.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const exportCustomImage = (format) => {
  if (!customImage.value) return;
  if (customImage.value.type === 'image/svg+xml' && format === 'svg') {
    downloadImage();
    return;
  }
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (format === 'jpg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);
    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    canvas.toBlob((blob) => {
      if (!blob) {
        push('No fue posible convertir la imagen.', 'danger');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `miaservicios-guia-${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      push(`Imagen exportada en ${format.toUpperCase()}.`, 'success');
    }, mime, 0.92);
  };
  image.onerror = () => push('No fue posible convertir la imagen.', 'danger');
  image.src = customImage.value.dataUrl;
};

onMounted(() => {
  try {
    const savedImage = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    if (savedImage?.dataUrl) {
      customImage.value = savedImage;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedImage));
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
});
</script>

<template>
  <AppShell>
    <div class="section-heading section-heading-row architecture-heading">
      <div>
        <h2>Experiencia de uso</h2>
        <p>Conozca el recorrido dentro de MiaServicios y la forma en que cada pantalla ayuda a completar una tarea con claridad.</p>
      </div>
      <div class="architecture-export-actions">
        <button type="button" class="btn btn-outline-light" @click="exportSvg">
          <i class="fa-solid fa-file-arrow-down mr-2"></i>Exportar guía
        </button>
        <button type="button" class="btn btn-primary" @click="exportPng">
          <i class="fa-solid fa-image mr-2"></i>Guardar como imagen
        </button>
      </div>
    </div>

    <div class="architecture-mode-card experience-intro mb-4">
      <div class="architecture-mode-icon"><i class="fa-solid fa-compass"></i></div>
      <div>
        <span>Diseñado para el usuario</span>
        <strong>Una experiencia clara de principio a fin</strong>
        <p>Las funciones principales están organizadas para encontrar, procesar, revisar y conservar información sin pasos innecesarios.</p>
      </div>
    </div>

    <section class="panel-card architecture-overview mb-4">
      <div class="panel-title architecture-panel-title">
        <div>
          <h2>Recorrido principal</h2>
          <p class="panel-subtitle">Cinco momentos simples para completar una tarea dentro de MiaServicios.</p>
        </div>
        <span class="architecture-badge"><i class="fa-solid fa-route mr-2"></i>Guía paso a paso</span>
      </div>

      <div class="user-journey">
        <template v-for="(step, index) in journey" :key="step.title">
          <article class="journey-step">
            <div class="journey-index">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="journey-icon"><i :class="step.icon"></i></div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
          <div v-if="index < journey.length - 1" class="journey-connector" aria-hidden="true">
            <i class="fa-solid fa-arrow-right-long"></i>
          </div>
        </template>
      </div>
    </section>

    <section class="architecture-grid mb-4">
      <article v-for="area in experienceAreas" :key="area.title" class="architecture-card">
        <div class="architecture-card-header">
          <div class="architecture-icon"><i :class="area.icon"></i></div>
          <span class="architecture-status"><span></span>Disponible</span>
        </div>
        <h3>{{ area.title }}</h3>
        <p>{{ area.description }}</p>
        <div class="tech-list">
          <span v-for="feature in area.features" :key="feature">{{ feature }}</span>
        </div>
      </article>
    </section>

    <section class="architecture-benefits mb-4">
      <article v-for="principle in principles" :key="principle.title" class="benefit-card">
        <i :class="principle.icon"></i>
        <div>
          <h3>{{ principle.title }}</h3>
          <p>{{ principle.text }}</p>
        </div>
      </article>
    </section>

    <section class="panel-card architecture-image-panel" :class="{ 'is-dragging': dragActive }" @dragenter.prevent="dragActive = true" @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="dropImage">
      <div class="panel-title architecture-panel-title">
        <div>
          <h2>Guía visual personalizada</h2>
          <p class="panel-subtitle">Agregue una imagen que represente el recorrido, una pantalla de referencia o una guía de uso. Se admiten PNG, JPG, WEBP y SVG hasta 5 MB. Las imágenes grandes se optimizan automáticamente.</p>
        </div>
        <div class="architecture-image-actions">
          <button type="button" class="btn btn-outline-light btn-sm" :disabled="imageProcessing" @click="selectImage">
            <i :class="imageProcessing ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-upload'" class="mr-2"></i>{{ imageProcessing ? 'Procesando' : customImage ? 'Reemplazar imagen' : 'Agregar imagen' }}
          </button>
          <input ref="imageInput" type="file" class="d-none" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="onImageSelected">
        </div>
      </div>

      <div v-if="customImage" class="architecture-image-preview">
        <img :src="customImage.dataUrl" :alt="`Guía visual ${customImage.name}`">
        <div class="architecture-image-meta">
          <div>
            <strong>{{ customImage.name }}</strong>
            <span>{{ formatBytes(customImage.size) }}<template v-if="customImage.width"> · {{ customImage.width }} × {{ customImage.height }} px</template> · Guardada en este navegador</span>
          </div>
          <div class="architecture-image-downloads">
            <div class="btn-group">
              <button type="button" class="btn btn-outline-light btn-sm" @click="exportCustomImage('png')">PNG</button>
              <button type="button" class="btn btn-outline-light btn-sm" @click="exportCustomImage('jpg')">JPG</button>
              <button type="button" class="btn btn-outline-light btn-sm" @click="exportCustomImage('webp')">WEBP</button>
            </div>
            <button type="button" class="btn btn-outline-light btn-sm" @click="downloadImage" aria-label="Descargar archivo original"><i class="fa-solid fa-download"></i></button>
            <button type="button" class="btn btn-outline-danger btn-sm" @click="removeImage" aria-label="Eliminar imagen"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>

      <button v-else type="button" class="architecture-image-empty" :disabled="imageProcessing" @click="selectImage">
        <span class="architecture-upload-icon"><i :class="imageProcessing ? 'fa-solid fa-circle-notch fa-spin' : 'fa-regular fa-image'"></i></span>
        <strong>{{ dragActive ? 'Suelte la imagen aquí' : imageProcessing ? 'Optimizando imagen' : 'Agregar o arrastrar una guía visual' }}</strong>
        <span>La imagen se ajusta para ocupar menos espacio y se guarda únicamente en este navegador.</span>
      </button>
    </section>
  </AppShell>
</template>
