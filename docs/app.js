// Ejecuta la version estatica funcional de MiaServicios.
const { computed, createApp, onMounted, reactive, ref, watch } = Vue;

const storageKeys = {
  users: 'mia_static_users_v2',
  session: 'mia_static_session_v2',
  history: 'mia_static_history_v2',
  templates: 'mia_static_templates_v2',
  architectureImage: 'mia_experience_image',
  draft: 'mia_workspace_draft',
  preferences: 'mia_user_preferences'
};

const readStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const defaultPreferences = { density: 'comfortable', contrast: 'standard', motion: 'full' };
const applyPreferences = (value = readStorage(storageKeys.preferences, defaultPreferences)) => {
  const preferences = { ...defaultPreferences, ...value };
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.dataset.contrast = preferences.contrast;
  document.documentElement.dataset.motion = preferences.motion;
  return preferences;
};
applyPreferences();
const bytesToHex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const randomSalt = () => bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
const hashPassword = async (password, salt) => {
  const value = new TextEncoder().encode(`${salt}:${password}`);
  return crypto.subtle ? bytesToHex(await crypto.subtle.digest('SHA-256', value)) : bytesToHex(value);
};

const ensureDemoUser = async () => {
  const users = readStorage(storageKeys.users, []);
  if (users.some((user) => user.email === 'demo@mia.local')) return users;
  const salt = randomSalt();
  const user = {
    id: 'demo-user',
    name: 'Usuario Demo',
    email: 'demo@mia.local',
    passwordHash: await hashPassword('demo12345', salt),
    salt,
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };
  const updated = [user, ...users];
  writeStorage(storageKeys.users, updated);
  return updated;
};

const publicUser = ({ passwordHash, salt, ...user }) => user;
const stopWords = new Set([
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con', 'contra', 'cual', 'cuando',
  'de', 'del', 'desde', 'donde', 'dos', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'es',
  'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba', 'estado', 'estas', 'este', 'esto', 'estos',
  'fue', 'ha', 'hacia', 'han', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'mas', 'me',
  'mi', 'mis', 'mucho', 'muy', 'no', 'nos', 'o', 'otra', 'otro', 'para', 'pero', 'por', 'porque',
  'que', 'se', 'sin', 'sobre', 'su', 'sus', 'tambien', 'te', 'tiene', 'todo', 'un', 'una', 'uno',
  'unos', 'y', 'ya'
]);
const positiveWords = new Set([
  'acierto', 'avance', 'beneficio', 'bien', 'calidad', 'claro', 'confiable', 'correcto', 'crecimiento',
  'eficiente', 'estable', 'excelente', 'exito', 'favorable', 'feliz', 'ganancia', 'mejora', 'mejor',
  'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor', 'optimizado', 'disponible'
]);
const negativeWords = new Set([
  'alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento',
  'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'roto', 'vulnerable', 'incidente',
  'queja', 'deficiente', 'costoso', 'bloqueo', 'inestable', 'grave', 'indisponible', 'degradado'
]);
const categoryRules = {
  tecnologia: ['api', 'aplicacion', 'codigo', 'datos', 'digital', 'microservicio', 'nube', 'software', 'sistema', 'tecnologia', 'servidor', 'frontend', 'backend'],
  finanzas: ['banco', 'costo', 'credito', 'dinero', 'factura', 'finanzas', 'ganancia', 'inversion', 'pago', 'presupuesto', 'contable', 'ingreso'],
  operaciones: ['calidad', 'cliente', 'entrega', 'inventario', 'logistica', 'operacion', 'proceso', 'produccion', 'servicio', 'transporte', 'almacen', 'distribucion'],
  seguridad: ['acceso', 'amenaza', 'auditoria', 'cifrado', 'incidente', 'riesgo', 'seguridad', 'vulnerabilidad', 'token', 'fraude', 'autenticacion', 'permiso'],
  recursos_humanos: ['capacitacion', 'colaborador', 'desempeno', 'empleado', 'equipo', 'liderazgo', 'persona', 'personal', 'talento', 'trabajador', 'seleccion', 'contratacion']
};

const normalizeForAnalysis = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const wordsFrom = (text) => normalizeForAnalysis(text).match(/[a-z0-9]+/g) || [];
const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));
const sentencesFrom = (text) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const paragraphsFrom = (text) => text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
const frequencyMap = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());

const summarizeText = (text, sentenceLimit) => {
  const sentences = sentencesFrom(text);
  if (sentences.length <= sentenceLimit) return text.trim();
  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalized = new Map([...frequencies.entries()].map(([word, count]) => [word, count / maximum]));
  return sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const density = words.reduce((sum, word) => sum + (normalized.get(word) || 0), 0);
    const positionBoost = index === 0 ? 0.25 : index === sentences.length - 1 ? 0.1 : 0;
    return { sentence, index, score: density / Math.max(words.length, 1) + positionBoost };
  }).sort((left, right) => right.score - left.score)
    .slice(0, sentenceLimit)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(' ');
};

const analyzeSentiment = (text) => {
  const words = wordsFrom(text);
  let score = 0;
  let positive = 0;
  let negative = 0;
  words.forEach((word, index) => {
    const multiplier = ['no', 'nunca', 'jamas'].includes(words[index - 1]) ? -1 : 1;
    if (positiveWords.has(word)) {
      score += multiplier;
      multiplier > 0 ? positive += 1 : negative += 1;
    }
    if (negativeWords.has(word)) {
      score -= multiplier;
      multiplier > 0 ? negative += 1 : positive += 1;
    }
  });
  const matches = positive + negative;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;
  return {
    label: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral',
    score: normalizedScore,
    positiveMatches: positive,
    negativeMatches: negative
  };
};

const extractKeywords = (text, limit) => ({
  keywords: [...frequencyMap(relevantWords(text)).entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
});

const classifyText = (text) => {
  const words = wordsFrom(text);
  const scores = Object.entries(categoryRules).map(([category, terms]) => ({
    category,
    score: terms.reduce((sum, term) => sum + words.filter((word) => word === term).length, 0)
  })).sort((left, right) => right.score - left.score);
  const winner = scores[0];
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return winner?.score ? {
    category: winner.category,
    confidence: Number(Math.min(0.98, 0.45 + winner.score / Math.max(total, 1) * 0.5).toFixed(2)),
    scores
  } : { category: 'general', confidence: 0.25, scores };
};

const analyzeStatistics = (text) => {
  const words = wordsFrom(text);
  const relevant = relevantWords(text);
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  return {
    characters: text.length,
    charactersWithoutSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    uniqueWords: new Set(relevant).size,
    sentences: sentencesFrom(text).length,
    paragraphs: paragraphsFrom(text).length,
    averageWordLength: words.length ? Number((totalWordLength / words.length).toFixed(2)) : 0,
    lexicalDensity: words.length ? Number((relevant.length / words.length).toFixed(2)) : 0,
    estimatedReadingMinutes: Number(Math.max(words.length / 200, 0.01).toFixed(2))
  };
};

const normalizeText = (text, casing) => {
  let normalized = text.replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n').replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[A-Za-z0-9])/g, '$1 ').trim();
  if (casing === 'lower') normalized = normalized.toLowerCase();
  if (casing === 'upper') normalized = normalized.toUpperCase();
  return {
    text: normalized,
    originalCharacters: text.length,
    normalizedCharacters: normalized.length,
    removedCharacters: Math.max(text.length - normalized.length, 0)
  };
};

const operationLabels = {
  summarize: 'Resumen',
  sentiment: 'Sentimiento',
  keywords: 'Palabras clave',
  classify: 'Clasificacion',
  statistics: 'Estadisticas',
  normalize: 'Normalizacion'
};

const defaultTemplates = [
  {
    id: 'default-service',
    title: 'Informe de servicio',
    category: 'Servicio',
    builtIn: true,
    text: 'El servicio registro una mejora sostenida en el tiempo de atencion y en la resolucion de solicitudes durante el primer contacto. Los usuarios destacaron la claridad de las respuestas y la facilidad para realizar seguimiento. Se recomienda mantener la revision semanal de casos pendientes y reforzar la comunicacion preventiva.'
  },
  {
    id: 'default-operations',
    title: 'Reporte de operaciones',
    category: 'Operaciones',
    builtIn: true,
    text: 'El proceso de distribucion registro una mejora en el tiempo de entrega y una reduccion de errores de inventario. La coordinacion entre almacen, transporte y servicio al cliente permitio mantener la calidad. Se recomienda continuar con el monitoreo de tiempos, incidencias y nivel de cumplimiento.'
  },
  {
    id: 'default-security',
    title: 'Incidente de seguridad',
    category: 'Seguridad',
    builtIn: true,
    text: 'El equipo detecto intentos de acceso no autorizado sobre una cuenta de pruebas. La autenticacion fue bloqueada y los tokens activos fueron revocados. No se identifico perdida de datos, pero se establecio una revision de permisos, registros de auditoria y reglas de acceso.'
  }
];

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : 'Sin actividad';
const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(Number(value || 0));
const resultToText = (item) => {
  const result = item.result || {};
  if (item.type === 'summarize') return result.summary || '';
  if (item.type === 'sentiment') return `${result.label || 'neutral'} (${result.score ?? 0})`;
  if (item.type === 'keywords') return (result.keywords || []).map((entry) => `${entry.word} (${entry.count})`).join(', ');
  if (item.type === 'classify') return `${String(result.category || 'general').replace('_', ' ')} (${Math.round((result.confidence || 0) * 100)}%)`;
  if (item.type === 'statistics') return `${result.words || 0} palabras, ${result.sentences || 0} oraciones, ${result.paragraphs || 0} parrafos`;
  if (item.type === 'normalize') return result.text || '';
  return JSON.stringify(result);
};
const downloadFile = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

createApp({
  setup() {
    const session = ref(readStorage(storageKeys.session, null));
    const initialPage = location.hash.replace('#', '');
    const page = ref(initialPage === 'architecture' ? 'experience' : initialPage || 'dashboard');
    const sidebarOpen = ref(false);
    const loginMode = ref('login');
    const authForm = reactive({ name: '', email: 'demo@mia.local', password: 'demo12345' });
    const authError = ref('');
    const authLoading = ref(false);
    const savedDraft = readStorage(storageKeys.draft, null);
    const selected = ref(savedDraft?.operation || 'summarize');
    const executedType = ref('');
    const text = ref(savedDraft?.text || 'Durante el ultimo mes se redujo el tiempo de respuesta a los clientes y aumento el porcentaje de consultas resueltas en el primer contacto. Las solicitudes mas frecuentes estuvieron relacionadas con entregas, cambios y actualizacion de datos. El equipo recomienda reforzar las respuestas preventivas y revisar los casos que superaron el tiempo esperado para mantener una experiencia clara y consistente.');
    const sentences = ref(Number(savedDraft?.sentences || 3));
    const keywordLimit = ref(Number(savedDraft?.keywordLimit || 8));
    const casing = ref(savedDraft?.casing || 'preserve');
    const result = ref(null);
    const processingMs = ref(0);
    const labError = ref('');
    const history = ref(readStorage(storageKeys.history, []));
    const historySearch = ref('');
    const historyType = ref('all');
    const historySort = ref('newest');
    const historyPage = ref(1);
    const historyPageSize = ref(10);
    const templates = ref([...defaultTemplates, ...readStorage(storageKeys.templates, [])]);
    const templateSearch = ref('');
    const showTemplateForm = ref(false);
    const templateForm = reactive({ title: '', category: 'General', text: '' });
    const profileName = ref(session.value?.user?.name || '');
    const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmation: '' });
    const notice = ref({ message: '', type: 'info' });
    const importInput = ref(null);
    const textFileInput = ref(null);
    const imageInput = ref(null);
    const customImage = ref(readStorage(storageKeys.architectureImage, null));
    const focusMode = ref(false);
    const draftSavedAt = ref(savedDraft?.savedAt || '');
    const visual = reactive(applyPreferences());
    const openHelp = ref('first-task');

    const architectureJourney = [
      { title: 'Elige una herramienta', icon: 'fa-solid fa-wand-magic-sparkles', description: 'Selecciona resumen, sentimiento, palabras clave, clasificacion, estadisticas o limpieza de texto.' },
      { title: 'Anade tu contenido', icon: 'fa-solid fa-pen-to-square', description: 'Escribe, pega o reutiliza una plantilla sin salir de la misma pantalla.' },
      { title: 'Ajusta lo necesario', icon: 'fa-solid fa-sliders', description: 'Configura unicamente las opciones relacionadas con la tarea elegida.' },
      { title: 'Revisa el resultado', icon: 'fa-solid fa-magnifying-glass-chart', description: 'Obtiene una respuesta ordenada, legible y lista para copiar o descargar.' },
      { title: 'Guarda y continua', icon: 'fa-solid fa-bookmark', description: 'Consulta el historial, reutiliza contenido y conserva tus avances para otra sesion.' }
    ];

    const architectureComponents = [
      { title: 'Inicio claro', icon: 'fa-solid fa-house', description: 'El panel muestra actividad, accesos directos y el estado general sin saturar la pantalla.', technologies: ['Vista resumida', 'Acciones principales', 'Actividad reciente'] },
      { title: 'Area de trabajo enfocada', icon: 'fa-solid fa-pen-ruler', description: 'La entrada y el resultado permanecen visibles para reducir pasos y evitar distracciones.', technologies: ['Editor amplio', 'Contadores utiles', 'Opciones contextuales'] },
      { title: 'Resultados comprensibles', icon: 'fa-solid fa-file-circle-check', description: 'Cada respuesta se presenta segun su tipo, con acciones directas para copiar o exportar.', technologies: ['Lectura rapida', 'Datos ordenados', 'Exportacion'] },
      { title: 'Historial practico', icon: 'fa-solid fa-clock-rotate-left', description: 'Las tareas anteriores pueden buscarse, filtrarse, ordenarse y eliminarse de forma sencilla.', technologies: ['Busqueda', 'Filtros', 'Control personal'] },
      { title: 'Plantillas reutilizables', icon: 'fa-solid fa-layer-group', description: 'Los textos frecuentes se conservan para iniciar una tarea con menos escritura repetitiva.', technologies: ['Contenido guardado', 'Categorias', 'Uso inmediato'] },
      { title: 'Cuenta bajo control', icon: 'fa-solid fa-user-shield', description: 'El usuario administra su perfil, seguridad, respaldos e informacion del sistema desde un solo lugar.', technologies: ['Perfil', 'Seguridad', 'Respaldo'] }
    ];

    const architectureBenefits = [
      { title: 'Claridad', icon: 'fa-solid fa-eye', text: 'La informacion importante se distingue por jerarquia, contraste y espacios consistentes.' },
      { title: 'Rapidez', icon: 'fa-solid fa-bolt', text: 'Las acciones frecuentes requieren pocos pasos y mantienen botones visibles en el momento correcto.' },
      { title: 'Continuidad', icon: 'fa-solid fa-arrow-rotate-right', text: 'El historial y las plantillas permiten retomar el trabajo sin comenzar desde cero.' },
      { title: 'Confianza', icon: 'fa-solid fa-shield-halved', text: 'Los mensajes confirman cada accion y avisan antes de eliminar informacion importante.' }
    ];

    const systemVersions = [
      { name: 'MiaServicios', version: '3.0.0', purpose: 'Version estable de la plataforma' },
      { name: 'Vue', version: '3.5.13', purpose: 'Interfaz y componentes visuales' },
      { name: 'Bootstrap', version: '4.6.2', purpose: 'Diseno adaptable y estructura visual' },
      { name: 'Font Awesome', version: '6.7.2', purpose: 'Iconos de la interfaz' },
      { name: 'Vue Router', version: '4.5.1', purpose: 'Navegacion entre vistas' },
      { name: 'Pinia', version: '3.0.2', purpose: 'Estado de sesion y datos compartidos' },
      { name: 'Node.js', version: '20.18 o superior', purpose: 'Ejecucion de los servicios locales' },
      { name: 'Express', version: '5.1.0', purpose: 'Servicios y comunicacion interna' },
      { name: 'SQLite', version: '11.10.0', purpose: 'Almacenamiento local de cuentas e historial' }
    ];

    const operations = [
      { id: 'summarize', label: 'Resumen', icon: 'fa-solid fa-align-left', description: 'Reduce el contenido conservando las ideas principales.' },
      { id: 'sentiment', label: 'Sentimiento', icon: 'fa-solid fa-scale-balanced', description: 'Estima la orientacion positiva, neutral o negativa.' },
      { id: 'keywords', label: 'Palabras clave', icon: 'fa-solid fa-tags', description: 'Obtiene los terminos con mayor frecuencia relevante.' },
      { id: 'classify', label: 'Clasificacion', icon: 'fa-solid fa-folder-tree', description: 'Asigna una categoria tematica y nivel de confianza.' },
      { id: 'statistics', label: 'Estadisticas', icon: 'fa-solid fa-chart-simple', description: 'Calcula lectura, densidad y estructura del contenido.' },
      { id: 'normalize', label: 'Normalizacion', icon: 'fa-solid fa-broom', description: 'Corrige espacios, saltos y signos de puntuacion.' }
    ];
    const helpGuides = [
      { id: 'first-task', icon: 'fa-solid fa-play', title: 'Realizar la primera tarea', steps: ['Abra Espacio de trabajo.', 'Elija la tarea que desea realizar.', 'Escriba, pegue o importe el contenido.', 'Revise el resultado y guardelo o descarguelo.'] },
      { id: 'resume-work', icon: 'fa-solid fa-arrow-rotate-right', title: 'Continuar un trabajo pendiente', steps: ['El borrador se guarda mientras escribe.', 'Regrese al Espacio de trabajo desde cualquier vista.', 'El contenido y la tarea seleccionada se recuperaran automaticamente.'] },
      { id: 'reuse-result', icon: 'fa-solid fa-clock-rotate-left', title: 'Reutilizar un resultado', steps: ['Abra Historial.', 'Busque por contenido o filtre por tipo de tarea.', 'Use una plantilla o copie el resultado para continuar.'] },
      { id: 'backup', icon: 'fa-solid fa-box-archive', title: 'Crear un respaldo', steps: ['Abra Configuracion.', 'Ubique Respaldo de datos.', 'Exporte el archivo y guardelo en una ubicacion segura.'] }
    ];
    const helpQuestions = [
      { question: '¿Mi trabajo se pierde al cerrar la pagina?', answer: 'El borrador activo se guarda automaticamente en el navegador. Los resultados completados quedan disponibles en el Historial.' },
      { question: '¿Puedo usar un archivo de texto?', answer: 'Si. En Espacio de trabajo puede importar archivos TXT de hasta 1 MB.' },
      { question: '¿Donde cambio la vista de la interfaz?', answer: 'En Configuracion puede elegir una vista comoda o compacta, ademas de ajustar contraste y movimiento.' },
      { question: '¿Como traslado mi informacion a otro equipo?', answer: 'Exporte un respaldo desde Configuracion e importelo en el otro navegador.' }
    ];
    const pageTitle = computed(() => ({
      dashboard: 'Panel general',
      lab: 'Espacio de trabajo',
      history: 'Historial',
      templates: 'Plantillas',
      settings: 'Configuracion',
      experience: 'Experiencia',
      help: 'Ayuda'
    })[page.value] || 'Panel general');
    const userHistory = computed(() => history.value.filter((item) => item.userId === session.value?.user?.id));
    const totalCharacters = computed(() => userHistory.value.reduce((sum, item) => sum + Number(item.inputLength || 0), 0));
    const averageMs = computed(() => userHistory.value.length
      ? Number((userHistory.value.reduce((sum, item) => sum + item.processingMs, 0) / userHistory.value.length).toFixed(2))
      : 0);
    const primaryOperation = computed(() => {
      const counts = userHistory.value.reduce((map, item) => map.set(item.type, (map.get(item.type) || 0) + 1), new Map());
      const first = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
      return first ? operationLabels[first[0]] : 'Sin datos';
    });
    const dailyActivity = computed(() => {
      const map = userHistory.value.reduce((current, item) => {
        const key = item.createdAt.slice(0, 10);
        current.set(key, (current.get(key) || 0) + 1);
        return current;
      }, new Map());
      const values = [];
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() - offset);
        const key = date.toISOString().slice(0, 10);
        values.push({ date: key, total: map.get(key) || 0 });
      }
      return values;
    });
    const maxDaily = computed(() => Math.max(...dailyActivity.value.map((item) => item.total), 1));
    const firstName = computed(() => session.value?.user?.name?.split(' ')[0] || 'Usuario');
    const todayMessage = computed(() => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Buenos dias';
      if (hour < 19) return 'Buenas tardes';
      return 'Buenas noches';
    });
    const draftWords = computed(() => savedDraft?.text?.trim() ? savedDraft.text.trim().split(/\s+/).length : (text.value.trim() ? text.value.trim().split(/\s+/).length : 0));
    const draftStatus = computed(() => draftSavedAt.value ? `Borrador guardado a las ${new Date(draftSavedAt.value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'El borrador se guarda automaticamente');
    const textMetrics = computed(() => {
      const value = text.value.trim();
      const words = value ? value.split(/\s+/).length : 0;
      return {
        characters: text.value.length,
        words,
        sentences: value ? sentencesFrom(value).length : 0,
        reading: Math.max(words / 200, 0).toFixed(2)
      };
    });
    const filteredHistory = computed(() => {
      const term = historySearch.value.trim().toLowerCase();
      let items = userHistory.value.filter((item) => {
        const matchesType = historyType.value === 'all' || item.type === historyType.value;
        const matchesSearch = !term || item.inputPreview.toLowerCase().includes(term);
        return matchesType && matchesSearch;
      });
      items = [...items].sort((left, right) => historySort.value === 'oldest'
        ? new Date(left.createdAt) - new Date(right.createdAt)
        : new Date(right.createdAt) - new Date(left.createdAt));
      return items;
    });
    const historyPageCount = computed(() => Math.max(1, Math.ceil(filteredHistory.value.length / historyPageSize.value)));
    const pagedHistory = computed(() => filteredHistory.value.slice(
      (historyPage.value - 1) * historyPageSize.value,
      historyPage.value * historyPageSize.value
    ));
    const filteredTemplates = computed(() => {
      const term = templateSearch.value.trim().toLowerCase();
      return templates.value.filter((item) => !term || `${item.title} ${item.category} ${item.text}`.toLowerCase().includes(term));
    });

    const notify = (message, type = 'info') => {
      notice.value = { message, type };
      window.setTimeout(() => {
        if (notice.value.message === message) notice.value = { message: '', type: 'info' };
      }, 3200);
    };

    const authenticate = async () => {
      authLoading.value = true;
      authError.value = '';
      try {
        const users = await ensureDemoUser();
        const email = authForm.email.trim().toLowerCase();
        if (loginMode.value === 'register') {
          if (authForm.name.trim().length < 2 || authForm.password.length < 8) throw new Error('Complete los datos requeridos.');
          if (users.some((user) => user.email === email)) throw new Error('El correo ya se encuentra registrado.');
          const salt = randomSalt();
          const now = new Date().toISOString();
          const user = {
            id: crypto.randomUUID(),
            name: authForm.name.trim(),
            email,
            passwordHash: await hashPassword(authForm.password, salt),
            salt,
            role: 'user',
            createdAt: now,
            updatedAt: now
          };
          writeStorage(storageKeys.users, [...users, user]);
          session.value = { token: `static-${user.id}`, user: publicUser(user) };
        } else {
          const user = users.find((item) => item.email === email);
          const valid = user && await hashPassword(authForm.password, user.salt) === user.passwordHash;
          if (!valid) throw new Error('Correo o contrasena incorrectos.');
          session.value = { token: `static-${user.id}`, user: publicUser(user) };
        }
        writeStorage(storageKeys.session, session.value);
        profileName.value = session.value.user.name;
        page.value = 'dashboard';
      } catch (error) {
        authError.value = error.message;
      } finally {
        authLoading.value = false;
      }
    };

    const logout = () => {
      localStorage.removeItem(storageKeys.session);
      session.value = null;
      page.value = 'dashboard';
    };

    const goTo = (target) => {
      page.value = target;
      location.hash = target;
      sidebarOpen.value = false;
    };

    const execute = () => {
      labError.value = '';
      result.value = null;
      if (text.value.trim().length < 20 || text.value.length > 20000) {
        labError.value = 'Ingrese un texto de 20 a 20000 caracteres.';
        return;
      }
      const started = performance.now();
      const operation = selected.value === 'summarize' ? (() => {
        const summary = summarizeText(text.value, sentences.value);
        return {
          summary,
          originalCharacters: text.value.length,
          summaryCharacters: summary.length,
          reductionPercent: Number(Math.max(0, (1 - summary.length / text.value.length) * 100).toFixed(1))
        };
      })() : selected.value === 'sentiment' ? analyzeSentiment(text.value)
        : selected.value === 'keywords' ? extractKeywords(text.value, keywordLimit.value)
          : selected.value === 'classify' ? classifyText(text.value)
            : selected.value === 'statistics' ? analyzeStatistics(text.value)
              : normalizeText(text.value, casing.value);
      processingMs.value = Number((performance.now() - started).toFixed(2));
      result.value = operation;
      executedType.value = selected.value;
      const entry = {
        id: crypto.randomUUID(),
        userId: session.value.user.id,
        type: selected.value,
        inputPreview: text.value.replace(/\s+/g, ' ').slice(0, 240),
        inputLength: text.value.length,
        result: operation,
        processingMs: processingMs.value,
        createdAt: new Date().toISOString()
      };
      history.value = [entry, ...history.value];
      writeStorage(storageKeys.history, history.value);
      saveDraft();
      notify('La tarea fue completada y guardada en el historial.', 'success');
    };

    const saveDraft = () => {
      const savedAt = new Date().toISOString();
      writeStorage(storageKeys.draft, { text: text.value, operation: selected.value, sentences: sentences.value, keywordLimit: keywordLimit.value, casing: casing.value, savedAt });
      draftSavedAt.value = savedAt;
    };

    const clearLab = () => {
      text.value = '';
      result.value = null;
      labError.value = '';
      executedType.value = '';
      draftSavedAt.value = '';
      localStorage.removeItem(storageKeys.draft);
    };

    const importText = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.size > 1024 * 1024) return notify('El archivo supera el limite de 1 MB.', 'danger');
      if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') return notify('Seleccione un archivo TXT.', 'danger');
      text.value = (await file.text()).slice(0, 20000);
      result.value = null;
      notify('Contenido importado.', 'success');
    };

    const pasteContent = async () => {
      try {
        const value = await navigator.clipboard.readText();
        if (!value.trim()) throw new Error();
        text.value = value.slice(0, 20000);
        result.value = null;
        notify('Contenido pegado desde el portapapeles.', 'success');
      } catch {
        notify('No fue posible leer el portapapeles. Pegue el contenido manualmente.', 'danger');
      }
    };

    const copyResult = async () => {
      const value = resultToText({ type: executedType.value, result: result.value });
      await navigator.clipboard.writeText(value);
      notify('Resultado copiado al portapapeles.', 'success');
    };

    const exportResult = (format) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'json') {
        downloadFile(`mia-${executedType.value}-${timestamp}.json`, JSON.stringify({ operation: executedType.value, input: text.value, result: result.value, processingMs: processingMs.value }, null, 2), 'application/json;charset=utf-8');
      } else {
        downloadFile(`mia-${executedType.value}-${timestamp}.txt`, resultToText({ type: executedType.value, result: result.value }));
      }
    };

    const removeHistory = (id) => {
      if (!window.confirm('Se eliminara este registro del historial.')) return;
      history.value = history.value.filter((item) => item.id !== id);
      writeStorage(storageKeys.history, history.value);
      notify('Registro eliminado.', 'success');
    };

    const clearHistory = () => {
      if (!userHistory.value.length || !window.confirm('Se eliminara todo el historial del usuario.')) return;
      history.value = history.value.filter((item) => item.userId !== session.value.user.id);
      writeStorage(storageKeys.history, history.value);
      historyPage.value = 1;
      notify('Historial eliminado.', 'success');
    };

    const exportHistory = (format) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'json') {
        downloadFile(`miaservicios-historial-${timestamp}.json`, JSON.stringify(filteredHistory.value, null, 2), 'application/json;charset=utf-8');
        return;
      }
      const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const rows = [
        ['Herramienta', 'Contenido', 'Resultado', 'TiempoMs', 'Fecha'],
        ...filteredHistory.value.map((item) => [operationLabels[item.type], item.inputPreview, resultToText(item), item.processingMs, item.createdAt])
      ];
      downloadFile(`miaservicios-historial-${timestamp}.csv`, rows.map((row) => row.map(escape).join(',')).join('\n'), 'text/csv;charset=utf-8');
    };

    const createTemplate = () => {
      if (templateForm.title.trim().length < 3 || templateForm.text.trim().length < 20) {
        notify('Complete un titulo y un texto de al menos 20 caracteres.', 'danger');
        return;
      }
      const item = {
        id: crypto.randomUUID(),
        title: templateForm.title.trim(),
        category: templateForm.category.trim() || 'General',
        text: templateForm.text.trim(),
        builtIn: false,
        createdAt: new Date().toISOString()
      };
      const custom = [item, ...templates.value.filter((current) => !current.builtIn)];
      templates.value = [...defaultTemplates, ...custom];
      writeStorage(storageKeys.templates, custom);
      templateForm.title = '';
      templateForm.category = 'General';
      templateForm.text = '';
      showTemplateForm.value = false;
      notify('Plantilla guardada.', 'success');
    };

    const removeTemplate = (item) => {
      if (item.builtIn || !window.confirm('Se eliminara esta plantilla personalizada.')) return;
      const custom = templates.value.filter((current) => !current.builtIn && current.id !== item.id);
      templates.value = [...defaultTemplates, ...custom];
      writeStorage(storageKeys.templates, custom);
      notify('Plantilla eliminada.', 'success');
    };

    const useTemplate = (item) => {
      text.value = item.text;
      selected.value = 'summarize';
      result.value = null;
      goTo('lab');
    };

    const copyTemplate = async (item) => {
      await navigator.clipboard.writeText(item.text);
      notify('Texto copiado al portapapeles.', 'success');
    };

    const saveProfile = async () => {
      if (profileName.value.trim().length < 2) {
        notify('El nombre debe contener al menos dos caracteres.', 'danger');
        return;
      }
      const users = await ensureDemoUser();
      const now = new Date().toISOString();
      let updatedUser;
      const updated = users.map((user) => {
        if (user.id !== session.value.user.id) return user;
        updatedUser = { ...user, name: profileName.value.trim(), updatedAt: now };
        return updatedUser;
      });
      writeStorage(storageKeys.users, updated);
      session.value = { ...session.value, user: publicUser(updatedUser) };
      writeStorage(storageKeys.session, session.value);
      notify('Perfil actualizado.', 'success');
    };

    const changePassword = async () => {
      if (passwordForm.newPassword.length < 8 || passwordForm.newPassword !== passwordForm.confirmation) {
        notify('La nueva contrasena debe tener ocho caracteres y coincidir con la confirmacion.', 'danger');
        return;
      }
      const users = await ensureDemoUser();
      const user = users.find((item) => item.id === session.value.user.id);
      const valid = user && await hashPassword(passwordForm.currentPassword, user.salt) === user.passwordHash;
      if (!valid) {
        notify('La contrasena actual no es correcta.', 'danger');
        return;
      }
      const salt = randomSalt();
      const passwordHash = await hashPassword(passwordForm.newPassword, salt);
      writeStorage(storageKeys.users, users.map((item) => item.id === user.id ? {
        ...item,
        salt,
        passwordHash,
        updatedAt: new Date().toISOString()
      } : item));
      passwordForm.currentPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmation = '';
      notify('Contrasena actualizada.', 'success');
    };

    const exportBackup = () => {
      const backup = {
        version: 3,
        exportedAt: new Date().toISOString(),
        user: session.value.user,
        history: userHistory.value,
        templates: templates.value.filter((item) => !item.builtIn),
        preferences: visual
      };
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(`miaservicios-respaldo-${timestamp}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
      notify('Respaldo generado.', 'success');
    };

    const importBackup = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text());
        if (!Array.isArray(payload.history)) throw new Error('El respaldo no es valido.');
        const currentOtherUsers = history.value.filter((item) => item.userId !== session.value.user.id);
        const importedHistory = payload.history.filter((item) => item?.type && item?.result).map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          userId: session.value.user.id,
          createdAt: item.createdAt || new Date().toISOString()
        }));
        history.value = [...importedHistory, ...currentOtherUsers];
        writeStorage(storageKeys.history, history.value);
        if (Array.isArray(payload.templates)) {
          const custom = payload.templates.filter((item) => item?.title && item?.text).map((item) => ({ ...item, id: item.id || crypto.randomUUID(), builtIn: false }));
          templates.value = [...defaultTemplates, ...custom];
          writeStorage(storageKeys.templates, custom);
        }
        if (payload.preferences) {
          Object.assign(visual, applyPreferences(payload.preferences));
          writeStorage(storageKeys.preferences, visual);
        }
        notify(`${importedHistory.length} registros importados.`, 'success');
      } catch (error) {
        notify(error.message || 'El respaldo no es valido.', 'danger');
      } finally {
        event.target.value = '';
      }
    };

    const saveAppearance = () => {
      writeStorage(storageKeys.preferences, visual);
      applyPreferences(visual);
      notify('Preferencias visuales aplicadas.', 'success');
    };

    const formatBytes = (bytes) => !bytes ? '0 KB' : `${(bytes / 1024).toFixed(bytes >= 1024 * 1024 ? 0 : 1)} KB`;

    const buildArchitectureSvg = () => {
      const nodes = [
        { x: 90, title: 'Elegir', subtitle: 'Una herramienta', icon: '01' },
        { x: 390, title: 'Anadir', subtitle: 'El contenido', icon: '02' },
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
        <text x="90" y="245" fill="#9da6b1" font-family="Arial, sans-serif" font-size="23">Una experiencia simple desde la eleccion de una tarea hasta el guardado del resultado.</text>
        ${nodeMarkup}
        <rect x="90" y="620" width="1420" height="125" rx="24" fill="#171a1f" stroke="#303740" stroke-width="2"/>
        <text x="125" y="672" fill="#f4f6f8" font-family="Arial, sans-serif" font-size="24" font-weight="700">Principios de experiencia</text>
        <text x="125" y="715" fill="#9da6b1" font-family="Arial, sans-serif" font-size="20">Claridad · Rapidez · Continuidad · Confianza · Diseno adaptable</text>
        <text x="90" y="835" fill="#6f7b86" font-family="Arial, sans-serif" font-size="17">Generado desde MiaServicios · ${new Date().toLocaleDateString('es-PE')}</text>
      </svg>`;
    };

    const exportArchitectureSvg = () => {
      downloadFile('miaservicios-recorrido-usuario.svg', buildArchitectureSvg(), 'image/svg+xml;charset=utf-8');
      notify('Guia visual exportada en formato SVG.', 'success');
    };

    const exportArchitecturePng = () => {
      const svgUrl = URL.createObjectURL(new Blob([buildArchitectureSvg()], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 900;
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(svgUrl);
          notify('El navegador no permite generar la imagen PNG.', 'danger');
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(svgUrl);
          if (!blob) return notify('No fue posible generar la imagen PNG.', 'danger');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'miaservicios-recorrido-usuario.png';
          link.click();
          URL.revokeObjectURL(url);
          notify('Guia visual exportada en formato PNG.', 'success');
        }, 'image/png');
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        notify('No fue posible preparar la guia visual.', 'danger');
      };
      image.src = svgUrl;
    };

    const selectArchitectureImage = () => imageInput.value?.click();

    const onArchitectureImageSelected = (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        notify('Use una imagen PNG, JPG, WEBP o SVG.', 'danger');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        notify('La imagen no debe superar los 2 MB.', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = { name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result), updatedAt: new Date().toISOString() };
        try {
          writeStorage(storageKeys.architectureImage, imageData);
          customImage.value = imageData;
          notify('Guia visual agregada correctamente.', 'success');
        } catch {
          notify('No hay espacio suficiente para guardar la imagen.', 'danger');
        }
      };
      reader.onerror = () => notify('No fue posible leer la imagen seleccionada.', 'danger');
      reader.readAsDataURL(file);
    };

    const removeArchitectureImage = () => {
      customImage.value = null;
      localStorage.removeItem(storageKeys.architectureImage);
      notify('Guia visual eliminada.', 'info');
    };

    const downloadArchitectureImage = () => {
      if (!customImage.value) return;
      const link = document.createElement('a');
      link.href = customImage.value.dataUrl;
      link.download = customImage.value.name;
      link.click();
    };

    const dayLabel = (date) => new Intl.DateTimeFormat('es-PE', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
    const barHeight = (total) => `${Math.max(8, Math.round(total / maxDaily.value * 100))}%`;

    watch([historySearch, historyType, historySort, historyPageSize], () => {
      historyPage.value = 1;
    });
    watch([text, selected, sentences, keywordLimit, casing], () => {
      window.clearTimeout(window.miaDraftTimer);
      window.miaDraftTimer = window.setTimeout(saveDraft, 700);
    });
    watch(historyPageCount, (value) => {
      if (historyPage.value > value) historyPage.value = value;
    });
    watch(page, (value) => {
      document.title = `${pageTitle.value} | MiaServicios`;
      if (location.hash.replace('#', '') !== value) location.hash = value;
    });

    onMounted(() => {
      ensureDemoUser();
      window.addEventListener('hashchange', () => {
        const target = location.hash.replace('#', '');
        if (target) page.value = target === 'architecture' ? 'experience' : target;
      });
    });

    return {
      session,
      page,
      pageTitle,
      sidebarOpen,
      loginMode,
      authForm,
      authError,
      authLoading,
      authenticate,
      logout,
      goTo,
      operations,
      operationLabels,
      selected,
      executedType,
      text,
      sentences,
      keywordLimit,
      casing,
      result,
      processingMs,
      labError,
      textMetrics,
      draftWords,
      draftStatus,
      firstName,
      todayMessage,
      focusMode,
      textFileInput,
      execute,
      clearLab,
      importText,
      pasteContent,
      copyResult,
      exportResult,
      userHistory,
      totalCharacters,
      averageMs,
      primaryOperation,
      dailyActivity,
      maxDaily,
      dayLabel,
      barHeight,
      formatDate,
      formatNumber,
      resultToText,
      historySearch,
      historyType,
      historySort,
      historyPage,
      historyPageSize,
      historyPageCount,
      pagedHistory,
      filteredHistory,
      removeHistory,
      clearHistory,
      exportHistory,
      templates,
      templateSearch,
      filteredTemplates,
      showTemplateForm,
      templateForm,
      createTemplate,
      removeTemplate,
      useTemplate,
      copyTemplate,
      profileName,
      passwordForm,
      saveProfile,
      changePassword,
      exportBackup,
      importBackup,
      importInput,
      visual,
      saveAppearance,
      notice,
      helpGuides,
      helpQuestions,
      openHelp,
      architectureJourney,
      architectureComponents,
      architectureBenefits,
      systemVersions,
      customImage,
      imageInput,
      formatBytes,
      exportArchitectureSvg,
      exportArchitecturePng,
      selectArchitectureImage,
      onArchitectureImageSelected,
      removeArchitectureImage,
      downloadArchitectureImage
    };
  },
  template: `
    <div v-if="notice.message" class="toast-stack">
      <div class="app-toast" :class="'is-' + notice.type">
        <i :class="notice.type === 'success' ? 'fa-solid fa-circle-check' : notice.type === 'danger' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info'"></i>
        <span>{{ notice.message }}</span>
        <button type="button" @click="notice.message = ''"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>

    <div v-if="!session" class="auth-page">
      <section class="auth-visual">
        <img src="./brand/miaservicios-cover.png" alt="Identidad visual de MiaServicios">
        <div class="auth-copy">
          <h1>MiaServicios</h1>
          <p>Organice, analice y reutilice contenido desde una experiencia clara, segura y adaptable a cualquier pantalla.</p>
          <div class="auth-feature-list">
            <span><i class="fa-solid fa-wand-magic-sparkles"></i>Herramientas de texto</span>
            <span><i class="fa-solid fa-clock-rotate-left"></i>Historial personal</span>
            <span><i class="fa-solid fa-mobile-screen-button"></i>Diseño adaptable</span>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
            <div>
              <h2>{{ loginMode === 'login' ? 'Acceso a MiaServicios' : 'Crear una cuenta' }}</h2>
              <p>Ingrese para continuar con sus tareas y resultados guardados.</p>
            </div>
          </div>

          <div class="auth-tabs">
            <button type="button" class="auth-tab" :class="{ 'is-active': loginMode === 'login' }" @click="loginMode = 'login'; authError = ''">Iniciar sesión</button>
            <button type="button" class="auth-tab" :class="{ 'is-active': loginMode === 'register' }" @click="loginMode = 'register'; authError = ''">Registrarse</button>
          </div>

          <div v-if="authError" class="alert alert-danger-custom">{{ authError }}</div>

          <form @submit.prevent="authenticate">
            <div v-if="loginMode === 'register'" class="form-group">
              <label for="static-name">Nombre completo</label>
              <input id="static-name" v-model.trim="authForm.name" type="text" class="form-control" minlength="2" maxlength="80" required>
            </div>
            <div class="form-group">
              <label for="static-email">Correo electrónico</label>
              <input id="static-email" v-model.trim="authForm.email" type="email" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="static-password">Contraseña</label>
              <input id="static-password" v-model="authForm.password" type="password" class="form-control" minlength="8" maxlength="72" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block" :disabled="authLoading">
              <i :class="authLoading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-arrow-right-to-bracket'" class="mr-2"></i>
              {{ authLoading ? 'Procesando' : loginMode === 'login' ? 'Ingresar' : 'Registrar cuenta' }}
            </button>
          </form>

          <div v-if="loginMode === 'login'" class="demo-credentials">
            <strong>Acceso inicial</strong><br>
            Correo: demo@mia.local<br>
            Contraseña: demo12345
          </div>
        </div>
      </section>
    </div>

    <div v-else class="app-frame">
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>
      <aside class="app-sidebar" :class="{ 'is-open': sidebarOpen }">
        <div class="brand-block">
          <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
          <div><div class="brand-title">MiaServicios</div><div class="brand-subtitle">Asistente de contenido</div></div>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'dashboard' }" @click="goTo('dashboard')"><i class="fa-solid fa-chart-line"></i><span>Panel general</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'lab' }" @click="goTo('lab')"><i class="fa-solid fa-pen-to-square"></i><span>Espacio de trabajo</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'history' }" @click="goTo('history')"><i class="fa-solid fa-clock-rotate-left"></i><span>Historial</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'templates' }" @click="goTo('templates')"><i class="fa-solid fa-layer-group"></i><span>Plantillas</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'settings' }" @click="goTo('settings')"><i class="fa-solid fa-sliders"></i><span>Configuración</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'experience' }" @click="goTo('experience')"><i class="fa-solid fa-compass"></i><span>Experiencia</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'help' }" @click="goTo('help')"><i class="fa-solid fa-circle-question"></i><span>Ayuda</span></button>
        </nav>
        <div class="sidebar-footer">
          <div class="mode-indicator"><span class="status-dot"></span>Sistema disponible</div>
          <button class="btn btn-outline-light btn-sm btn-block" @click="logout"><i class="fa-solid fa-right-from-bracket mr-2"></i>Cerrar sesión</button>
        </div>
      </aside>

      <section class="app-content">
        <header class="topbar">
          <button type="button" class="btn sidebar-toggle" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
          <div class="topbar-heading"><div class="page-eyebrow">MiaServicios</div><h1>{{ pageTitle }}</h1></div>
          <button type="button" class="user-chip border-0 bg-transparent text-left" @click="goTo('settings')">
            <div class="user-avatar">{{ session.user.name.charAt(0).toUpperCase() }}</div>
            <div class="user-data d-none d-sm-block"><strong>{{ session.user.name }}</strong><span>{{ session.user.role }}</span></div>
          </button>
        </header>

        <main class="page-container">
          <template v-if="page === 'dashboard'">
            <section class="welcome-panel">
              <div><span class="welcome-kicker">{{ todayMessage }}, {{ firstName }}</span><h2>¿Qué desea trabajar hoy?</h2><p>Continúe un borrador, inicie una tarea o recupere un resultado anterior desde el mismo panel.</p></div>
              <button class="btn btn-primary btn-lg" @click="goTo('lab')"><i class="fa-solid fa-plus mr-2"></i>Comenzar una tarea</button>
            </section>

            <section v-if="text.trim()" class="draft-banner">
              <div class="draft-banner-icon"><i class="fa-solid fa-file-pen"></i></div>
              <div class="draft-banner-copy"><span>Borrador disponible</span><strong>{{ draftWords }} palabras listas para continuar</strong><p>{{ text.slice(0, 150) }}{{ text.length > 150 ? '…' : '' }}</p></div>
              <button class="btn btn-outline-light" @click="goTo('lab')">Continuar borrador</button>
            </section>

            <section class="quick-action-grid">
              <button class="quick-action-card text-left" @click="goTo('lab')"><span class="quick-action-icon"><i class="fa-solid fa-pen-to-square"></i></span><span><strong>Nueva tarea</strong><small>Analice o prepare contenido.</small></span><i class="fa-solid fa-arrow-right"></i></button>
              <button class="quick-action-card text-left" @click="goTo('history')"><span class="quick-action-icon"><i class="fa-solid fa-clock-rotate-left"></i></span><span><strong>Revisar historial</strong><small>Encuentre resultados anteriores.</small></span><i class="fa-solid fa-arrow-right"></i></button>
              <button class="quick-action-card text-left" @click="goTo('templates')"><span class="quick-action-icon"><i class="fa-solid fa-layer-group"></i></span><span><strong>Usar plantilla</strong><small>Empiece con contenido preparado.</small></span><i class="fa-solid fa-arrow-right"></i></button>
              <button class="quick-action-card text-left" @click="goTo('help')"><span class="quick-action-icon"><i class="fa-solid fa-circle-question"></i></span><span><strong>Consultar ayuda</strong><small>Revise guías y respuestas.</small></span><i class="fa-solid fa-arrow-right"></i></button>
            </section>

            <section class="metric-grid">
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-list-check"></i></div><div><div class="metric-label">Tareas realizadas</div><div class="metric-value">{{ formatNumber(userHistory.length) }}</div><div class="metric-detail">Resultados guardados</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-file-lines"></i></div><div><div class="metric-label">Contenido revisado</div><div class="metric-value">{{ formatNumber(totalCharacters) }}</div><div class="metric-detail">Caracteres procesados</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-stopwatch"></i></div><div><div class="metric-label">Respuesta promedio</div><div class="metric-value">{{ averageMs }} ms</div><div class="metric-detail">Tiempo habitual de espera</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-star"></i></div><div><div class="metric-label">Herramienta frecuente</div><div class="metric-value">{{ primaryOperation }}</div><div class="metric-detail">La más utilizada</div></div></article>
            </section>

            <section class="dashboard-grid dashboard-grid-wide">
              <article class="panel-card">
                <div class="panel-title"><div><h2>Actividad de los últimos siete días</h2><div class="panel-subtitle">Tareas guardadas por día</div></div></div>
                <div class="activity-chart"><div v-for="item in dailyActivity" :key="item.date" class="activity-column"><div class="activity-value">{{ item.total }}</div><div class="activity-track"><div class="activity-bar" :style="{ height: barHeight(item.total) }"></div></div><div class="activity-label">{{ dayLabel(item.date) }}</div></div></div>
              </article>
              <aside class="panel-card readiness-card">
                <div class="panel-title"><h3>Disponibilidad</h3></div>
                <div class="readiness-ring" style="--readiness: 360deg"><div><strong>3/3</strong><span>funciones listas</span></div></div>
                <p>MiaServicios está listo para continuar con su trabajo.</p>
                <button class="btn btn-outline-light btn-sm" @click="goTo('settings')">Revisar configuración</button>
              </aside>
            </section>

            <section class="panel-card mt-4">
              <div class="panel-title"><div><h2>Resultados recientes</h2><div class="panel-subtitle">Acceda rápidamente a las últimas tareas guardadas.</div></div><button class="btn btn-outline-light btn-sm" @click="goTo('history')">Ver todo</button></div>
              <div v-if="userHistory.length" class="recent-result-grid"><article v-for="item in userHistory.slice(0, 6)" :key="item.id" class="recent-result-card"><div class="recent-result-top"><span class="badge-operation">{{ operationLabels[item.type] }}</span><small>{{ formatDate(item.createdAt) }}</small></div><p>{{ item.inputPreview }}</p><div><span>{{ item.inputLength }} caracteres</span><span>{{ item.processingMs }} ms</span></div></article></div>
              <div v-else class="empty-state"><div class="empty-icon"><i class="fa-solid fa-chart-column"></i></div><h3>Todavía no hay actividad</h3><p>Comience una tarea para guardar su primer resultado.</p><button class="btn btn-primary btn-sm" @click="goTo('lab')">Abrir espacio de trabajo</button></div>
            </section>
          </template>

          <template v-if="page === 'lab'">
            <div class="workspace" :class="{ 'workspace-focus': focusMode }">
              <div class="section-heading section-heading-row"><div><h2>Espacio de trabajo</h2><p>Agregue su contenido, seleccione una tarea y revise el resultado sin perder el avance.</p></div><button class="btn btn-outline-light" @click="focusMode = !focusMode"><i :class="focusMode ? 'fa-solid fa-compress' : 'fa-solid fa-expand'" class="mr-2"></i>{{ focusMode ? 'Salir del enfoque' : 'Modo enfoque' }}</button></div>
              <section class="operation-grid"><button v-for="operation in operations" :key="operation.id" class="operation-card" :class="{ 'is-active': selected === operation.id }" @click="selected = operation.id; result = null"><i :class="operation.icon"></i><strong>{{ operation.label }}</strong><span>{{ operation.description }}</span></button></section>

              <div class="lab-grid">
                <section class="panel-card">
                  <div class="panel-title"><div><h2>{{ operationLabels[selected] }}</h2><div class="panel-subtitle">Complete el contenido y ajuste solo las opciones necesarias.</div></div><button class="btn btn-outline-light btn-sm" @click="clearLab"><i class="fa-solid fa-eraser mr-2"></i>Limpiar</button></div>
                  <div class="workspace-toolbar"><button class="btn btn-sm btn-outline-secondary" @click="pasteContent"><i class="fa-regular fa-clipboard mr-2"></i>Pegar</button><button class="btn btn-sm btn-outline-secondary" @click="$refs.textFileInput.click()"><i class="fa-solid fa-file-arrow-up mr-2"></i>Importar TXT</button><input ref="textFileInput" type="file" accept=".txt,text/plain" class="d-none" @change="importText"><span class="draft-status"><i class="fa-solid fa-cloud-arrow-up mr-2"></i>{{ draftStatus }}</span></div>
                  <div v-if="labError" class="alert alert-danger-custom">{{ labError }}</div>
                  <div class="form-group"><label for="static-text">Contenido</label><textarea id="static-text" v-model="text" class="form-control text-editor" rows="13" maxlength="20000" placeholder="Escriba, pegue o importe el contenido que desea revisar"></textarea><div class="editor-metrics"><span>{{ textMetrics.characters }} caracteres</span><span>{{ textMetrics.words }} palabras</span><span>{{ textMetrics.sentences }} oraciones</span><span>{{ textMetrics.reading }} min de lectura</span></div></div>
                  <div v-if="selected === 'summarize'" class="form-group"><label>Cantidad de oraciones</label><select v-model.number="sentences" class="custom-select"><option v-for="value in 10" :key="value" :value="value">{{ value }}</option></select></div>
                  <div v-if="selected === 'keywords'" class="form-group"><label>Cantidad de términos</label><select v-model.number="keywordLimit" class="custom-select"><option v-for="value in [5,8,10,12,15,20,25]" :key="value" :value="value">{{ value }}</option></select></div>
                  <div v-if="selected === 'normalize'" class="form-group"><label>Tratamiento de mayúsculas</label><select v-model="casing" class="custom-select"><option value="preserve">Conservar formato</option><option value="lower">Convertir a minúsculas</option><option value="upper">Convertir a mayúsculas</option></select></div>
                  <div class="workspace-submit-row"><button class="btn btn-primary" :disabled="text.trim().length < 20" @click="execute"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Obtener resultado</button><span>El borrador se guarda automáticamente</span></div>
                </section>

                <section class="panel-card result-panel">
                  <div class="panel-title"><div><h2>Resultado</h2><div v-if="result" class="panel-subtitle">Listo para revisar, copiar o descargar.</div></div><div v-if="result" class="btn-group"><button class="btn btn-outline-light btn-sm" @click="copyResult"><i class="fa-regular fa-copy mr-2"></i>Copiar</button><button class="btn btn-outline-light btn-sm" @click="exportResult('txt')">TXT</button><button class="btn btn-outline-light btn-sm" @click="exportResult('json')">JSON</button></div></div>
                  <div v-if="!result" class="result-placeholder"><div><i class="fa-solid fa-file-lines"></i>El resultado aparecerá en este panel.</div></div>
                  <div v-else-if="executedType === 'summarize'" class="result-box">{{ result.summary }}</div>
                  <div v-else-if="executedType === 'sentiment'" class="result-metric"><div><span>Resultado</span><strong>{{ result.label }}</strong></div><div><span>Puntaje</span><strong>{{ result.score }}</strong></div><div><span>Positivas</span><strong>{{ result.positiveMatches }}</strong></div><div><span>Negativas</span><strong>{{ result.negativeMatches }}</strong></div></div>
                  <div v-else-if="executedType === 'keywords'" class="keyword-list"><span v-for="keyword in result.keywords" :key="keyword.word" class="keyword-chip">{{ keyword.word }} <strong>{{ keyword.count }}</strong></span></div>
                  <div v-else-if="executedType === 'classify'" class="result-metric"><div><span>Categoría</span><strong>{{ result.category.replace('_', ' ') }}</strong></div><div><span>Confianza</span><strong>{{ Math.round(result.confidence * 100) }}%</strong></div></div>
                  <div v-else-if="executedType === 'statistics'" class="result-metric result-metric-wide"><div><span>Caracteres</span><strong>{{ result.characters }}</strong></div><div><span>Palabras</span><strong>{{ result.words }}</strong></div><div><span>Palabras únicas</span><strong>{{ result.uniqueWords }}</strong></div><div><span>Oraciones</span><strong>{{ result.sentences }}</strong></div><div><span>Párrafos</span><strong>{{ result.paragraphs }}</strong></div><div><span>Densidad léxica</span><strong>{{ result.lexicalDensity }}</strong></div><div><span>Promedio por palabra</span><strong>{{ result.averageWordLength }}</strong></div><div><span>Lectura estimada</span><strong>{{ result.estimatedReadingMinutes }} min</strong></div></div>
                  <div v-else-if="executedType === 'normalize'" class="result-box result-box-pre">{{ result.text }}</div>
                  <div v-if="result" class="result-footer"><span>Resultado generado por MiaServicios</span><span>Tiempo: {{ processingMs }} ms</span></div>
                </section>
              </div>
            </div>
          </template>

          <template v-if="page === 'history'">
            <div class="section-heading section-heading-row">
              <div><h2>Historial de resultados</h2><p>Encuentre tareas anteriores, revise resultados y exporte la información que necesite.</p></div>
              <div class="btn-toolbar history-actions"><div class="btn-group mr-2"><button class="btn btn-outline-light btn-sm" @click="exportHistory('csv')">CSV</button><button class="btn btn-outline-light btn-sm" @click="exportHistory('json')">JSON</button></div><button class="btn btn-outline-danger btn-sm" :disabled="!userHistory.length" @click="clearHistory"><i class="fa-solid fa-trash-can mr-2"></i>Vaciar historial</button></div>
            </div>
            <section class="panel-card">
              <div class="history-filters">
                <div class="form-group mb-0 history-search"><label>Buscar</label><div class="input-group"><div class="input-group-prepend"><span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span></div><input v-model="historySearch" type="search" class="form-control" placeholder="Buscar por contenido"></div></div>
                <div class="form-group mb-0"><label>Herramienta</label><select v-model="historyType" class="custom-select"><option value="all">Todas</option><option v-for="(label, key) in operationLabels" :key="key" :value="key">{{ label }}</option></select></div>
                <div class="form-group mb-0"><label>Orden</label><select v-model="historySort" class="custom-select"><option value="newest">Más recientes</option><option value="oldest">Más antiguos</option></select></div>
                <div class="form-group mb-0"><label>Filas</label><select v-model.number="historyPageSize" class="custom-select"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></div>
              </div>
              <div v-if="pagedHistory.length" class="table-responsive mt-4"><table class="table table-dark mb-0 history-table"><thead><tr><th>Herramienta</th><th>Contenido</th><th>Resultado</th><th>Respuesta</th><th>Fecha</th><th></th></tr></thead><tbody><tr v-for="item in pagedHistory" :key="item.id"><td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td><td class="table-preview">{{ item.inputPreview }}</td><td class="result-preview">{{ resultToText(item) }}</td><td>{{ item.processingMs }} ms</td><td>{{ formatDate(item.createdAt) }}</td><td class="text-right"><button class="btn btn-outline-danger btn-sm" @click="removeHistory(item.id)"><i class="fa-solid fa-trash-can"></i></button></td></tr></tbody></table></div>
              <div v-else class="empty-state"><div class="empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><h3>No se encontraron resultados</h3><p>Cambie los filtros o comience una nueva tarea.</p><button class="btn btn-primary btn-sm" @click="goTo('lab')">Abrir herramientas</button></div>
              <div v-if="filteredHistory.length" class="pagination-bar"><span>Mostrando {{ pagedHistory.length }} de {{ filteredHistory.length }} registros</span><div class="btn-group"><button class="btn btn-outline-light btn-sm" :disabled="historyPage <= 1" @click="historyPage -= 1"><i class="fa-solid fa-chevron-left"></i></button><button class="btn btn-outline-light btn-sm disabled">Página {{ historyPage }} de {{ historyPageCount }}</button><button class="btn btn-outline-light btn-sm" :disabled="historyPage >= historyPageCount" @click="historyPage += 1"><i class="fa-solid fa-chevron-right"></i></button></div></div>
            </section>
          </template>

          <template v-if="page === 'templates'">
            <div class="section-heading section-heading-row"><div><h2>Plantillas de contenido</h2><p>Guarde contenido frecuente y reutilícelo directamente en una nueva tarea.</p></div><button class="btn btn-primary" @click="showTemplateForm = !showTemplateForm"><i class="fa-solid fa-plus mr-2"></i>Nueva plantilla</button></div>
            <section v-if="showTemplateForm" class="panel-card mb-4"><div class="panel-title"><h2>Crear plantilla</h2><button class="btn btn-outline-light btn-sm" @click="showTemplateForm = false"><i class="fa-solid fa-xmark"></i></button></div><div class="row"><div class="col-md-8 form-group"><label>Título</label><input v-model="templateForm.title" type="text" class="form-control" maxlength="80"></div><div class="col-md-4 form-group"><label>Categoría</label><input v-model="templateForm.category" type="text" class="form-control" maxlength="40"></div></div><div class="form-group"><label>Contenido</label><textarea v-model="templateForm.text" class="form-control" rows="6" maxlength="20000"></textarea></div><button class="btn btn-primary" @click="createTemplate"><i class="fa-solid fa-floppy-disk mr-2"></i>Guardar plantilla</button></section>
            <section class="panel-card mb-4"><label>Buscar plantillas</label><div class="input-group"><div class="input-group-prepend"><span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span></div><input v-model="templateSearch" type="search" class="form-control" placeholder="Buscar por título, categoría o contenido"></div></section>
            <section v-if="filteredTemplates.length" class="template-grid"><article v-for="item in filteredTemplates" :key="item.id" class="template-card"><div class="template-card-header"><div><span class="template-category">{{ item.category }}</span><h3>{{ item.title }}</h3></div><span v-if="item.builtIn" class="template-origin">Incluida</span></div><p>{{ item.text }}</p><div class="template-card-actions"><button class="btn btn-primary btn-sm" @click="useTemplate(item)"><i class="fa-solid fa-arrow-up-right-from-square mr-2"></i>Usar</button><button class="btn btn-outline-light btn-sm" @click="copyTemplate(item)"><i class="fa-regular fa-copy"></i></button><button v-if="!item.builtIn" class="btn btn-outline-danger btn-sm" @click="removeTemplate(item)"><i class="fa-solid fa-trash-can"></i></button></div></article></section>
          </template>

          <template v-if="page === 'settings'">
            <div class="section-heading"><h2>Configuración</h2><p>Administre su cuenta, la experiencia visual, los respaldos y la información de MiaServicios.</p></div>
            <div class="settings-grid">
              <section class="panel-card"><div class="panel-title"><h2>Perfil</h2></div><div class="profile-summary"><div class="user-avatar profile-avatar">{{ session.user.name.charAt(0).toUpperCase() }}</div><div><strong>{{ session.user.email }}</strong><span>Cuenta creada: {{ formatDate(session.user.createdAt) }}</span></div></div><div class="form-group mt-4"><label>Nombre completo</label><input v-model="profileName" type="text" class="form-control" minlength="2" maxlength="80"></div><button class="btn btn-primary" @click="saveProfile"><i class="fa-solid fa-floppy-disk mr-2"></i>Guardar perfil</button></section>
              <section class="panel-card"><div class="panel-title"><h2>Seguridad</h2></div><div class="form-group"><label>Contraseña actual</label><input v-model="passwordForm.currentPassword" type="password" class="form-control"></div><div class="form-group"><label>Nueva contraseña</label><input v-model="passwordForm.newPassword" type="password" class="form-control" minlength="8"></div><div class="form-group"><label>Confirmar contraseña</label><input v-model="passwordForm.confirmation" type="password" class="form-control" minlength="8"></div><button class="btn btn-primary" @click="changePassword"><i class="fa-solid fa-key mr-2"></i>Cambiar contraseña</button></section>
              <section class="panel-card settings-appearance-card"><div class="panel-title"><div><h2>Apariencia y accesibilidad</h2><div class="panel-subtitle">Ajuste la lectura y el movimiento de la interfaz.</div></div><i class="fa-solid fa-universal-access settings-title-icon"></i></div><div class="preference-grid"><div class="form-group"><label>Espaciado</label><select v-model="visual.density" class="custom-select"><option value="comfortable">Cómodo</option><option value="compact">Compacto</option></select></div><div class="form-group"><label>Contraste</label><select v-model="visual.contrast" class="custom-select"><option value="standard">Estándar</option><option value="high">Alto contraste</option></select></div><div class="form-group"><label>Movimiento</label><select v-model="visual.motion" class="custom-select"><option value="full">Normal</option><option value="reduced">Reducido</option></select></div></div><button class="btn btn-primary" @click="saveAppearance"><i class="fa-solid fa-check mr-2"></i>Aplicar preferencias</button></section>
              <section class="panel-card"><div class="panel-title"><h2>Respaldo de datos</h2></div><p class="text-muted">Exporte el historial, las plantillas y las preferencias para conservar una copia o trasladar la información.</p><div class="data-actions"><button class="btn btn-outline-light" @click="exportBackup"><i class="fa-solid fa-file-export mr-2"></i>Exportar respaldo</button><button class="btn btn-outline-light" @click="$refs.importInput.click()"><i class="fa-solid fa-file-import mr-2"></i>Importar respaldo</button><input ref="importInput" type="file" accept="application/json" class="d-none" @change="importBackup"><button class="btn btn-outline-danger" @click="clearHistory"><i class="fa-solid fa-trash-can mr-2"></i>Eliminar historial</button></div></section>
              <section class="panel-card"><div class="panel-title"><h2>Estado del sistema</h2></div><div class="alert alert-dark-custom mb-3"><strong>Funcionamiento desde el navegador</strong><div class="small mt-2 text-muted">Estado: Disponible para uso local y publicación</div></div><div class="service-list"><div class="service-row"><div class="service-name"><i class="fa-solid fa-user-lock"></i>Acceso y seguridad</div><div class="service-state">Disponible</div></div><div class="service-row"><div class="service-name"><i class="fa-solid fa-brain"></i>Procesamiento de contenido</div><div class="service-state">Disponible</div></div><div class="service-row"><div class="service-name"><i class="fa-solid fa-clock-rotate-left"></i>Historial de resultados</div><div class="service-state">Disponible</div></div></div></section>
              <section class="panel-card settings-system-card"><div class="panel-title"><div><h2>Sistemas y versiones</h2><div class="panel-subtitle">Detalle técnico centralizado para mantenimiento y verificación.</div></div><span class="architecture-badge"><i class="fa-solid fa-gears mr-2"></i>Información técnica</span></div><div class="system-version-grid"><article v-for="item in systemVersions" :key="item.name" class="system-version-item"><div class="system-version-icon"><i class="fa-solid fa-cube"></i></div><div><strong>{{ item.name }}</strong><span>{{ item.purpose }}</span></div><code>{{ item.version }}</code></article></div></section>
            </div>
          </template>


          <template v-if="page === 'help'">
            <div class="section-heading"><h2>Guía de uso</h2><p>Consulte instrucciones breves para completar las acciones más frecuentes dentro de MiaServicios.</p></div>
            <section class="help-hero panel-card"><div class="help-hero-icon"><i class="fa-solid fa-circle-question"></i></div><div><h2>Encuentre una respuesta rápida</h2><p>La plataforma conserva el avance, organiza los resultados y mantiene las acciones principales disponibles en cada momento.</p></div><button class="btn btn-primary" @click="goTo('lab')">Abrir espacio de trabajo</button></section>
            <div class="help-layout">
              <section class="panel-card"><div class="panel-title"><h2>Guías rápidas</h2></div><div class="guide-list"><article v-for="guide in helpGuides" :key="guide.id" class="guide-item" :class="{ 'is-open': openHelp === guide.id }"><button type="button" @click="openHelp = openHelp === guide.id ? '' : guide.id"><span class="guide-icon"><i :class="guide.icon"></i></span><strong>{{ guide.title }}</strong><i :class="openHelp === guide.id ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i></button><ol v-if="openHelp === guide.id"><li v-for="step in guide.steps" :key="step">{{ step }}</li></ol></article></div></section>
              <aside class="panel-card"><div class="panel-title"><h2>Accesos directos</h2></div><div class="help-shortcuts"><button @click="goTo('lab')"><i class="fa-solid fa-pen-to-square"></i><span><strong>Nueva tarea</strong><small>Comience o continúe un borrador.</small></span></button><button @click="goTo('history')"><i class="fa-solid fa-clock-rotate-left"></i><span><strong>Historial</strong><small>Busque y reutilice resultados.</small></span></button><button @click="goTo('templates')"><i class="fa-solid fa-layer-group"></i><span><strong>Plantillas</strong><small>Prepare contenido frecuente.</small></span></button><button @click="goTo('settings')"><i class="fa-solid fa-sliders"></i><span><strong>Configuración</strong><small>Ajuste cuenta, vista y respaldo.</small></span></button></div></aside>
            </div>
            <section class="panel-card mt-4"><div class="panel-title"><h2>Preguntas frecuentes</h2></div><div class="faq-grid"><article v-for="item in helpQuestions" :key="item.question"><i class="fa-regular fa-circle-check"></i><div><strong>{{ item.question }}</strong><p>{{ item.answer }}</p></div></article></div></section>
          </template>

          <template v-if="page === 'experience'">
            <div class="section-heading section-heading-row architecture-heading">
              <div><h2>Experiencia de uso</h2><p>Conozca el recorrido dentro de MiaServicios y la forma en que cada pantalla ayuda a completar una tarea con claridad.</p></div>
              <div class="architecture-export-actions"><button class="btn btn-outline-light" @click="exportArchitectureSvg"><i class="fa-solid fa-file-arrow-down mr-2"></i>Exportar guía</button><button class="btn btn-primary" @click="exportArchitecturePng"><i class="fa-solid fa-image mr-2"></i>Guardar como imagen</button></div>
            </div>

            <div class="architecture-mode-card experience-intro mb-4"><div class="architecture-mode-icon"><i class="fa-solid fa-compass"></i></div><div><span>Diseñado para el usuario</span><strong>Una experiencia clara de principio a fin</strong><p>Las funciones principales están organizadas para encontrar, procesar, revisar y conservar información sin pasos innecesarios.</p></div></div>

            <section class="panel-card architecture-overview mb-4">
              <div class="panel-title architecture-panel-title"><div><h2>Recorrido principal</h2><p class="panel-subtitle">Cinco momentos simples para completar una tarea dentro de MiaServicios.</p></div><span class="architecture-badge"><i class="fa-solid fa-route mr-2"></i>Guía paso a paso</span></div>
              <div class="user-journey">
                <template v-for="(step, index) in architectureJourney" :key="step.title"><article class="journey-step"><div class="journey-index">{{ String(index + 1).padStart(2, '0') }}</div><div class="journey-icon"><i :class="step.icon"></i></div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></article><div v-if="index < architectureJourney.length - 1" class="journey-connector"><i class="fa-solid fa-arrow-right-long"></i></div></template>
              </div>
            </section>

            <section class="architecture-grid mb-4">
              <article v-for="component in architectureComponents" :key="component.title" class="architecture-card"><div class="architecture-card-header"><div class="architecture-icon"><i :class="component.icon"></i></div><span class="architecture-status"><span></span>Disponible</span></div><h3>{{ component.title }}</h3><p>{{ component.description }}</p><div class="tech-list"><span v-for="technology in component.technologies" :key="technology">{{ technology }}</span></div></article>
            </section>

            <section class="architecture-benefits mb-4"><article v-for="benefit in architectureBenefits" :key="benefit.title" class="benefit-card"><i :class="benefit.icon"></i><div><h3>{{ benefit.title }}</h3><p>{{ benefit.text }}</p></div></article></section>

            <section class="panel-card architecture-image-panel">
              <div class="panel-title architecture-panel-title"><div><h2>Guía visual personalizada</h2><p class="panel-subtitle">Agregue una imagen que represente el recorrido, una pantalla de referencia o una guía de uso. Se admiten PNG, JPG, WEBP y SVG hasta 2 MB.</p></div><div class="architecture-image-actions"><button class="btn btn-outline-light btn-sm" @click="selectArchitectureImage"><i class="fa-solid fa-upload mr-2"></i>{{ customImage ? 'Reemplazar imagen' : 'Agregar imagen' }}</button><input ref="imageInput" type="file" class="d-none" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="onArchitectureImageSelected"></div></div>
              <div v-if="customImage" class="architecture-image-preview"><img :src="customImage.dataUrl" :alt="'Guía visual ' + customImage.name"><div class="architecture-image-meta"><div><strong>{{ customImage.name }}</strong><span>{{ formatBytes(customImage.size) }} · Guardada en este navegador</span></div><div class="btn-group"><button class="btn btn-outline-light btn-sm" @click="downloadArchitectureImage"><i class="fa-solid fa-download"></i></button><button class="btn btn-outline-danger btn-sm" @click="removeArchitectureImage"><i class="fa-solid fa-trash-can"></i></button></div></div></div>
              <button v-else type="button" class="architecture-image-empty" @click="selectArchitectureImage"><span class="architecture-upload-icon"><i class="fa-regular fa-image"></i></span><strong>Agregar una guía visual</strong><span>Seleccione una imagen desde su equipo. El archivo se guarda únicamente en este navegador.</span></button>
            </section>
          </template>
        </main>
      </section>
    </div>
  `
}).mount('#app');
