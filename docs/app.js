// Ejecuta la demostracion estatica publicada en GitHub Pages.
const { computed, createApp, ref } = Vue;

const stopWords = new Set(['para', 'como', 'pero', 'porque', 'desde', 'hasta', 'sobre', 'entre', 'este', 'esta', 'estos', 'estas', 'todo', 'toda', 'todos', 'todas', 'que', 'con', 'sin', 'una', 'uno', 'unos', 'unas', 'del', 'las', 'los', 'por', 'sus', 'son', 'ser', 'fue', 'han', 'hay', 'muy', 'mas', 'tambien']);
const positiveWords = new Set(['avance', 'beneficio', 'bien', 'calidad', 'confiable', 'correcto', 'crecimiento', 'eficiente', 'estable', 'excelente', 'exito', 'favorable', 'ganancia', 'mejora', 'mejor', 'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor']);
const negativeWords = new Set(['alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento', 'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'vulnerable', 'incidente', 'queja', 'deficiente', 'bloqueo', 'inestable', 'grave']);
const categoryRules = {
  tecnologia: ['api', 'aplicacion', 'codigo', 'datos', 'digital', 'microservicio', 'nube', 'software', 'sistema', 'tecnologia'],
  finanzas: ['banco', 'costo', 'credito', 'dinero', 'factura', 'finanzas', 'ganancia', 'inversion', 'pago', 'presupuesto'],
  operaciones: ['calidad', 'cliente', 'entrega', 'inventario', 'logistica', 'operacion', 'proceso', 'produccion', 'servicio', 'transporte'],
  seguridad: ['acceso', 'amenaza', 'auditoria', 'cifrado', 'incidente', 'riesgo', 'seguridad', 'vulnerabilidad', 'token', 'fraude'],
  recursos_humanos: ['capacitacion', 'colaborador', 'desempeno', 'empleado', 'equipo', 'liderazgo', 'persona', 'personal', 'talento', 'trabajador']
};

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const wordsFrom = (text) => normalize(text).match(/[a-z0-9]+/g) || [];
const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));
const frequencyMap = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());

const summarize = (text, sentenceLimit) => {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= sentenceLimit) return { summary: text.trim(), originalCharacters: text.length };
  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const selected = sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const score = words.reduce((sum, word) => sum + (frequencies.get(word) || 0) / maximum, 0) / Math.max(words.length, 1) + (index === 0 ? 0.25 : 0);
    return { sentence, index, score };
  }).sort((left, right) => right.score - left.score).slice(0, sentenceLimit).sort((left, right) => left.index - right.index).map((item) => item.sentence).join(' ');
  return { summary: selected, originalCharacters: text.length };
};

const sentiment = (text) => {
  const words = wordsFrom(text);
  let score = 0;
  let positiveMatches = 0;
  let negativeMatches = 0;
  words.forEach((word, index) => {
    const multiplier = ['no', 'nunca'].includes(words[index - 1]) ? -1 : 1;
    if (positiveWords.has(word)) {
      score += multiplier;
      multiplier > 0 ? positiveMatches += 1 : negativeMatches += 1;
    }
    if (negativeWords.has(word)) {
      score -= multiplier;
      multiplier > 0 ? negativeMatches += 1 : positiveMatches += 1;
    }
  });
  const matches = positiveMatches + negativeMatches;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;
  return { label: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral', score: normalizedScore, positiveMatches, negativeMatches };
};

const extractKeywords = (text, limit) => ({
  keywords: [...frequencyMap(relevantWords(text)).entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, limit).map(([word, count]) => ({ word, count }))
});

const classify = (text) => {
  const words = wordsFrom(text);
  const scores = Object.entries(categoryRules).map(([category, terms]) => ({ category, score: terms.reduce((sum, term) => sum + words.filter((word) => word === term).length, 0) })).sort((left, right) => right.score - left.score);
  const winner = scores[0];
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return winner?.score ? { category: winner.category, confidence: Number(Math.min(0.98, 0.45 + winner.score / Math.max(total, 1) * 0.5).toFixed(2)), scores } : { category: 'general', confidence: 0.25, scores };
};

createApp({
  setup() {
    const session = ref(JSON.parse(localStorage.getItem('mia_static_session') || 'null'));
    const page = ref('dashboard');
    const sidebarOpen = ref(false);
    const loginMode = ref('login');
    const name = ref('');
    const email = ref('demo@mia.local');
    const password = ref('demo12345');
    const authError = ref('');
    const selected = ref('summarize');
    const text = ref('La plataforma MiaServicios integra una interfaz web responsive con servicios independientes para autenticacion, procesamiento de lenguaje e historial. La arquitectura busca mantener costos operativos en cero mediante herramientas de codigo abierto y almacenamiento local. El motor permite resumir documentos, analizar sentimiento, extraer palabras clave y clasificar contenido sin depender de una API comercial.');
    const sentences = ref(3);
    const keywordLimit = ref(8);
    const result = ref(null);
    const processingMs = ref(0);
    const error = ref('');
    const history = ref(JSON.parse(localStorage.getItem('mia_static_history') || '[]'));
    const operations = [
      { id: 'summarize', label: 'Resumen', icon: 'fa-solid fa-align-left' },
      { id: 'sentiment', label: 'Sentimiento', icon: 'fa-solid fa-scale-balanced' },
      { id: 'keywords', label: 'Palabras clave', icon: 'fa-solid fa-tags' },
      { id: 'classify', label: 'Clasificacion', icon: 'fa-solid fa-folder-tree' }
    ];
    const labels = Object.fromEntries(operations.map((item) => [item.id, item.label]));
    const pageTitle = computed(() => ({ dashboard: 'Panel general', lab: 'Laboratorio IA', history: 'Historial', architecture: 'Arquitectura' })[page.value]);
    const userHistory = computed(() => history.value.filter((item) => item.userId === session.value?.user.id));
    const averageMs = computed(() => userHistory.value.length ? (userHistory.value.reduce((sum, item) => sum + item.processingMs, 0) / userHistory.value.length).toFixed(2) : '0.00');
    const primaryOperation = computed(() => {
      const counts = userHistory.value.reduce((map, item) => map.set(item.type, (map.get(item.type) || 0) + 1), new Map());
      const first = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
      return first ? labels[first[0]] : 'Sin datos';
    });

    const authenticate = () => {
      authError.value = '';
      const users = JSON.parse(localStorage.getItem('mia_static_users') || '[]');
      if (loginMode.value === 'register') {
        if (name.value.trim().length < 2 || password.value.length < 8) {
          authError.value = 'Complete los datos requeridos.';
          return;
        }
        if (users.some((user) => user.email.toLowerCase() === email.value.toLowerCase()) || email.value.toLowerCase() === 'demo@mia.local') {
          authError.value = 'El correo ya se encuentra registrado.';
          return;
        }
        const user = { id: crypto.randomUUID(), name: name.value.trim(), email: email.value.toLowerCase(), password: password.value, role: 'user' };
        localStorage.setItem('mia_static_users', JSON.stringify([...users, user]));
        session.value = { token: `static-${user.id}`, user: { ...user, password: undefined } };
      } else {
        const user = email.value.toLowerCase() === 'demo@mia.local' && password.value === 'demo12345'
          ? { id: 'demo-user', name: 'Usuario Demo', email: 'demo@mia.local', role: 'admin' }
          : users.find((item) => item.email.toLowerCase() === email.value.toLowerCase() && item.password === password.value);
        if (!user) {
          authError.value = 'Correo o contrasena incorrectos.';
          return;
        }
        session.value = { token: `static-${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }
      localStorage.setItem('mia_static_session', JSON.stringify(session.value));
    };

    const goTo = (target) => {
      page.value = target;
      sidebarOpen.value = false;
    };

    const logout = () => {
      localStorage.removeItem('mia_static_session');
      session.value = null;
      page.value = 'dashboard';
    };

    const execute = () => {
      error.value = '';
      result.value = null;
      if (text.value.trim().length < 20) {
        error.value = 'Ingrese un texto de al menos 20 caracteres.';
        return;
      }
      const started = performance.now();
      const operation = selected.value === 'summarize' ? summarize(text.value, sentences.value)
        : selected.value === 'sentiment' ? sentiment(text.value)
          : selected.value === 'keywords' ? extractKeywords(text.value, keywordLimit.value)
            : classify(text.value);
      processingMs.value = Number((performance.now() - started).toFixed(2));
      result.value = operation;
      const entry = { id: crypto.randomUUID(), userId: session.value.user.id, type: selected.value, inputPreview: text.value.replace(/\s+/g, ' ').slice(0, 240), result: operation, processingMs: processingMs.value, createdAt: new Date().toISOString() };
      history.value = [entry, ...history.value];
      localStorage.setItem('mia_static_history', JSON.stringify(history.value));
    };

    const remove = (id) => {
      if (!window.confirm('Se eliminara este registro del historial.')) return;
      history.value = history.value.filter((item) => item.id !== id);
      localStorage.setItem('mia_static_history', JSON.stringify(history.value));
    };

    const formatDate = (value) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
    const resultSummary = (item) => item.type === 'summarize' ? item.result.summary : item.type === 'sentiment' ? `${item.result.label} (${item.result.score})` : item.type === 'keywords' ? item.result.keywords.map((entry) => entry.word).join(', ') : `${item.result.category.replace('_', ' ')} (${Math.round(item.result.confidence * 100)}%)`;

    return { session, page, sidebarOpen, loginMode, name, email, password, authError, selected, text, sentences, keywordLimit, result, processingMs, error, history, userHistory, operations, labels, pageTitle, averageMs, primaryOperation, authenticate, goTo, logout, execute, remove, formatDate, resultSummary };
  },
  template: `
    <div v-if="!session" class="auth-page">
      <section class="auth-visual">
        <img src="./brand/miaservicios-cover.png" alt="Identidad visual de MiaServicios">
        <div class="auth-copy"><h1><strong>Mia</strong>Servicios</h1><p>Procesamiento de lenguaje, autenticacion e historial mediante una arquitectura modular preparada para operar sin servicios de pago.</p></div>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="auth-logo"><div class="brand-symbol"><i class="fa-solid fa-brain"></i></div><div><h2>{{ loginMode === 'login' ? 'Acceso a la plataforma' : 'Crear una cuenta' }}</h2><p>Ejecucion estatica con datos locales</p></div></div>
          <div class="auth-tabs"><button class="auth-tab" :class="{ 'is-active': loginMode === 'login' }" @click="loginMode = 'login'; authError = ''">Iniciar sesion</button><button class="auth-tab" :class="{ 'is-active': loginMode === 'register' }" @click="loginMode = 'register'; authError = ''">Registrarse</button></div>
          <div v-if="authError" class="alert alert-danger-custom">{{ authError }}</div>
          <form @submit.prevent="authenticate">
            <div v-if="loginMode === 'register'" class="form-group"><label>Nombre completo</label><input v-model.trim="name" class="form-control" minlength="2" required></div>
            <div class="form-group"><label>Correo electronico</label><input v-model.trim="email" type="email" class="form-control" required></div>
            <div class="form-group"><label>Contrasena</label><input v-model="password" type="password" class="form-control" minlength="8" required></div>
            <button class="btn btn-primary btn-block"><i class="fa-solid fa-arrow-right-to-bracket mr-2"></i>{{ loginMode === 'login' ? 'Ingresar' : 'Registrar cuenta' }}</button>
          </form>
          <div v-if="loginMode === 'login'" class="demo-credentials"><strong>Acceso inicial</strong><br>Correo: demo@mia.local<br>Contrasena: demo12345</div>
        </div>
      </section>
    </div>
    <div v-else class="app-frame">
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>
      <aside class="app-sidebar" :class="{ 'is-open': sidebarOpen }">
        <div class="brand-block"><div class="brand-symbol"><i class="fa-solid fa-brain"></i></div><div><div class="brand-title"><strong>Mia</strong>Servicios</div><div class="brand-subtitle">Plataforma de IA</div></div></div>
        <nav class="sidebar-nav">
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'dashboard' }" @click="goTo('dashboard')"><i class="fa-solid fa-chart-line"></i><span>Panel general</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'lab' }" @click="goTo('lab')"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Laboratorio IA</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'history' }" @click="goTo('history')"><i class="fa-solid fa-clock-rotate-left"></i><span>Historial</span></button>
          <button class="sidebar-link w-100 border-0" :class="{ 'router-link-active': page === 'architecture' }" @click="goTo('architecture')"><i class="fa-solid fa-diagram-project"></i><span>Arquitectura</span></button>
        </nav>
        <div class="sidebar-footer"><div class="mode-indicator"><span class="status-dot"></span>Modo GitHub Pages</div><button class="btn btn-outline-light btn-sm btn-block" @click="logout"><i class="fa-solid fa-right-from-bracket mr-2"></i>Cerrar sesion</button></div>
      </aside>
      <section class="app-content">
        <header class="topbar"><button type="button" class="btn sidebar-toggle" aria-label="Abrir menu" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button><div class="topbar-heading"><div class="page-eyebrow">MiaServicios</div><h1>{{ pageTitle }}</h1></div><div class="user-chip"><div class="user-avatar">{{ session.user.name.charAt(0).toUpperCase() }}</div><div class="user-data"><strong>{{ session.user.name }}</strong><span>{{ session.user.role }}</span></div></div></header>
        <main class="page-container">
          <template v-if="page === 'dashboard'">
            <div class="section-heading"><h2>Resumen operativo</h2><p>Vista consolidada del uso de las funciones NLP y del rendimiento del motor local.</p></div>
            <section class="metric-grid">
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-layer-group"></i></div><div><div class="metric-label">Operaciones</div><div class="metric-value">{{ userHistory.length }}</div><div class="metric-detail">Procesamientos registrados</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-gauge-high"></i></div><div><div class="metric-label">Tiempo promedio</div><div class="metric-value">{{ averageMs }} ms</div><div class="metric-detail">Ejecucion en navegador</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-ranking-star"></i></div><div><div class="metric-label">Funcion principal</div><div class="metric-value">{{ primaryOperation }}</div><div class="metric-detail">Operacion mas utilizada</div></div></article>
              <article class="metric-card"><div class="metric-icon"><i class="fa-solid fa-server"></i></div><div><div class="metric-label">Componentes</div><div class="metric-value">3</div><div class="metric-detail">Adaptadores locales activos</div></div></article>
            </section>
            <section class="panel-card"><div class="panel-title"><h2>Actividad reciente</h2><button class="btn btn-outline-light btn-sm" @click="goTo('history')">Ver historial</button></div><div v-if="userHistory.length" class="table-responsive"><table class="table table-dark mb-0"><thead><tr><th>Operacion</th><th>Entrada</th><th>Tiempo</th><th>Fecha</th></tr></thead><tbody><tr v-for="item in userHistory.slice(0, 6)" :key="item.id"><td><span class="badge-operation">{{ labels[item.type] }}</span></td><td>{{ item.inputPreview }}</td><td>{{ item.processingMs }} ms</td><td>{{ formatDate(item.createdAt) }}</td></tr></tbody></table></div><div v-else class="empty-state"><i class="fa-solid fa-chart-column"></i><h3>Todavia no hay actividad</h3><p>Ejecute una operacion en el laboratorio para generar la primera entrada.</p><button class="btn btn-primary btn-sm" @click="goTo('lab')">Abrir laboratorio</button></div></section>
          </template>
          <template v-if="page === 'lab'">
            <div class="section-heading"><h2>Laboratorio de texto</h2><p>Seleccione una funcion, ingrese contenido y ejecute el procesamiento.</p></div>
            <div class="operation-selector"><button v-for="operation in operations" :key="operation.id" class="operation-card" :class="{ 'is-active': selected === operation.id }" @click="selected = operation.id; result = null"><i :class="operation.icon"></i><strong>{{ operation.label }}</strong><span>Procesamiento local sin API de pago.</span></button></div>
            <div class="lab-grid"><section class="panel-card"><div v-if="error" class="alert alert-danger-custom">{{ error }}</div><div class="form-group"><label>Texto de entrada</label><textarea v-model="text" class="form-control" maxlength="12000"></textarea></div><div v-if="selected === 'summarize'" class="form-group"><label>Cantidad de oraciones</label><select v-model.number="sentences" class="custom-select"><option v-for="value in 8" :value="value">{{ value }}</option></select></div><div v-if="selected === 'keywords'" class="form-group"><label>Cantidad de terminos</label><select v-model.number="keywordLimit" class="custom-select"><option v-for="value in [5,8,10,12,15,20]" :value="value">{{ value }}</option></select></div><button class="btn btn-primary" @click="execute"><i class="fa-solid fa-play mr-2"></i>Ejecutar analisis</button></section>
            <section class="panel-card"><div class="panel-title"><h2>Resultado</h2></div><div v-if="!result" class="result-placeholder"><div><i class="fa-solid fa-file-lines"></i>El resultado aparecera en este panel.</div></div><div v-else-if="selected === 'summarize'" class="result-box">{{ result.summary }}</div><div v-else-if="selected === 'sentiment'" class="result-metric"><div><span>Resultado</span><strong>{{ result.label }}</strong></div><div><span>Puntaje</span><strong>{{ result.score }}</strong></div></div><div v-else-if="selected === 'keywords'" class="keyword-list"><span v-for="keyword in result.keywords" class="keyword-chip">{{ keyword.word }} <strong>{{ keyword.count }}</strong></span></div><div v-else class="result-metric"><div><span>Categoria</span><strong>{{ result.category.replace('_',' ') }}</strong></div><div><span>Confianza</span><strong>{{ Math.round(result.confidence * 100) }}%</strong></div></div><div v-if="result" class="text-muted small mt-4">Motor: mia-nlp-browser-1.0 · Tiempo: {{ processingMs }} ms</div></section></div>
          </template>
          <template v-if="page === 'history'">
            <div class="section-heading"><h2>Historial de procesamiento</h2><p>Registro cronologico almacenado en el navegador.</p></div>
            <section class="panel-card"><div v-if="userHistory.length" class="table-responsive"><table class="table table-dark mb-0"><thead><tr><th>Operacion</th><th>Texto</th><th>Resultado</th><th>Tiempo</th><th>Fecha</th><th></th></tr></thead><tbody><tr v-for="item in userHistory" :key="item.id"><td><span class="badge-operation">{{ labels[item.type] }}</span></td><td>{{ item.inputPreview }}</td><td>{{ resultSummary(item) }}</td><td>{{ item.processingMs }} ms</td><td>{{ formatDate(item.createdAt) }}</td><td><button class="btn btn-outline-danger btn-sm" @click="remove(item.id)"><i class="fa-regular fa-trash-can"></i></button></td></tr></tbody></table></div><div v-else class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><h3>No existen registros</h3><p>Ejecute una operacion para iniciar el historial.</p></div></section>
          </template>
          <template v-if="page === 'architecture'">
            <div class="section-heading"><h2>Arquitectura de la solucion</h2><p>La version publicada opera localmente; el repositorio incluye los microservicios Node.js completos.</p></div>
            <section class="architecture-grid"><article class="architecture-card"><div class="architecture-icon"><i class="fa-solid fa-display"></i></div><h3>Frontend Vue</h3><p>Interfaz responsive con Bootstrap 4.6, navegacion y estado local.</p><div class="tech-list"><span>Vue 3</span><span>Bootstrap</span><span>Font Awesome</span></div></article><article class="architecture-card"><div class="architecture-icon"><i class="fa-solid fa-network-wired"></i></div><h3>API Gateway</h3><p>Orquesta servicios independientes y centraliza la seguridad.</p><div class="tech-list"><span>Node.js</span><span>Express</span><span>REST</span></div></article><article class="architecture-card"><div class="architecture-icon"><i class="fa-solid fa-brain"></i></div><h3>Motor NLP</h3><p>Ejecuta resumen, sentimiento, palabras clave y clasificacion sin APIs comerciales.</p><div class="tech-list"><span>NLP local</span><span>Costo cero</span></div></article><article class="architecture-card"><div class="architecture-icon"><i class="fa-solid fa-database"></i></div><h3>Persistencia</h3><p>SQLite para microservicios y LocalStorage para GitHub Pages.</p><div class="tech-list"><span>SQLite</span><span>LocalStorage</span></div></article></section>
          </template>
        </main>
      </section>
    </div>
  `
}).mount('#app');
