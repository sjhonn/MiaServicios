# MiaServicios - Codigo completo

## Estructura de carpetas

```text
.gitignore
.nvmrc
LICENSE
README.md
docs/.nojekyll
docs/app.js
docs/index.html
docs/theme.css
frontend/.env.development
frontend/.env.production
frontend/index.html
frontend/package.json
frontend/public/.nojekyll
frontend/src/App.vue
frontend/src/assets/theme.css
frontend/src/components/EmptyState.vue
frontend/src/components/StatCard.vue
frontend/src/layouts/AppShell.vue
frontend/src/main.js
frontend/src/router/index.js
frontend/src/services/demoRepository.js
frontend/src/services/localAi.js
frontend/src/services/platformApi.js
frontend/src/stores/auth.js
frontend/src/views/ArchitectureView.vue
frontend/src/views/DashboardView.vue
frontend/src/views/HistoryView.vue
frontend/src/views/LoginView.vue
frontend/src/views/TextLabView.vue
frontend/vite.config.js
package.json
services/ai-service/.env.example
services/ai-service/package.json
services/ai-service/src/nlp.js
services/ai-service/src/server.js
services/api-gateway/.env.example
services/api-gateway/package.json
services/api-gateway/src/server.js
services/auth-service/.env.example
services/auth-service/package.json
services/auth-service/src/database.js
services/auth-service/src/server.js
services/history-service/.env.example
services/history-service/package.json
services/history-service/src/database.js
services/history-service/src/server.js
tests/nlp-smoke.mjs
```

## `.gitignore`

```text
# Excluye dependencias, secretos y bases locales.
node_modules/
.env
.env.local
services/*/.env
services/*/data/*.db
services/*/data/*.db-shm
services/*/data/*.db-wal
frontend/.env.local
.DS_Store
npm-debug.log*
```

## `.nvmrc`

```text
# Define la version recomendada de Node.js.
22.18.0
```

## `LICENSE`

```text
MIT License

Copyright (c) 2026 MiaServicios

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## `README.md`

````markdown
<!-- Describe la instalacion y operacion de MiaServicios. -->
# MiaServicios

Plataforma de procesamiento de texto con arquitectura de microservicios en Node.js y una interfaz Vue 3 preparada para GitHub Pages.

## Componentes

- `frontend`: Vue 3, Vite, Pinia, Vue Router, Bootstrap 4.6.2 y Font Awesome.
- `api-gateway`: entrada unificada y orquestacion de servicios.
- `auth-service`: registro, inicio de sesion y validacion JWT con SQLite.
- `ai-service`: resumen, sentimiento, palabras clave y clasificacion mediante NLP local.
- `history-service`: persistencia del historial en SQLite.
- `docs`: compilacion estatica lista para GitHub Pages.

## Requisitos

- Node.js 22.18 o superior.
- npm 10 o superior.

## Ejecucion completa

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Gateway: `http://localhost:4000`

Credenciales iniciales:

```text
demo@mia.local
demo12345
```

## Compilacion para GitHub Pages

```bash
npm run build
```

El resultado se genera en `/docs`. En GitHub, seleccione `Settings > Pages > Deploy from a branch > main > /docs`.

La compilacion de produccion usa modo demostracion local para que GitHub Pages funcione sin un servidor. Para conectar un backend remoto, edite `frontend/.env.production` y establezca `VITE_DEMO_MODE=false` junto con `VITE_API_URL`.
````

## `docs/.nojekyll`

```text

```

## `docs/app.js`

```javascript
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
```

## `docs/index.html`

```html
<!-- Publica una version funcional directa para GitHub Pages. -->
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="theme-color" content="#121519">
  <meta name="description" content="MiaServicios, plataforma de procesamiento de texto basada en microservicios.">
  <title>MiaServicios</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
  <link rel="stylesheet" href="./theme.css">
</head>
<body>
  <div id="app"></div>
  <script src="https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js"></script>
  <script src="./app.js"></script>
</body>
</html>
```

## `docs/theme.css`

```css
/* Define el tema oscuro y responsive de la plataforma. */
:root {
  color-scheme: dark;
  --bg: #0f1114;
  --surface: #171a1f;
  --surface-soft: #1d2127;
  --surface-raised: #232830;
  --border: #303740;
  --text: #f4f6f8;
  --muted: #9da6b1;
  --accent: #28b9d2;
  --accent-soft: rgba(40, 185, 210, 0.14);
  --danger: #e16d74;
  --success: #62c48d;
  --warning: #d9b45b;
  --sidebar-width: 264px;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
}

a:hover {
  color: #69d5e7;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-frame {
  min-height: 100vh;
  display: flex;
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1040;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: #12151a;
  border-right: 1px solid var(--border);
  transition: transform 0.25s ease;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 78px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.brand-symbol {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 21px;
}

.brand-title {
  font-size: 20px;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 18px 12px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
  padding: 12px 14px;
  border-radius: 8px;
  color: #bec5cd;
  background: transparent;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}

.sidebar-link i {
  width: 18px;
  color: #7f8995;
  text-align: center;
}

.sidebar-link:hover,
.sidebar-link.router-link-active {
  background: var(--accent-soft);
  color: var(--text);
}

.sidebar-link.router-link-active i {
  color: var(--accent);
}

.sidebar-footer {
  padding: 18px;
  border-top: 1px solid var(--border);
}

.mode-indicator {
  margin-bottom: 13px;
  color: var(--muted);
  font-size: 12px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(98, 196, 141, 0.12);
}

.app-content {
  width: calc(100% - var(--sidebar-width));
  min-height: 100vh;
  margin-left: var(--sidebar-width);
}

.topbar {
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
  background: rgba(15, 17, 20, 0.92);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 1020;
}

.sidebar-toggle {
  display: none;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
}

.topbar-heading {
  flex: 1;
}

.page-eyebrow {
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.topbar h1 {
  margin: 2px 0 0;
  font-size: 21px;
  font-weight: 650;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  color: var(--accent);
  font-weight: 700;
}

.user-data {
  line-height: 1.15;
}

.user-data strong,
.user-data span {
  display: block;
}

.user-data strong {
  font-size: 13px;
}

.user-data span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  text-transform: capitalize;
}

.page-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px;
}

.section-heading {
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 0 0 7px;
  font-size: 24px;
  font-weight: 650;
}

.section-heading p {
  max-width: 760px;
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.panel-card,
.metric-card,
.auth-card,
.operation-card,
.architecture-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.16);
}

.panel-card {
  padding: 22px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-title h2,
.panel-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.metric-card {
  min-height: 126px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.metric-icon {
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 19px;
}

.metric-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.metric-value {
  margin-top: 5px;
  font-size: 28px;
  font-weight: 700;
}

.metric-detail {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
  gap: 20px;
}

.table-dark {
  color: var(--text);
  background: transparent;
}

.table-dark th,
.table-dark td,
.table-dark thead th {
  border-color: var(--border);
}

.table-dark thead th {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.table-dark tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.badge-operation {
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: #78d9e9;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.service-list {
  display: grid;
  gap: 12px;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.service-name i {
  color: var(--accent);
}

.service-state {
  color: var(--success);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.form-control,
.custom-select {
  min-height: 44px;
  color: var(--text);
  background: #111419;
  border-color: var(--border);
}

.form-control:focus,
.custom-select:focus {
  color: var(--text);
  background: #111419;
  border-color: var(--accent);
  box-shadow: 0 0 0 0.2rem rgba(40, 185, 210, 0.13);
}

.form-control::placeholder {
  color: #6f7883;
}

textarea.form-control {
  min-height: 260px;
  resize: vertical;
}

label {
  color: #cbd1d8;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  color: #061215;
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 700;
}

.btn-primary:hover,
.btn-primary:focus {
  color: #061215;
  background: #55cbe0;
  border-color: #55cbe0;
}

.btn-outline-light {
  color: #d9dee4;
  border-color: #59616b;
}

.btn-outline-light:hover {
  color: var(--text);
  background: var(--surface-raised);
  border-color: #717b87;
}

.btn-outline-danger {
  color: #ee969b;
  border-color: #7d4146;
}

.btn-outline-danger:hover {
  background: #7d4146;
  border-color: #7d4146;
}

.operation-selector {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.operation-card {
  width: 100%;
  padding: 16px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.operation-card:hover,
.operation-card.is-active {
  transform: translateY(-2px);
  background: var(--surface-soft);
  border-color: var(--accent);
}

.operation-card i {
  margin-bottom: 13px;
  color: var(--accent);
  font-size: 20px;
}

.operation-card strong,
.operation-card span {
  display: block;
}

.operation-card strong {
  font-size: 14px;
}

.operation-card span {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}

.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.result-box {
  min-height: 260px;
  padding: 18px;
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #dce1e6;
  line-height: 1.7;
  white-space: pre-wrap;
}

.result-placeholder {
  min-height: 260px;
  display: grid;
  place-items: center;
  padding: 28px;
  color: var(--muted);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.result-placeholder i {
  display: block;
  margin-bottom: 13px;
  color: #59636e;
  font-size: 34px;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.keyword-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  border: 1px solid rgba(40, 185, 210, 0.22);
  color: #8addec;
  font-size: 12px;
  font-weight: 600;
}

.result-metric {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-metric > div {
  padding: 15px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result-metric span,
.result-metric strong {
  display: block;
}

.result-metric span {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
}

.result-metric strong {
  margin-top: 5px;
  font-size: 18px;
  text-transform: capitalize;
}

.alert-dark-custom {
  color: #d8dde3;
  background: #20242a;
  border: 1px solid var(--border);
}

.alert-danger-custom {
  color: #f2b6ba;
  background: rgba(225, 109, 116, 0.12);
  border: 1px solid rgba(225, 109, 116, 0.34);
}

.empty-state {
  padding: 42px 20px;
  color: var(--muted);
  text-align: center;
}

.empty-state > i {
  margin-bottom: 14px;
  color: #59636e;
  font-size: 34px;
}

.empty-state h3 {
  color: var(--text);
  font-size: 17px;
}

.empty-state p {
  max-width: 520px;
  margin: 8px auto 18px;
}

.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
  background: var(--bg);
}

.auth-visual {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  padding: 54px;
  overflow: hidden;
  background: #f7f8f9;
}

.auth-visual::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 52%, rgba(10, 14, 18, 0.84) 100%);
}

.auth-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.auth-copy {
  position: relative;
  z-index: 1;
  max-width: 620px;
}

.auth-copy h1 {
  margin-bottom: 12px;
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 300;
}

.auth-copy h1 strong {
  font-weight: 750;
}

.auth-copy p {
  max-width: 540px;
  margin: 0;
  color: #c2c9d0;
  font-size: 16px;
  line-height: 1.7;
}

.auth-panel {
  display: grid;
  place-items: center;
  padding: 42px;
}

.auth-card {
  width: 100%;
  max-width: 470px;
  padding: 32px;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.auth-logo .brand-symbol {
  flex: 0 0 46px;
}

.auth-logo h2 {
  margin: 0;
  font-size: 24px;
}

.auth-logo p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  margin-bottom: 24px;
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.auth-tab {
  padding: 9px 12px;
  border: 0;
  border-radius: 6px;
  color: var(--muted);
  background: transparent;
  font-size: 13px;
  font-weight: 700;
}

.auth-tab.is-active {
  color: var(--text);
  background: var(--surface-raised);
}

.demo-credentials {
  margin-top: 18px;
  padding: 13px 14px;
  color: var(--muted);
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.65;
}

.demo-credentials strong {
  color: var(--text);
}

.architecture-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.architecture-card {
  padding: 22px;
}

.architecture-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
}

.architecture-card h3 {
  font-size: 17px;
}

.architecture-card p {
  margin-bottom: 14px;
  color: var(--muted);
  line-height: 1.65;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-list span {
  padding: 6px 8px;
  border-radius: 6px;
  color: #c3cbd3;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  font-size: 11px;
}

.loading-line {
  height: 3px;
  overflow: hidden;
  background: var(--surface-soft);
  border-radius: 999px;
}

.loading-line::after {
  content: "";
  display: block;
  width: 40%;
  height: 100%;
  background: var(--accent);
  animation: loading 1.1s infinite ease-in-out;
}

.sidebar-backdrop {
  display: none;
}

@keyframes loading {
  from { transform: translateX(-120%); }
  to { transform: translateX(350%); }
}

@media (max-width: 1199.98px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .operation-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 991.98px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1030;
    display: block;
    background: rgba(0, 0, 0, 0.62);
  }

  .app-content {
    width: 100%;
    margin-left: 0;
  }

  .sidebar-toggle {
    display: inline-flex;
  }

  .dashboard-grid,
  .lab-grid {
    grid-template-columns: 1fr;
  }

  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    min-height: 340px;
    padding: 34px;
  }
}

@media (max-width: 767.98px) {
  .topbar {
    min-height: 68px;
    padding: 10px 16px;
  }

  .topbar h1 {
    font-size: 17px;
  }

  .page-container {
    padding: 20px 16px;
  }

  .metric-grid,
  .operation-selector,
  .architecture-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    min-height: 106px;
  }

  .panel-card {
    padding: 17px;
  }

  .auth-panel {
    padding: 22px 16px;
  }

  .auth-card {
    padding: 24px 20px;
  }

  .auth-visual {
    min-height: 280px;
    padding: 24px;
  }

  .auth-copy p {
    font-size: 14px;
  }

  .result-metric {
    grid-template-columns: 1fr;
  }
}
```

## `frontend/.env.development`

```dotenv
# Conecta el frontend local con el gateway.
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:4000/api
```

## `frontend/.env.production`

```dotenv
# Mantiene GitHub Pages operativo sin backend externo.
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:4000/api
```

## `frontend/index.html`

```html
<!-- Aloja el punto de montaje de la aplicacion Vue. -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="theme-color" content="#121519">
    <meta name="description" content="MiaServicios, plataforma de procesamiento de texto basada en microservicios.">
    <title>MiaServicios</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## `frontend/package.json`

```json
{
  "name": "@miaservicios/frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173",
    "check": "vite build --emptyOutDir"
  },
  "dependencies": {
    "@fortawesome/fontawesome-free": "^6.7.2",
    "axios": "^1.9.0",
    "bootstrap": "4.6.2",
    "pinia": "^3.0.2",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.3",
    "vite": "^6.3.5"
  }
}
```

## `frontend/public/.nojekyll`

```text

```

## `frontend/src/App.vue`

```vue
<!-- Renderiza la vista asociada a la ruta actual. -->
<template>
  <router-view />
</template>
```

## `frontend/src/assets/theme.css`

```css
/* Define el tema oscuro y responsive de la plataforma. */
:root {
  color-scheme: dark;
  --bg: #0f1114;
  --surface: #171a1f;
  --surface-soft: #1d2127;
  --surface-raised: #232830;
  --border: #303740;
  --text: #f4f6f8;
  --muted: #9da6b1;
  --accent: #28b9d2;
  --accent-soft: rgba(40, 185, 210, 0.14);
  --danger: #e16d74;
  --success: #62c48d;
  --warning: #d9b45b;
  --sidebar-width: 264px;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
}

a:hover {
  color: #69d5e7;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-frame {
  min-height: 100vh;
  display: flex;
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1040;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: #12151a;
  border-right: 1px solid var(--border);
  transition: transform 0.25s ease;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 78px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.brand-symbol {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 21px;
}

.brand-title {
  font-size: 20px;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 18px 12px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
  padding: 12px 14px;
  border-radius: 8px;
  color: #bec5cd;
  background: transparent;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}

.sidebar-link i {
  width: 18px;
  color: #7f8995;
  text-align: center;
}

.sidebar-link:hover,
.sidebar-link.router-link-active {
  background: var(--accent-soft);
  color: var(--text);
}

.sidebar-link.router-link-active i {
  color: var(--accent);
}

.sidebar-footer {
  padding: 18px;
  border-top: 1px solid var(--border);
}

.mode-indicator {
  margin-bottom: 13px;
  color: var(--muted);
  font-size: 12px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(98, 196, 141, 0.12);
}

.app-content {
  width: calc(100% - var(--sidebar-width));
  min-height: 100vh;
  margin-left: var(--sidebar-width);
}

.topbar {
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
  background: rgba(15, 17, 20, 0.92);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 1020;
}

.sidebar-toggle {
  display: none;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
}

.topbar-heading {
  flex: 1;
}

.page-eyebrow {
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.topbar h1 {
  margin: 2px 0 0;
  font-size: 21px;
  font-weight: 650;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  color: var(--accent);
  font-weight: 700;
}

.user-data {
  line-height: 1.15;
}

.user-data strong,
.user-data span {
  display: block;
}

.user-data strong {
  font-size: 13px;
}

.user-data span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  text-transform: capitalize;
}

.page-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px;
}

.section-heading {
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 0 0 7px;
  font-size: 24px;
  font-weight: 650;
}

.section-heading p {
  max-width: 760px;
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.panel-card,
.metric-card,
.auth-card,
.operation-card,
.architecture-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.16);
}

.panel-card {
  padding: 22px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-title h2,
.panel-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.metric-card {
  min-height: 126px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.metric-icon {
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 19px;
}

.metric-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.metric-value {
  margin-top: 5px;
  font-size: 28px;
  font-weight: 700;
}

.metric-detail {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
  gap: 20px;
}

.table-dark {
  color: var(--text);
  background: transparent;
}

.table-dark th,
.table-dark td,
.table-dark thead th {
  border-color: var(--border);
}

.table-dark thead th {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.table-dark tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.badge-operation {
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: #78d9e9;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.service-list {
  display: grid;
  gap: 12px;
}

.service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.service-name i {
  color: var(--accent);
}

.service-state {
  color: var(--success);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.form-control,
.custom-select {
  min-height: 44px;
  color: var(--text);
  background: #111419;
  border-color: var(--border);
}

.form-control:focus,
.custom-select:focus {
  color: var(--text);
  background: #111419;
  border-color: var(--accent);
  box-shadow: 0 0 0 0.2rem rgba(40, 185, 210, 0.13);
}

.form-control::placeholder {
  color: #6f7883;
}

textarea.form-control {
  min-height: 260px;
  resize: vertical;
}

label {
  color: #cbd1d8;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  color: #061215;
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 700;
}

.btn-primary:hover,
.btn-primary:focus {
  color: #061215;
  background: #55cbe0;
  border-color: #55cbe0;
}

.btn-outline-light {
  color: #d9dee4;
  border-color: #59616b;
}

.btn-outline-light:hover {
  color: var(--text);
  background: var(--surface-raised);
  border-color: #717b87;
}

.btn-outline-danger {
  color: #ee969b;
  border-color: #7d4146;
}

.btn-outline-danger:hover {
  background: #7d4146;
  border-color: #7d4146;
}

.operation-selector {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.operation-card {
  width: 100%;
  padding: 16px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.operation-card:hover,
.operation-card.is-active {
  transform: translateY(-2px);
  background: var(--surface-soft);
  border-color: var(--accent);
}

.operation-card i {
  margin-bottom: 13px;
  color: var(--accent);
  font-size: 20px;
}

.operation-card strong,
.operation-card span {
  display: block;
}

.operation-card strong {
  font-size: 14px;
}

.operation-card span {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}

.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.result-box {
  min-height: 260px;
  padding: 18px;
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #dce1e6;
  line-height: 1.7;
  white-space: pre-wrap;
}

.result-placeholder {
  min-height: 260px;
  display: grid;
  place-items: center;
  padding: 28px;
  color: var(--muted);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.result-placeholder i {
  display: block;
  margin-bottom: 13px;
  color: #59636e;
  font-size: 34px;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.keyword-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  border: 1px solid rgba(40, 185, 210, 0.22);
  color: #8addec;
  font-size: 12px;
  font-weight: 600;
}

.result-metric {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-metric > div {
  padding: 15px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result-metric span,
.result-metric strong {
  display: block;
}

.result-metric span {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
}

.result-metric strong {
  margin-top: 5px;
  font-size: 18px;
  text-transform: capitalize;
}

.alert-dark-custom {
  color: #d8dde3;
  background: #20242a;
  border: 1px solid var(--border);
}

.alert-danger-custom {
  color: #f2b6ba;
  background: rgba(225, 109, 116, 0.12);
  border: 1px solid rgba(225, 109, 116, 0.34);
}

.empty-state {
  padding: 42px 20px;
  color: var(--muted);
  text-align: center;
}

.empty-state > i {
  margin-bottom: 14px;
  color: #59636e;
  font-size: 34px;
}

.empty-state h3 {
  color: var(--text);
  font-size: 17px;
}

.empty-state p {
  max-width: 520px;
  margin: 8px auto 18px;
}

.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
  background: var(--bg);
}

.auth-visual {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  padding: 54px;
  overflow: hidden;
  background: #f7f8f9;
}

.auth-visual::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 52%, rgba(10, 14, 18, 0.84) 100%);
}

.auth-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.auth-copy {
  position: relative;
  z-index: 1;
  max-width: 620px;
}

.auth-copy h1 {
  margin-bottom: 12px;
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 300;
}

.auth-copy h1 strong {
  font-weight: 750;
}

.auth-copy p {
  max-width: 540px;
  margin: 0;
  color: #c2c9d0;
  font-size: 16px;
  line-height: 1.7;
}

.auth-panel {
  display: grid;
  place-items: center;
  padding: 42px;
}

.auth-card {
  width: 100%;
  max-width: 470px;
  padding: 32px;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.auth-logo .brand-symbol {
  flex: 0 0 46px;
}

.auth-logo h2 {
  margin: 0;
  font-size: 24px;
}

.auth-logo p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  margin-bottom: 24px;
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.auth-tab {
  padding: 9px 12px;
  border: 0;
  border-radius: 6px;
  color: var(--muted);
  background: transparent;
  font-size: 13px;
  font-weight: 700;
}

.auth-tab.is-active {
  color: var(--text);
  background: var(--surface-raised);
}

.demo-credentials {
  margin-top: 18px;
  padding: 13px 14px;
  color: var(--muted);
  background: #111419;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.65;
}

.demo-credentials strong {
  color: var(--text);
}

.architecture-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.architecture-card {
  padding: 22px;
}

.architecture-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
}

.architecture-card h3 {
  font-size: 17px;
}

.architecture-card p {
  margin-bottom: 14px;
  color: var(--muted);
  line-height: 1.65;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-list span {
  padding: 6px 8px;
  border-radius: 6px;
  color: #c3cbd3;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  font-size: 11px;
}

.loading-line {
  height: 3px;
  overflow: hidden;
  background: var(--surface-soft);
  border-radius: 999px;
}

.loading-line::after {
  content: "";
  display: block;
  width: 40%;
  height: 100%;
  background: var(--accent);
  animation: loading 1.1s infinite ease-in-out;
}

.sidebar-backdrop {
  display: none;
}

@keyframes loading {
  from { transform: translateX(-120%); }
  to { transform: translateX(350%); }
}

@media (max-width: 1199.98px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .operation-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 991.98px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1030;
    display: block;
    background: rgba(0, 0, 0, 0.62);
  }

  .app-content {
    width: 100%;
    margin-left: 0;
  }

  .sidebar-toggle {
    display: inline-flex;
  }

  .dashboard-grid,
  .lab-grid {
    grid-template-columns: 1fr;
  }

  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    min-height: 340px;
    padding: 34px;
  }
}

@media (max-width: 767.98px) {
  .topbar {
    min-height: 68px;
    padding: 10px 16px;
  }

  .topbar h1 {
    font-size: 17px;
  }

  .page-container {
    padding: 20px 16px;
  }

  .metric-grid,
  .operation-selector,
  .architecture-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    min-height: 106px;
  }

  .panel-card {
    padding: 17px;
  }

  .auth-panel {
    padding: 22px 16px;
  }

  .auth-card {
    padding: 24px 20px;
  }

  .auth-visual {
    min-height: 280px;
    padding: 24px;
  }

  .auth-copy p {
    font-size: 14px;
  }

  .result-metric {
    grid-template-columns: 1fr;
  }
}
```

## `frontend/src/components/EmptyState.vue`

```vue
<!-- Informa cuando una lista no contiene registros. -->
<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'fa-solid fa-inbox' }
});
</script>

<template>
  <div class="empty-state">
    <i :class="icon"></i>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot></slot>
  </div>
</template>
```

## `frontend/src/components/StatCard.vue`

```vue
<!-- Presenta una metrica principal del panel. -->
<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  detail: { type: String, default: '' },
  icon: { type: String, required: true }
});
</script>

<template>
  <article class="metric-card">
    <div class="metric-icon"><i :class="icon"></i></div>
    <div>
      <div class="metric-label">{{ label }}</div>
      <div class="metric-value">{{ value }}</div>
      <div v-if="detail" class="metric-detail">{{ detail }}</div>
    </div>
  </article>
</template>
```

## `frontend/src/layouts/AppShell.vue`

```vue
<!-- Proporciona la navegacion y el marco privado. -->
<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { platformApi } from '../services/platformApi.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);

const links = [
  { name: 'dashboard', label: 'Panel general', icon: 'fa-solid fa-chart-line' },
  { name: 'text-lab', label: 'Laboratorio IA', icon: 'fa-solid fa-wand-magic-sparkles' },
  { name: 'history', label: 'Historial', icon: 'fa-solid fa-clock-rotate-left' },
  { name: 'architecture', label: 'Arquitectura', icon: 'fa-solid fa-diagram-project' }
];

watch(() => route.fullPath, () => {
  sidebarOpen.value = false;
});

const closeSession = () => {
  auth.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="app-frame">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="app-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="brand-block">
        <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
        <div>
          <div class="brand-title"><strong>Mia</strong>Servicios</div>
          <div class="brand-subtitle">Plataforma de IA</div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegacion principal">
        <router-link
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          class="sidebar-link"
        >
          <i :class="link.icon"></i>
          <span>{{ link.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="mode-indicator">
          <span class="status-dot"></span>
          {{ platformApi.isDemo ? 'Modo GitHub Pages' : 'Microservicios activos' }}
        </div>
        <button type="button" class="btn btn-outline-light btn-sm btn-block" @click="closeSession">
          <i class="fa-solid fa-right-from-bracket mr-2"></i>Cerrar sesion
        </button>
      </div>
    </aside>

    <section class="app-content">
      <header class="topbar">
        <button type="button" class="btn sidebar-toggle" aria-label="Abrir menu" @click="sidebarOpen = true">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="topbar-heading">
          <div class="page-eyebrow">MiaServicios</div>
          <h1>{{ $route.meta.title || 'Plataforma' }}</h1>
        </div>
        <div class="user-chip">
          <div class="user-avatar">{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'M' }}</div>
          <div class="user-data d-none d-sm-block">
            <strong>{{ auth.user?.name }}</strong>
            <span>{{ auth.user?.role }}</span>
          </div>
        </div>
      </header>

      <main class="page-container">
        <slot></slot>
      </main>
    </section>
  </div>
</template>
```

## `frontend/src/main.js`

```javascript
// Inicializa Vue, Pinia, rutas y estilos globales.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/theme.css';
import App from './App.vue';
import router from './router/index.js';

createApp(App).use(createPinia()).use(router).mount('#app');
```

## `frontend/src/router/index.js`

```javascript
// Define las rutas compatibles con GitHub Pages.
import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import TextLabView from '../views/TextLabView.vue';
import HistoryView from '../views/HistoryView.vue';
import ArchitectureView from '../views/ArchitectureView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, title: 'Acceso' } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, title: 'Panel general' } },
    { path: '/laboratorio', name: 'text-lab', component: TextLabView, meta: { requiresAuth: true, title: 'Laboratorio IA' } },
    { path: '/historial', name: 'history', component: HistoryView, meta: { requiresAuth: true, title: 'Historial' } },
    { path: '/arquitectura', name: 'architecture', component: ArchitectureView, meta: { requiresAuth: true, title: 'Arquitectura' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.authenticated) {
    return { name: 'login' };
  }

  if (to.meta.guestOnly && auth.authenticated) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
```

## `frontend/src/services/demoRepository.js`

```javascript
// Simula autenticacion e historial para GitHub Pages.
import { executeLocalAi } from './localAi.js';

const usersKey = 'mia_demo_users';
const sessionKey = 'mia_demo_session';
const historyKey = 'mia_demo_history';

const defaultUser = {
  id: 'demo-user',
  name: 'Usuario Demo',
  email: 'demo@mia.local',
  password: 'demo12345',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z'
};

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const users = () => {
  const current = read(usersKey, []);
  return current.some((user) => user.email === defaultUser.email) ? current : [defaultUser, ...current];
};

const publicUser = ({ password, ...user }) => user;

export const demoLogin = async ({ email, password }) => {
  const user = users().find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);

  if (!user) {
    throw new Error('Correo o contrasena incorrectos.');
  }

  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoRegister = async ({ name, email, password }) => {
  const current = users();

  if (current.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('El correo ya se encuentra registrado.');
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  write(usersKey, [...current.filter((item) => item.email !== defaultUser.email), user]);
  const session = { token: `demo-${user.id}`, user: publicUser(user) };
  write(sessionKey, session);
  return session;
};

export const demoSession = () => read(sessionKey, null);
export const demoLogout = () => localStorage.removeItem(sessionKey);

export const demoRunOperation = async (type, payload) => {
  const session = demoSession();

  if (!session) {
    throw new Error('La sesion no se encuentra activa.');
  }

  const response = executeLocalAi(type, payload);
  const operation = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    type,
    inputPreview: payload.text.replace(/\s+/g, ' ').slice(0, 240),
    inputLength: payload.text.length,
    result: response.result,
    processingMs: response.processingMs,
    createdAt: new Date().toISOString()
  };
  const history = read(historyKey, []);
  write(historyKey, [operation, ...history]);

  return { ...response, operationId: operation.id };
};

export const demoHistory = async () => {
  const session = demoSession();
  const items = read(historyKey, []).filter((item) => item.userId === session?.user.id);
  return { items, total: items.length, limit: items.length, offset: 0 };
};

export const demoStats = async () => {
  const { items } = await demoHistory();
  const grouped = items.reduce((map, item) => {
    const current = map.get(item.type) || { type: item.type, total: 0, processing: 0 };
    current.total += 1;
    current.processing += item.processingMs;
    map.set(item.type, current);
    return map;
  }, new Map());

  return {
    total: items.length,
    items: [...grouped.values()].map((item) => ({
      type: item.type,
      total: item.total,
      averageMs: Number((item.processing / item.total).toFixed(2))
    }))
  };
};

export const demoDeleteHistory = async (id) => {
  const session = demoSession();
  const history = read(historyKey, []);
  write(historyKey, history.filter((item) => item.id !== id || item.userId !== session?.user.id));
};
```

## `frontend/src/services/localAi.js`

```javascript
// Ejecuta analisis NLP directamente en el navegador.
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
  'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor'
]);

const negativeWords = new Set([
  'alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento',
  'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'roto', 'vulnerable', 'incidente',
  'queja', 'deficiente', 'costoso', 'bloqueo', 'inestable', 'grave'
]);

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
const sentencesFrom = (text) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const frequencyMap = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());

const summarize = (text, sentenceLimit = 3) => {
  const sentences = sentencesFrom(text);

  if (sentences.length <= sentenceLimit) {
    return { summary: text.trim(), originalCharacters: text.length };
  }

  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalized = new Map([...frequencies.entries()].map(([word, count]) => [word, count / maximum]));
  const selected = sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const density = words.reduce((sum, word) => sum + (normalized.get(word) || 0), 0);
    return { sentence, index, score: density / Math.max(words.length, 1) + (index === 0 ? 0.25 : 0) };
  }).sort((left, right) => right.score - left.score)
    .slice(0, sentenceLimit)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(' ');

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

  return {
    label: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral',
    score: normalizedScore,
    positiveMatches,
    negativeMatches
  };
};

const keywords = (text, limit = 8) => ({
  keywords: [...frequencyMap(relevantWords(text)).entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
});

const classify = (text) => {
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

export const executeLocalAi = (type, payload) => {
  const startedAt = performance.now();
  const operations = {
    summarize: () => summarize(payload.text, payload.sentences),
    sentiment: () => sentiment(payload.text),
    keywords: () => keywords(payload.text, payload.limit),
    classify: () => classify(payload.text)
  };

  if (!operations[type]) {
    throw new Error('Operacion no disponible.');
  }

  return {
    result: operations[type](),
    processingMs: Number((performance.now() - startedAt).toFixed(2)),
    engine: 'mia-nlp-browser-1.0'
  };
};
```

## `frontend/src/services/platformApi.js`

```javascript
// Unifica el acceso al backend y al modo demostracion.
import axios from 'axios';
import {
  demoDeleteHistory,
  demoHistory,
  demoLogin,
  demoLogout,
  demoRegister,
  demoRunOperation,
  demoSession,
  demoStats
} from './demoRepository.js';

const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
const sessionStorageKey = 'mia_remote_session';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
});

const remoteSession = () => {
  try {
    return JSON.parse(localStorage.getItem(sessionStorageKey));
  } catch {
    return null;
  }
};

client.interceptors.request.use((config) => {
  const token = remoteSession()?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const messageFrom = (error) => error.response?.data?.message || error.message || 'No fue posible completar la solicitud.';

const remoteCall = async (action) => {
  try {
    return await action();
  } catch (error) {
    throw new Error(messageFrom(error));
  }
};

export const platformApi = {
  isDemo: demoMode,
  session: () => demoMode ? demoSession() : remoteSession(),
  login: async (credentials) => {
    if (demoMode) return demoLogin(credentials);
    const { data } = await remoteCall(() => client.post('/auth/login', credentials));
    localStorage.setItem(sessionStorageKey, JSON.stringify(data));
    return data;
  },
  register: async (payload) => {
    if (demoMode) return demoRegister(payload);
    const { data } = await remoteCall(() => client.post('/auth/register', payload));
    localStorage.setItem(sessionStorageKey, JSON.stringify(data));
    return data;
  },
  logout: () => {
    demoMode ? demoLogout() : localStorage.removeItem(sessionStorageKey);
  },
  runOperation: async (type, payload) => {
    if (demoMode) return demoRunOperation(type, payload);
    const { data } = await remoteCall(() => client.post(`/ai/${type}`, payload));
    return data;
  },
  history: async () => {
    if (demoMode) return demoHistory();
    const { data } = await remoteCall(() => client.get('/history'));
    return data;
  },
  stats: async () => {
    if (demoMode) return demoStats();
    const { data } = await remoteCall(() => client.get('/history/stats'));
    return data;
  },
  deleteHistory: async (id) => {
    if (demoMode) return demoDeleteHistory(id);
    await remoteCall(() => client.delete(`/history/${id}`));
  },
  health: async () => {
    if (demoMode) {
      return { service: 'frontend-static', status: 'ok', services: { auth: 'local', ai: 'local', history: 'local' } };
    }

    const baseUrl = client.defaults.baseURL.replace(/\/api\/?$/, '');
    const { data } = await remoteCall(() => axios.get(`${baseUrl}/health`, { timeout: 5000 }));
    return data;
  }
};
```

## `frontend/src/stores/auth.js`

```javascript
// Mantiene la sesion activa de la plataforma.
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { platformApi } from '../services/platformApi.js';

export const useAuthStore = defineStore('auth', () => {
  const session = ref(platformApi.session());
  const loading = ref(false);
  const error = ref('');

  const user = computed(() => session.value?.user || null);
  const authenticated = computed(() => Boolean(session.value?.token));

  const execute = async (action) => {
    loading.value = true;
    error.value = '';

    try {
      session.value = await action();
      return true;
    } catch (exception) {
      error.value = exception.message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const login = (credentials) => execute(() => platformApi.login(credentials));
  const register = (payload) => execute(() => platformApi.register(payload));

  const logout = () => {
    platformApi.logout();
    session.value = null;
    error.value = '';
  };

  return { session, user, authenticated, loading, error, login, register, logout };
});
```

## `frontend/src/views/ArchitectureView.vue`

```vue
<!-- Documenta los componentes tecnicos del proyecto. -->
<script setup>
import AppShell from '../layouts/AppShell.vue';
import { platformApi } from '../services/platformApi.js';

const components = [
  {
    title: 'Frontend web',
    icon: 'fa-solid fa-display',
    description: 'Interfaz Vue 3 compilada como sitio estatico en la carpeta docs, con rutas hash para compatibilidad directa con GitHub Pages.',
    technologies: ['Vue 3', 'Vite', 'Pinia', 'Bootstrap 4.6', 'Font Awesome']
  },
  {
    title: 'API Gateway',
    icon: 'fa-solid fa-network-wired',
    description: 'Punto de entrada Node.js que valida sesiones, aplica limites de solicitud y coordina autenticacion, procesamiento e historial.',
    technologies: ['Node.js', 'Express', 'Helmet', 'Rate Limit', 'Fetch API']
  },
  {
    title: 'Servicio de autenticacion',
    icon: 'fa-solid fa-user-shield',
    description: 'Gestiona usuarios, contrasenas cifradas y tokens JWT. La persistencia se mantiene en una base SQLite independiente.',
    technologies: ['JWT', 'bcryptjs', 'SQLite', 'Zod']
  },
  {
    title: 'Servicio NLP',
    icon: 'fa-solid fa-brain',
    description: 'Procesa texto localmente mediante puntuacion estadistica y reglas linguisticas, sin consumir APIs comerciales ni generar costos por solicitud.',
    technologies: ['Resumen', 'Sentimiento', 'Keywords', 'Clasificacion']
  },
  {
    title: 'Servicio de historial',
    icon: 'fa-solid fa-database',
    description: 'Registra resultados, tiempos de proceso y metadatos por usuario en una base SQLite separada del servicio de identidad.',
    technologies: ['SQLite', 'WAL', 'REST', 'Persistencia local']
  },
  {
    title: 'Modo GitHub Pages',
    icon: 'fa-brands fa-github',
    description: 'La compilacion publica utiliza un adaptador local en el navegador para conservar login, procesamiento e historial cuando no existe backend remoto.',
    technologies: ['LocalStorage', 'Web Crypto', 'SPA estatica', 'Costo cero']
  }
];
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Arquitectura de la solucion</h2>
      <p>El repositorio admite dos modos: microservicios Node.js para ejecucion completa y adaptador local para la publicacion estatica en GitHub Pages.</p>
    </div>

    <div class="alert alert-dark-custom mb-4">
      <strong>Modo actual: {{ platformApi.isDemo ? 'GitHub Pages estatico' : 'Microservicios Node.js' }}</strong>
      <div class="small mt-2 text-muted">No se requiere una licencia comercial ni una API de inteligencia artificial de pago.</div>
    </div>

    <section class="architecture-grid">
      <article v-for="component in components" :key="component.title" class="architecture-card">
        <div class="architecture-icon"><i :class="component.icon"></i></div>
        <h3>{{ component.title }}</h3>
        <p>{{ component.description }}</p>
        <div class="tech-list">
          <span v-for="technology in component.technologies" :key="technology">{{ technology }}</span>
        </div>
      </article>
    </section>
  </AppShell>
</template>
```

## `frontend/src/views/DashboardView.vue`

```vue
<!-- Presenta metricas, actividad y estado de servicios. -->
<script setup>
import { computed, onMounted, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import EmptyState from '../components/EmptyState.vue';
import StatCard from '../components/StatCard.vue';
import { platformApi } from '../services/platformApi.js';

const loading = ref(true);
const error = ref('');
const history = ref([]);
const stats = ref({ total: 0, items: [] });
const health = ref({ services: {} });

const operationLabels = {
  summarize: 'Resumen',
  sentiment: 'Sentimiento',
  keywords: 'Palabras clave',
  classify: 'Clasificacion'
};

const averageMs = computed(() => {
  const total = stats.value.items.reduce((sum, item) => sum + item.averageMs * item.total, 0);
  return stats.value.total ? (total / stats.value.total).toFixed(2) : '0.00';
});

const primaryOperation = computed(() => {
  const first = [...stats.value.items].sort((left, right) => right.total - left.total)[0];
  return first ? operationLabels[first.type] : 'Sin datos';
});

const serviceCount = computed(() => Object.keys(health.value.services || {}).length || 3);

const formatDate = (value) => new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(value));

const loadDashboard = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [historyResponse, statsResponse, healthResponse] = await Promise.all([
      platformApi.history(),
      platformApi.stats(),
      platformApi.health()
    ]);
    history.value = historyResponse.items.slice(0, 6);
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
    <div class="section-heading">
      <h2>Resumen operativo</h2>
      <p>Vista consolidada del uso de las funciones NLP, rendimiento del motor y disponibilidad de los componentes.</p>
    </div>

    <div v-if="loading" class="loading-line mb-4"></div>
    <div v-if="error" class="alert alert-danger-custom">{{ error }}</div>

    <section class="metric-grid">
      <StatCard label="Operaciones" :value="stats.total" detail="Procesamientos registrados" icon="fa-solid fa-layer-group" />
      <StatCard label="Tiempo promedio" :value="`${averageMs} ms`" detail="Ejecucion local del motor" icon="fa-solid fa-gauge-high" />
      <StatCard label="Funcion principal" :value="primaryOperation" detail="Operacion mas utilizada" icon="fa-solid fa-ranking-star" />
      <StatCard label="Componentes" :value="serviceCount" detail="Servicios supervisados" icon="fa-solid fa-server" />
    </section>

    <section class="dashboard-grid">
      <article class="panel-card">
        <div class="panel-title">
          <h2>Actividad reciente</h2>
          <router-link :to="{ name: 'history' }" class="btn btn-outline-light btn-sm">Ver historial</router-link>
        </div>

        <div v-if="history.length" class="table-responsive">
          <table class="table table-dark mb-0">
            <thead>
              <tr>
                <th>Operacion</th>
                <th>Entrada</th>
                <th>Tiempo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history" :key="item.id">
                <td><span class="badge-operation">{{ operationLabels[item.type] }}</span></td>
                <td>{{ item.inputPreview }}</td>
                <td>{{ item.processingMs }} ms</td>
                <td>{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <EmptyState
          v-else-if="!loading"
          title="Todavia no hay actividad"
          description="Ejecute una operacion en el laboratorio para generar la primera entrada del historial."
          icon="fa-solid fa-chart-column"
        >
          <router-link :to="{ name: 'text-lab' }" class="btn btn-primary btn-sm">Abrir laboratorio</router-link>
        </EmptyState>
      </article>

      <aside class="panel-card">
        <div class="panel-title">
          <h3>Estado de plataforma</h3>
        </div>
        <div class="service-list">
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-shield-halved"></i>Autenticacion</div>
            <div class="service-state">{{ health.services?.auth || 'local' }}</div>
          </div>
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-brain"></i>Motor NLP</div>
            <div class="service-state">{{ health.services?.ai || 'local' }}</div>
          </div>
          <div class="service-row">
            <div class="service-name"><i class="fa-solid fa-database"></i>Historial</div>
            <div class="service-state">{{ health.services?.history || 'local' }}</div>
          </div>
        </div>

        <div class="alert alert-dark-custom mt-4 mb-0">
          <strong>{{ platformApi.isDemo ? 'Modo estatico' : 'Modo microservicios' }}</strong>
          <div class="small mt-2 text-muted">
            {{ platformApi.isDemo ? 'Los datos permanecen en el almacenamiento local del navegador.' : 'El gateway orquesta servicios independientes con persistencia SQLite.' }}
          </div>
        </div>
      </aside>
    </section>
  </AppShell>
</template>
```

## `frontend/src/views/HistoryView.vue`

```vue
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
```

## `frontend/src/views/LoginView.vue`

```vue
<!-- Gestiona el acceso y registro de usuarios. -->
<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { platformApi } from '../services/platformApi.js';

const router = useRouter();
const baseUrl = import.meta.env.BASE_URL;
const auth = useAuthStore();
const mode = ref('login');
const form = reactive({
  name: '',
  email: 'demo@mia.local',
  password: 'demo12345'
});

const heading = computed(() => mode.value === 'login' ? 'Acceso a la plataforma' : 'Crear una cuenta');
const submitLabel = computed(() => mode.value === 'login' ? 'Ingresar' : 'Registrar cuenta');

const changeMode = (value) => {
  mode.value = value;
  auth.error = '';
};

const submit = async () => {
  const successful = mode.value === 'login'
    ? await auth.login({ email: form.email, password: form.password })
    : await auth.register({ name: form.name, email: form.email, password: form.password });

  if (successful) {
    router.push({ name: 'dashboard' });
  }
};
</script>

<template>
  <div class="auth-page">
    <section class="auth-visual">
      <img :src="`${baseUrl}brand/miaservicios-cover.png`" alt="Identidad visual de MiaServicios">
      <div class="auth-copy">
        <h1><strong>Mia</strong>Servicios</h1>
        <p>Procesamiento de lenguaje, autenticacion e historial mediante una arquitectura modular preparada para operar sin servicios de pago.</p>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
          <div>
            <h2>{{ heading }}</h2>
            <p>{{ platformApi.isDemo ? 'Ejecucion estatica con datos locales' : 'Conexion con microservicios Node.js' }}</p>
          </div>
        </div>

        <div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'login' }" @click="changeMode('login')">
            Iniciar sesion
          </button>
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'register' }" @click="changeMode('register')">
            Registrarse
          </button>
        </div>

        <div v-if="auth.error" class="alert alert-danger-custom" role="alert">
          {{ auth.error }}
        </div>

        <form @submit.prevent="submit">
          <div v-if="mode === 'register'" class="form-group">
            <label for="name">Nombre completo</label>
            <input id="name" v-model.trim="form.name" type="text" class="form-control" minlength="2" maxlength="80" required>
          </div>

          <div class="form-group">
            <label for="email">Correo electronico</label>
            <input id="email" v-model.trim="form.email" type="email" class="form-control" autocomplete="email" required>
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input id="password" v-model="form.password" type="password" class="form-control" minlength="8" maxlength="72" autocomplete="current-password" required>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading">
            <i :class="auth.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-arrow-right-to-bracket'" class="mr-2"></i>
            {{ auth.loading ? 'Procesando' : submitLabel }}
          </button>
        </form>

        <div v-if="mode === 'login'" class="demo-credentials">
          <strong>Acceso inicial</strong><br>
          Correo: demo@mia.local<br>
          Contrasena: demo12345
        </div>
      </div>
    </section>
  </div>
</template>
```

## `frontend/src/views/TextLabView.vue`

```vue
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
```

## `frontend/vite.config.js`

```javascript
// Configura Vite y genera la aplicacion en docs.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
```

## `package.json`

```json
{
  "name": "miaservicios-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "services/*"
  ],
  "scripts": {
    "dev": "concurrently --kill-others-on-fail --names gateway,auth,ai,history,web \"npm run dev --workspace=@miaservicios/api-gateway\" \"npm run dev --workspace=@miaservicios/auth-service\" \"npm run dev --workspace=@miaservicios/ai-service\" \"npm run dev --workspace=@miaservicios/history-service\" \"npm run dev --workspace=@miaservicios/frontend\"",
    "dev:backend": "concurrently --kill-others-on-fail --names gateway,auth,ai,history \"npm run dev --workspace=@miaservicios/api-gateway\" \"npm run dev --workspace=@miaservicios/auth-service\" \"npm run dev --workspace=@miaservicios/ai-service\" \"npm run dev --workspace=@miaservicios/history-service\"",
    "build": "npm run build --workspace=@miaservicios/frontend",
    "preview": "npm run preview --workspace=@miaservicios/frontend",
    "start": "concurrently --kill-others-on-fail --names gateway,auth,ai,history \"npm run start --workspace=@miaservicios/api-gateway\" \"npm run start --workspace=@miaservicios/auth-service\" \"npm run start --workspace=@miaservicios/ai-service\" \"npm run start --workspace=@miaservicios/history-service\"",
    "check": "npm run check --workspaces --if-present",
    "test": "node tests/nlp-smoke.mjs"
  },
  "devDependencies": {
    "concurrently": "^9.1.2"
  },
  "engines": {
    "node": ">=22.18.0",
    "npm": ">=10.0.0"
  }
}
```

## `services/ai-service/.env.example`

```dotenv
# Configura el servicio local de procesamiento de texto.
PORT=4002
```

## `services/ai-service/package.json`

```json
{
  "name": "@miaservicios/ai-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js && node --check src/nlp.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "helmet": "^8.1.0",
    "zod": "^3.25.0"
  }
}
```

## `services/ai-service/src/nlp.js`

```javascript
// Implementa utilidades locales de procesamiento de lenguaje.
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
  'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor'
]);

const negativeWords = new Set([
  'alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento',
  'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'roto', 'vulnerable', 'incidente',
  'queja', 'deficiente', 'costoso', 'bloqueo', 'inestable', 'grave'
]);

const categoryRules = {
  tecnologia: ['api', 'aplicacion', 'codigo', 'datos', 'digital', 'microservicio', 'nube', 'software', 'sistema', 'tecnologia'],
  finanzas: ['banco', 'costo', 'credito', 'dinero', 'factura', 'finanzas', 'ganancia', 'inversion', 'pago', 'presupuesto'],
  operaciones: ['calidad', 'cliente', 'entrega', 'inventario', 'logistica', 'operacion', 'proceso', 'produccion', 'servicio', 'transporte'],
  seguridad: ['acceso', 'amenaza', 'auditoria', 'cifrado', 'incidente', 'riesgo', 'seguridad', 'vulnerabilidad', 'token', 'fraude'],
  recursos_humanos: ['capacitacion', 'colaborador', 'desempeno', 'empleado', 'equipo', 'liderazgo', 'persona', 'personal', 'talento', 'trabajador']
};

const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const wordsFrom = (text) => normalize(text).match(/[a-z0-9]+/g) || [];

const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));

const sentencesFrom = (text) => text
  .replace(/\s+/g, ' ')
  .trim()
  .split(/(?<=[.!?])\s+/)
  .filter(Boolean);

const frequencyMap = (words) => words.reduce((map, word) => {
  map.set(word, (map.get(word) || 0) + 1);
  return map;
}, new Map());

export const summarizeText = (text, sentenceLimit = 3) => {
  const sentences = sentencesFrom(text);

  if (sentences.length <= sentenceLimit) {
    return text.trim();
  }

  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalizedFrequencies = new Map(
    [...frequencies.entries()].map(([word, count]) => [word, count / maximum])
  );

  const scored = sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const density = words.reduce((total, word) => total + (normalizedFrequencies.get(word) || 0), 0);
    const positionBoost = index === 0 ? 0.25 : index === sentences.length - 1 ? 0.1 : 0;
    return { index, sentence, score: density / Math.max(words.length, 1) + positionBoost };
  });

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, sentenceLimit)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(' ');
};

export const analyzeSentiment = (text) => {
  const words = wordsFrom(text);
  let score = 0;
  let positive = 0;
  let negative = 0;

  words.forEach((word, index) => {
    const previous = words[index - 1];
    const multiplier = previous === 'no' || previous === 'nunca' ? -1 : 1;

    if (positiveWords.has(word)) {
      score += multiplier;
      positive += multiplier > 0 ? 1 : 0;
      negative += multiplier < 0 ? 1 : 0;
    }

    if (negativeWords.has(word)) {
      score -= multiplier;
      negative += multiplier > 0 ? 1 : 0;
      positive += multiplier < 0 ? 1 : 0;
    }
  });

  const matches = positive + negative;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;
  const label = normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral';

  return { label, score: normalizedScore, positiveMatches: positive, negativeMatches: negative };
};

export const extractKeywords = (text, limit = 8) => {
  const frequencies = frequencyMap(relevantWords(text));

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

export const classifyText = (text) => {
  const words = wordsFrom(text);
  const scores = Object.entries(categoryRules).map(([category, terms]) => {
    const score = terms.reduce((total, term) => total + words.filter((word) => word === term).length, 0);
    return { category, score };
  }).sort((left, right) => right.score - left.score);

  const winner = scores[0];
  const total = scores.reduce((sum, item) => sum + item.score, 0);

  if (!winner || winner.score === 0) {
    return { category: 'general', confidence: 0.25, scores };
  }

  return {
    category: winner.category,
    confidence: Number(Math.min(0.98, 0.45 + winner.score / Math.max(total, 1) * 0.5).toFixed(2)),
    scores
  };
};
```

## `services/ai-service/src/server.js`

```javascript
// Expone operaciones NLP sin dependencias de pago.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { analyzeSentiment, classifyText, extractKeywords, summarizeText } from './nlp.js';

const app = express();
const port = Number(process.env.PORT || 4002);

const textSchema = z.object({
  text: z.string().trim().min(20).max(12000)
});

const summarySchema = textSchema.extend({
  sentences: z.number().int().min(1).max(8).default(3)
});

const keywordSchema = textSchema.extend({
  limit: z.number().int().min(3).max(20).default(8)
});

const execute = (schema, operation) => (request, response) => {
  const validation = schema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'El texto debe contener entre 20 y 12000 caracteres.' });
  }

  const startedAt = performance.now();
  const result = operation(validation.data);

  return response.json({
    result,
    processingMs: Number((performance.now() - startedAt).toFixed(2)),
    engine: 'mia-nlp-local-1.0'
  });
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'ai-service', status: 'ok', engine: 'mia-nlp-local-1.0' });
});

app.post('/summarize', execute(summarySchema, ({ text, sentences }) => ({
  summary: summarizeText(text, sentences),
  originalCharacters: text.length
})));

app.post('/sentiment', execute(textSchema, ({ text }) => analyzeSentiment(text)));

app.post('/keywords', execute(keywordSchema, ({ text, limit }) => ({ keywords: extractKeywords(text, limit) })));

app.post('/classify', execute(textSchema, ({ text }) => classifyText(text)));

app.use((error, request, response, next) => {
  response.status(500).json({ message: 'No fue posible procesar el texto.' });
});

app.listen(port, () => {
  console.log(`ai-service activo en http://localhost:${port}`);
});
```

## `services/api-gateway/.env.example`

```dotenv
# Configura el gateway y sus servicios internos.
PORT=4000
AUTH_SERVICE_URL=http://localhost:4001
AI_SERVICE_URL=http://localhost:4002
HISTORY_SERVICE_URL=http://localhost:4003
SERVICE_KEY=mia-internal-local-service-key
CORS_ORIGIN=http://localhost:5173
```

## `services/api-gateway/package.json`

```json
{
  "name": "@miaservicios/api-gateway",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0"
  }
}
```

## `services/api-gateway/src/server.js`

```javascript
// Centraliza autenticacion, IA e historial.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT || 4000);
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4002';
const historyServiceUrl = process.env.HISTORY_SERVICE_URL || 'http://localhost:4003';
const serviceKey = process.env.SERVICE_KEY || 'mia-internal-local-service-key';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

class ServiceError extends Error {
  constructor(status, payload) {
    super(payload?.message || 'Servicio no disponible.');
    this.status = status;
    this.payload = payload;
  }
}

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...options.headers
    },
    signal: AbortSignal.timeout(7000)
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ServiceError(response.status, payload);
  }

  return payload;
};

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const authenticate = asyncRoute(async (request, response, next) => {
  const authorization = request.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Token de acceso requerido.' });
  }

  const verification = await requestJson(`${authServiceUrl}/internal/verify`, {
    method: 'POST',
    headers: { authorization }
  });

  request.user = verification.user;
  return next();
});

const proxyAuth = (path) => asyncRoute(async (request, response) => {
  const payload = await requestJson(`${authServiceUrl}${path}`, {
    method: 'POST',
    body: JSON.stringify(request.body)
  });

  response.status(path === '/register' ? 201 : 200).json(payload);
});

const runAiOperation = (type) => asyncRoute(async (request, response) => {
  const aiResponse = await requestJson(`${aiServiceUrl}/${type}`, {
    method: 'POST',
    body: JSON.stringify(request.body)
  });

  const operation = {
    id: crypto.randomUUID(),
    userId: request.user.sub,
    type,
    inputPreview: String(request.body.text || '').replace(/\s+/g, ' ').slice(0, 240),
    inputLength: String(request.body.text || '').length,
    result: aiResponse.result,
    processingMs: aiResponse.processingMs,
    createdAt: new Date().toISOString()
  };

  await requestJson(`${historyServiceUrl}/internal/operations`, {
    method: 'POST',
    headers: { 'x-service-key': serviceKey },
    body: JSON.stringify(operation)
  });

  response.json({ ...aiResponse, operationId: operation.id });
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json({ limit: '64kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', asyncRoute(async (request, response) => {
  const services = await Promise.allSettled([
    requestJson(`${authServiceUrl}/health`),
    requestJson(`${aiServiceUrl}/health`),
    requestJson(`${historyServiceUrl}/health`)
  ]);

  const names = ['auth', 'ai', 'history'];
  const status = Object.fromEntries(services.map((result, index) => [
    names[index],
    result.status === 'fulfilled' ? 'ok' : 'error'
  ]));

  response.status(Object.values(status).every((value) => value === 'ok') ? 200 : 503).json({
    service: 'api-gateway',
    status: Object.values(status).every((value) => value === 'ok') ? 'ok' : 'degraded',
    services: status
  });
}));

app.post('/api/auth/register', proxyAuth('/register'));
app.post('/api/auth/login', proxyAuth('/login'));

app.get('/api/auth/me', authenticate, asyncRoute(async (request, response) => {
  const payload = await requestJson(`${authServiceUrl}/me`, {
    headers: { authorization: request.headers.authorization }
  });

  response.json(payload);
}));

app.post('/api/ai/summarize', authenticate, runAiOperation('summarize'));
app.post('/api/ai/sentiment', authenticate, runAiOperation('sentiment'));
app.post('/api/ai/keywords', authenticate, runAiOperation('keywords'));
app.post('/api/ai/classify', authenticate, runAiOperation('classify'));

app.get('/api/history', authenticate, asyncRoute(async (request, response) => {
  const query = new URLSearchParams({
    limit: String(request.query.limit || 25),
    offset: String(request.query.offset || 0)
  });
  const payload = await requestJson(`${historyServiceUrl}/operations?${query}`, {
    headers: { 'x-user-id': request.user.sub }
  });

  response.json(payload);
}));

app.get('/api/history/stats', authenticate, asyncRoute(async (request, response) => {
  const payload = await requestJson(`${historyServiceUrl}/stats`, {
    headers: { 'x-user-id': request.user.sub }
  });

  response.json(payload);
}));

app.delete('/api/history/:id', authenticate, asyncRoute(async (request, response) => {
  await requestJson(`${historyServiceUrl}/operations/${request.params.id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': request.user.sub }
  });

  response.status(204).send();
}));

app.use((error, request, response, next) => {
  if (error instanceof ServiceError) {
    return response.status(error.status).json(error.payload);
  }

  if (error?.name === 'TimeoutError') {
    return response.status(504).json({ message: 'Un servicio excedio el tiempo de respuesta.' });
  }

  return response.status(500).json({ message: 'No fue posible completar la solicitud.' });
});

app.listen(port, () => {
  console.log(`api-gateway activo en http://localhost:${port}`);
});
```

## `services/auth-service/.env.example`

```dotenv
# Configura el servicio de autenticacion.
PORT=4001
JWT_SECRET=change-this-local-secret-with-at-least-32-characters
DATABASE_FILE=./data/auth.db
```

## `services/auth-service/package.json`

```json
{
  "name": "@miaservicios/auth-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js && node --check src/database.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "better-sqlite3": "^11.10.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.25.0"
  }
}
```

## `services/auth-service/src/database.js`

```javascript
// Gestiona la persistencia SQLite de usuarios.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDir, '../data/auth.db');
const databaseFile = path.resolve(process.cwd(), process.env.DATABASE_FILE || defaultFile);

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );
`);

const seedDemoUser = () => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mia.local');

  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'Usuario Demo',
      'demo@mia.local',
      bcrypt.hashSync('demo12345', 12),
      'admin',
      new Date().toISOString()
    );
  }
};

seedDemoUser();

export const findUserByEmail = (email) => db.prepare(`
  SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt
  FROM users
  WHERE email = ?
`).get(email);

export const findUserById = (id) => db.prepare(`
  SELECT id, name, email, role, created_at AS createdAt
  FROM users
  WHERE id = ?
`).get(id);

export const createUser = ({ id, name, email, passwordHash, role = 'user', createdAt }) => {
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, passwordHash, role, createdAt);

  return findUserById(id);
};
```

## `services/auth-service/src/server.js`

```javascript
// Expone registro, login y validacion JWT.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createUser, findUserByEmail, findUserById } from './database.js';

const app = express();
const port = Number(process.env.PORT || 4001);
const jwtSecret = process.env.JWT_SECRET || 'mia-local-development-secret-32-characters-minimum';

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72)
});

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80)
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const issueToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role, name: user.name },
  jwtSecret,
  { expiresIn: '8h', issuer: 'miaservicios-auth' }
);

const readBearerToken = (request) => {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
};

const authenticate = (request, response, next) => {
  try {
    const token = readBearerToken(request);

    if (!token) {
      return response.status(401).json({ message: 'Token de acceso requerido.' });
    }

    request.auth = jwt.verify(token, jwtSecret, { issuer: 'miaservicios-auth' });
    return next();
  } catch {
    return response.status(401).json({ message: 'Token de acceso invalido o vencido.' });
  }
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'auth-service', status: 'ok' });
});

app.post('/register', async (request, response) => {
  const validation = registrationSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'Los datos de registro no son validos.' });
  }

  const { name, email, password } = validation.data;

  if (findUserByEmail(email)) {
    return response.status(409).json({ message: 'El correo ya se encuentra registrado.' });
  }

  const user = createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString()
  });

  return response.status(201).json({ token: issueToken(user), user: publicUser(user) });
});

app.post('/login', async (request, response) => {
  const validation = credentialsSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'Credenciales no validas.' });
  }

  const user = findUserByEmail(validation.data.email);
  const validPassword = user && await bcrypt.compare(validation.data.password, user.passwordHash);

  if (!validPassword) {
    return response.status(401).json({ message: 'Correo o contrasena incorrectos.' });
  }

  return response.json({ token: issueToken(user), user: publicUser(user) });
});

app.get('/me', authenticate, (request, response) => {
  const user = findUserById(request.auth.sub);

  if (!user) {
    return response.status(404).json({ message: 'Usuario no encontrado.' });
  }

  return response.json({ user: publicUser(user) });
});

app.post('/internal/verify', authenticate, (request, response) => {
  response.json({ user: request.auth });
});

app.use((error, request, response, next) => {
  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return response.status(409).json({ message: 'El correo ya se encuentra registrado.' });
  }

  return response.status(500).json({ message: 'No fue posible procesar la solicitud.' });
});

app.listen(port, () => {
  console.log(`auth-service activo en http://localhost:${port}`);
});
```

## `services/history-service/.env.example`

```dotenv
# Configura el servicio de historial.
PORT=4003
DATABASE_FILE=./data/history.db
SERVICE_KEY=mia-internal-local-service-key
```

## `services/history-service/package.json`

```json
{
  "name": "@miaservicios/history-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js && node --check src/database.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.10.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "helmet": "^8.1.0",
    "zod": "^3.25.0"
  }
}
```

## `services/history-service/src/database.js`

```javascript
// Gestiona la persistencia SQLite del historial.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDir, '../data/history.db');
const databaseFile = path.resolve(process.cwd(), process.env.DATABASE_FILE || defaultFile);

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    input_preview TEXT NOT NULL,
    input_length INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    processing_ms REAL NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_operations_user_created
  ON operations (user_id, created_at DESC);
`);

const mapOperation = (row) => row ? ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  inputPreview: row.input_preview,
  inputLength: row.input_length,
  result: JSON.parse(row.result_json),
  processingMs: row.processing_ms,
  createdAt: row.created_at
}) : null;

export const insertOperation = (operation) => {
  db.prepare(`
    INSERT INTO operations (
      id, user_id, type, input_preview, input_length, result_json, processing_ms, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    operation.id,
    operation.userId,
    operation.type,
    operation.inputPreview,
    operation.inputLength,
    JSON.stringify(operation.result),
    operation.processingMs,
    operation.createdAt
  );

  return getOperation(operation.id, operation.userId);
};

export const getOperation = (id, userId) => mapOperation(db.prepare(`
  SELECT * FROM operations WHERE id = ? AND user_id = ?
`).get(id, userId));

export const listOperations = (userId, limit, offset) => db.prepare(`
  SELECT * FROM operations
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`).all(userId, limit, offset).map(mapOperation);

export const countOperations = (userId) => db.prepare(`
  SELECT COUNT(*) AS total FROM operations WHERE user_id = ?
`).get(userId).total;

export const operationStats = (userId) => db.prepare(`
  SELECT type, COUNT(*) AS total, AVG(processing_ms) AS average_ms
  FROM operations
  WHERE user_id = ?
  GROUP BY type
  ORDER BY total DESC
`).all(userId).map((row) => ({
  type: row.type,
  total: row.total,
  averageMs: Number(row.average_ms.toFixed(2))
}));

export const deleteOperation = (id, userId) => db.prepare(`
  DELETE FROM operations WHERE id = ? AND user_id = ?
`).run(id, userId).changes > 0;
```

## `services/history-service/src/server.js`

```javascript
// Expone el historial persistente de operaciones.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import {
  countOperations,
  deleteOperation,
  insertOperation,
  listOperations,
  operationStats
} from './database.js';

const app = express();
const port = Number(process.env.PORT || 4003);
const serviceKey = process.env.SERVICE_KEY || 'mia-internal-local-service-key';

const operationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1).max(120),
  type: z.enum(['summarize', 'sentiment', 'keywords', 'classify']),
  inputPreview: z.string().max(240),
  inputLength: z.number().int().nonnegative(),
  result: z.unknown(),
  processingMs: z.number().nonnegative(),
  createdAt: z.string().datetime()
});

const requireUser = (request, response, next) => {
  const userId = request.headers['x-user-id'];

  if (!userId || typeof userId !== 'string') {
    return response.status(401).json({ message: 'Identidad de usuario requerida.' });
  }

  request.userId = userId;
  return next();
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '128kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'history-service', status: 'ok' });
});

app.post('/internal/operations', (request, response) => {
  if (request.headers['x-service-key'] !== serviceKey) {
    return response.status(403).json({ message: 'Acceso interno denegado.' });
  }

  const validation = operationSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'Operacion no valida.' });
  }

  return response.status(201).json({ operation: insertOperation(validation.data) });
});

app.get('/operations', requireUser, (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 25, 1), 100);
  const offset = Math.max(Number(request.query.offset) || 0, 0);

  response.json({
    items: listOperations(request.userId, limit, offset),
    total: countOperations(request.userId),
    limit,
    offset
  });
});

app.get('/stats', requireUser, (request, response) => {
  response.json({ items: operationStats(request.userId), total: countOperations(request.userId) });
});

app.delete('/operations/:id', requireUser, (request, response) => {
  const deleted = deleteOperation(request.params.id, request.userId);

  if (!deleted) {
    return response.status(404).json({ message: 'Registro no encontrado.' });
  }

  return response.status(204).send();
});

app.use((error, request, response, next) => {
  response.status(500).json({ message: 'No fue posible procesar el historial.' });
});

app.listen(port, () => {
  console.log(`history-service activo en http://localhost:${port}`);
});
```

## `tests/nlp-smoke.mjs`

```javascript
// Verifica las operaciones NLP del backend y navegador.
import { analyzeSentiment, classifyText, extractKeywords, summarizeText } from '../services/ai-service/src/nlp.js';
import { executeLocalAi } from '../frontend/src/services/localAi.js';

const sample = 'La plataforma mejora la calidad del servicio. El sistema procesa datos mediante microservicios seguros. La solucion es estable y eficiente. Los equipos revisan resultados y reducen errores.';

const assertions = [
  summarizeText(sample, 2).length >= 20,
  analyzeSentiment(sample).label === 'positivo',
  extractKeywords(sample, 5).length === 5,
  classifyText(sample).category === 'tecnologia',
  ['summarize', 'sentiment', 'keywords', 'classify'].every((type) => {
    const response = executeLocalAi(type, { text: sample, sentences: 2, limit: 5 });
    return Boolean(response.result) && typeof response.processingMs === 'number';
  })
];

if (assertions.some((assertion) => !assertion)) {
  throw new Error('Fallo la verificacion del motor NLP.');
}

console.log('Verificacion NLP completada correctamente.');
```
