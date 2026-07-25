<!-- Centraliza la cuenta, la apariencia, los datos y la información del sistema. -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { platformApi } from '../services/platformApi.js';
import { preferences } from '../services/preferences.js';
import { templateRepository } from '../services/templateRepository.js';
import { useAuthStore } from '../stores/auth.js';
import { downloadFile, formatDate } from '../utils/formatters.js';

const auth = useAuthStore();
const { push } = useNotifier();
const profile = reactive({ name: auth.user?.name || '' });
const password = reactive({ currentPassword: '', newPassword: '', confirmation: '' });
const visual = reactive(preferences.read());
const runtime = reactive({ ...platformApi.runtime() });
const health = ref(null);
const connectionTest = ref(null);
const loadingProfile = ref(false);
const loadingPassword = ref(false);
const loadingHealth = ref(false);
const loadingConnection = ref(false);
const importInput = ref(null);

const systemVersions = [
  { name: 'MiaServicios', version: '3.0.0', purpose: 'Versión estable de la plataforma' },
  { name: 'Vue', version: '3.5.13', purpose: 'Interfaz y componentes visuales' },
  { name: 'Bootstrap', version: '4.6.2', purpose: 'Diseño adaptable y estructura visual' },
  { name: 'Font Awesome', version: '6.7.2', purpose: 'Iconos de la interfaz' },
  { name: 'Vue Router', version: '4.5.1', purpose: 'Navegación entre vistas' },
  { name: 'Pinia', version: '3.0.2', purpose: 'Sesión y datos compartidos' },
  { name: 'Node.js', version: '20.18 o superior', purpose: 'Ejecución local de servicios' },
  { name: 'Express', version: '5.1.0', purpose: 'Comunicación y servicios internos' },
  { name: 'SQLite', version: '11.10.0', purpose: 'Almacenamiento local de cuentas e historial' }
];

const systemServices = computed(() => [
  { key: 'auth', name: 'Acceso y seguridad', icon: 'fa-solid fa-user-lock' },
  { key: 'ai', name: 'Procesamiento de contenido', icon: 'fa-solid fa-brain' },
  { key: 'history', name: 'Historial de resultados', icon: 'fa-solid fa-clock-rotate-left' }
].map((item) => {
  const service = health.value?.services?.[item.key];
  const rawStatus = typeof service === 'string' ? service : service?.status;
  return { ...item, status: ['ok', 'local'].includes(rawStatus) ? 'Disponible' : 'Sin confirmar' };
}));

const runtimeLabel = computed(() => runtime.activeMode === 'services' ? 'Servicios conectados' : 'Funcionamiento en el navegador');
const preferredModeLabel = computed(() => ({ auto: 'Automático', browser: 'Navegador', services: 'Servicios conectados' }[runtime.preferredMode] || 'Automático'));

const saveProfile = async () => {
  if (profile.name.trim().length < 2) {
    push('El nombre debe contener al menos dos caracteres.', 'danger');
    return;
  }
  loadingProfile.value = true;
  try {
    await auth.updateProfile({ name: profile.name.trim() });
    push('Perfil actualizado.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  } finally {
    loadingProfile.value = false;
  }
};

const changePassword = async () => {
  if (password.newPassword.length < 8 || password.newPassword !== password.confirmation) {
    push('La nueva contraseña debe tener ocho caracteres y coincidir con la confirmación.', 'danger');
    return;
  }
  loadingPassword.value = true;
  try {
    await platformApi.changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword });
    password.currentPassword = '';
    password.newPassword = '';
    password.confirmation = '';
    push('Contraseña actualizada.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  } finally {
    loadingPassword.value = false;
  }
};

const saveAppearance = () => {
  preferences.save(visual);
  push('Preferencias visuales aplicadas.', 'success');
};

const checkHealth = async () => {
  loadingHealth.value = true;
  try {
    health.value = await platformApi.health();
    Object.assign(runtime, platformApi.runtime());
    push('Información del sistema actualizada.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  } finally {
    loadingHealth.value = false;
  }
};

const testConnection = async () => {
  loadingConnection.value = true;
  connectionTest.value = null;
  try {
    connectionTest.value = await platformApi.testConnection(runtime.apiUrl);
    push(connectionTest.value.ok ? 'Conexión disponible.' : 'No se pudo establecer la conexión.', connectionTest.value.ok ? 'success' : 'danger');
  } finally {
    loadingConnection.value = false;
  }
};

const saveRuntime = async () => {
  loadingConnection.value = true;
  try {
    const updated = await platformApi.configure({ mode: runtime.preferredMode, apiUrl: runtime.apiUrl });
    Object.assign(runtime, updated);
    await checkHealth();
    push('Configuración de funcionamiento guardada.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  } finally {
    loadingConnection.value = false;
  }
};

const exportBackup = async () => {
  try {
    const data = await platformApi.exportData();
    const backup = { ...data, templates: templateRepository.export(), preferences: preferences.read() };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(`miaservicios-respaldo-${timestamp}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
    push('Respaldo generado.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  }
};

const importBackup = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const result = await platformApi.importData(payload);
    if (Array.isArray(payload.templates)) templateRepository.import(payload.templates);
    if (payload.preferences) {
      const importedPreferences = preferences.save(payload.preferences);
      Object.assign(visual, importedPreferences);
    }
    push(`${result.imported || 0} registros importados.`, 'success');
  } catch (error) {
    push(error.message || 'El respaldo no es válido.', 'danger');
  } finally {
    event.target.value = '';
  }
};

const clearHistory = async () => {
  if (!window.confirm('Se eliminará todo el historial del usuario.')) return;
  try {
    const result = await platformApi.clearHistory();
    push(`${result.deleted || 0} registros eliminados.`, 'success');
  } catch (error) {
    push(error.message, 'danger');
  }
};

onMounted(checkHealth);
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Configuración</h2>
      <p>Administre la cuenta, la experiencia visual, los respaldos y el funcionamiento de MiaServicios.</p>
    </div>

    <div class="settings-grid">
      <section class="panel-card">
        <div class="panel-title"><h2>Perfil</h2></div>
        <div class="profile-summary">
          <div class="user-avatar profile-avatar">{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'M' }}</div>
          <div>
            <strong>{{ auth.user?.email }}</strong>
            <span>Cuenta creada: {{ formatDate(auth.user?.createdAt, 'short') }}</span>
          </div>
        </div>
        <div class="form-group mt-4">
          <label for="profile-name">Nombre completo</label>
          <input id="profile-name" v-model="profile.name" type="text" class="form-control" minlength="2" maxlength="80">
        </div>
        <button type="button" class="btn btn-primary" :disabled="loadingProfile" @click="saveProfile">
          <i :class="loadingProfile ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-floppy-disk'" class="mr-2"></i>Guardar perfil
        </button>
      </section>

      <section class="panel-card">
        <div class="panel-title"><h2>Seguridad</h2></div>
        <div class="form-group">
          <label for="current-password">Contraseña actual</label>
          <input id="current-password" v-model="password.currentPassword" type="password" class="form-control" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label for="new-password">Nueva contraseña</label>
          <input id="new-password" v-model="password.newPassword" type="password" class="form-control" minlength="8" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirmar contraseña</label>
          <input id="confirm-password" v-model="password.confirmation" type="password" class="form-control" minlength="8" autocomplete="new-password">
        </div>
        <button type="button" class="btn btn-primary" :disabled="loadingPassword" @click="changePassword">
          <i :class="loadingPassword ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-key'" class="mr-2"></i>Cambiar contraseña
        </button>
      </section>

      <section class="panel-card settings-appearance-card">
        <div class="panel-title">
          <div><h2>Apariencia y accesibilidad</h2><div class="panel-subtitle">Ajuste la lectura y el movimiento de la interfaz.</div></div>
          <i class="fa-solid fa-universal-access settings-title-icon"></i>
        </div>
        <div class="preference-grid">
          <div class="form-group">
            <label for="density">Espaciado</label>
            <select id="density" v-model="visual.density" class="custom-select">
              <option value="comfortable">Cómodo</option>
              <option value="compact">Compacto</option>
            </select>
          </div>
          <div class="form-group">
            <label for="contrast">Contraste</label>
            <select id="contrast" v-model="visual.contrast" class="custom-select">
              <option value="standard">Estándar</option>
              <option value="high">Alto contraste</option>
            </select>
          </div>
          <div class="form-group">
            <label for="motion">Movimiento</label>
            <select id="motion" v-model="visual.motion" class="custom-select">
              <option value="full">Normal</option>
              <option value="reduced">Reducido</option>
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-primary" @click="saveAppearance"><i class="fa-solid fa-check mr-2"></i>Aplicar preferencias</button>
      </section>

      <section class="panel-card">
        <div class="panel-title"><h2>Respaldo de datos</h2></div>
        <p class="text-muted">Exporte el historial, las plantillas y las preferencias para conservar una copia o trasladar la información.</p>
        <div class="data-actions">
          <button type="button" class="btn btn-outline-light" @click="exportBackup"><i class="fa-solid fa-file-export mr-2"></i>Exportar respaldo</button>
          <button type="button" class="btn btn-outline-light" :disabled="!platformApi.isDemo" @click="importInput.click()"><i class="fa-solid fa-file-import mr-2"></i>Importar respaldo</button>
          <input ref="importInput" type="file" accept="application/json" class="d-none" @change="importBackup">
          <button type="button" class="btn btn-outline-danger" @click="clearHistory"><i class="fa-solid fa-trash-can mr-2"></i>Eliminar historial</button>
        </div>
      </section>

      <section class="panel-card settings-runtime-card">
        <div class="panel-title">
          <div><h2>Funcionamiento</h2><div class="panel-subtitle">Configure el uso publicado o la conexión con servicios locales.</div></div>
          <span class="runtime-pill"><i class="fa-solid fa-circle mr-2"></i>{{ runtimeLabel }}</span>
        </div>
        <div class="runtime-summary">
          <div><span>Modo preferido</span><strong>{{ preferredModeLabel }}</strong></div>
          <div><span>Modo activo</span><strong>{{ runtimeLabel }}</strong></div>
          <div><span>Última comprobación</span><strong>{{ runtime.lastProbe?.checkedAt ? formatDate(runtime.lastProbe.checkedAt, 'short') : 'Sin comprobar' }}</strong></div>
        </div>
        <div class="runtime-form">
          <div class="form-group">
            <label for="runtime-mode">Modo</label>
            <select id="runtime-mode" v-model="runtime.preferredMode" class="custom-select">
              <option value="auto">Automático</option>
              <option value="browser">Navegador</option>
              <option value="services">Servicios conectados</option>
            </select>
          </div>
          <div class="form-group runtime-url-field">
            <label for="runtime-url">Dirección de servicios</label>
            <input id="runtime-url" v-model.trim="runtime.apiUrl" type="url" class="form-control" placeholder="http://localhost:4000/api">
          </div>
        </div>
        <div v-if="connectionTest" class="connection-result" :class="connectionTest.ok ? 'is-success' : 'is-error'">
          <i :class="connectionTest.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
          <span>{{ connectionTest.ok ? `Conexión disponible en ${connectionTest.latencyMs} ms.` : 'No se encontró una conexión disponible en la dirección indicada.' }}</span>
        </div>
        <div class="data-actions">
          <button type="button" class="btn btn-outline-light" :disabled="loadingConnection" @click="testConnection"><i class="fa-solid fa-plug-circle-check mr-2"></i>Probar conexión</button>
          <button type="button" class="btn btn-primary" :disabled="loadingConnection" @click="saveRuntime"><i class="fa-solid fa-floppy-disk mr-2"></i>Guardar funcionamiento</button>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <h2>Estado del sistema</h2>
          <button type="button" class="btn btn-outline-light btn-sm" :disabled="loadingHealth" aria-label="Actualizar estado" @click="checkHealth"><i :class="loadingHealth ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate'"></i></button>
        </div>
        <div class="alert alert-dark-custom mb-3">
          <strong>{{ runtimeLabel }}</strong>
          <div class="small mt-2 text-muted">Estado: {{ health?.status === 'ok' || health?.status === 'local' ? 'Disponible' : 'En revisión' }}</div>
        </div>
        <div class="service-list">
          <div v-for="service in systemServices" :key="service.key" class="service-row">
            <div class="service-name"><i :class="service.icon"></i>{{ service.name }}</div>
            <div class="service-state">{{ service.status }}</div>
          </div>
        </div>
      </section>

      <section class="panel-card settings-system-card">
        <div class="panel-title">
          <div>
            <h2>Sistemas y versiones</h2>
            <div class="panel-subtitle">Detalle técnico centralizado para mantenimiento y verificación.</div>
          </div>
          <span class="architecture-badge"><i class="fa-solid fa-gears mr-2"></i>Información técnica</span>
        </div>
        <div class="system-version-grid">
          <article v-for="item in systemVersions" :key="item.name" class="system-version-item">
            <div class="system-version-icon"><i class="fa-solid fa-cube"></i></div>
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.purpose }}</span>
            </div>
            <code>{{ item.version }}</code>
          </article>
        </div>
      </section>
    </div>
  </AppShell>
</template>
