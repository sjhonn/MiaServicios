<!-- Gestiona perfil, seguridad, respaldo e información del sistema. -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { platformApi } from '../services/platformApi.js';
import { templateRepository } from '../services/templateRepository.js';
import { useAuthStore } from '../stores/auth.js';
import { downloadFile, formatDate } from '../utils/formatters.js';

const auth = useAuthStore();
const { push } = useNotifier();
const profile = reactive({ name: auth.user?.name || '' });
const password = reactive({ currentPassword: '', newPassword: '', confirmation: '' });
const health = ref(null);
const loadingProfile = ref(false);
const loadingPassword = ref(false);
const loadingHealth = ref(false);
const importInput = ref(null);

const systemVersions = [
  { name: 'MiaServicios', version: '2.0', purpose: 'Versión general de la plataforma' },
  { name: 'Vue', version: '3.5.13', purpose: 'Interfaz y componentes visuales' },
  { name: 'Bootstrap', version: '4.6.2', purpose: 'Diseño adaptable y estructura visual' },
  { name: 'Font Awesome', version: '6.7.2', purpose: 'Iconos de la interfaz' },
  { name: 'Vue Router', version: '4.5.1', purpose: 'Navegación entre vistas' },
  { name: 'Pinia', version: '3.0.2', purpose: 'Estado de la sesión y datos compartidos' },
  { name: 'Node.js', version: '20.18 o superior', purpose: 'Ejecución de los servicios locales' },
  { name: 'Express', version: '5.1.0', purpose: 'Servicios y comunicación interna' },
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

const checkHealth = async () => {
  loadingHealth.value = true;
  try {
    health.value = await platformApi.health();
    push('Información del sistema actualizada.', 'success');
  } catch (error) {
    push(error.message, 'danger');
  } finally {
    loadingHealth.value = false;
  }
};

const exportBackup = async () => {
  try {
    const data = await platformApi.exportData();
    const backup = { ...data, templates: templateRepository.export() };
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
      <p>Administre su cuenta, proteja sus datos y consulte la información técnica de MiaServicios.</p>
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

      <section class="panel-card">
        <div class="panel-title"><h2>Respaldo de datos</h2></div>
        <p class="text-muted">Exporte el historial y las plantillas en un archivo JSON para conservar una copia o trasladar la información.</p>
        <div class="data-actions">
          <button type="button" class="btn btn-outline-light" @click="exportBackup"><i class="fa-solid fa-file-export mr-2"></i>Exportar respaldo</button>
          <button type="button" class="btn btn-outline-light" :disabled="!platformApi.isDemo" @click="importInput.click()"><i class="fa-solid fa-file-import mr-2"></i>Importar respaldo</button>
          <input ref="importInput" type="file" accept="application/json" class="d-none" @change="importBackup">
          <button type="button" class="btn btn-outline-danger" @click="clearHistory"><i class="fa-solid fa-trash-can mr-2"></i>Eliminar historial</button>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <h2>Estado del sistema</h2>
          <button type="button" class="btn btn-outline-light btn-sm" :disabled="loadingHealth" aria-label="Actualizar estado" @click="checkHealth"><i :class="loadingHealth ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rotate'"></i></button>
        </div>
        <div class="alert alert-dark-custom mb-3">
          <strong>{{ platformApi.isDemo ? 'Ejecución desde el navegador' : 'Ejecución con servicios locales' }}</strong>
          <div class="small mt-2 text-muted">Versión de MiaServicios: {{ health?.version || '2.0' }} · Estado: {{ health?.status === 'ok' || health?.status === 'local' ? 'Disponible' : 'En revisión' }}</div>
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
