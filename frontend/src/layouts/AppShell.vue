<!-- Proporciona navegacion, estado y estructura para las vistas privadas. -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { platformApi } from '../services/platformApi.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);
const online = ref(navigator.onLine);
const runtime = ref(platformApi.runtime());
const updateAvailable = ref(false);
const links = [
  { name: 'dashboard', label: 'Panel general', icon: 'fa-solid fa-chart-line' },
  { name: 'text-lab', label: 'Espacio de trabajo', icon: 'fa-solid fa-wand-magic-sparkles' },
  { name: 'history', label: 'Historial', icon: 'fa-solid fa-clock-rotate-left' },
  { name: 'templates', label: 'Plantillas', icon: 'fa-solid fa-layer-group' },
  { name: 'settings', label: 'Configuración', icon: 'fa-solid fa-sliders' },
  { name: 'architecture', label: 'Experiencia', icon: 'fa-solid fa-compass' },
  { name: 'help', label: 'Ayuda', icon: 'fa-solid fa-circle-question' }
];

const availabilityLabel = computed(() => {
  if (!online.value) return 'Sin conexión a Internet';
  if (runtime.value.activeMode === 'browser') return 'Disponible en este navegador';
  return runtime.value.lastProbe?.ok === false ? 'Conexión en revisión' : 'Sistema disponible';
});
const availabilityClass = computed(() => ({
  'is-offline': !online.value,
  'is-warning': online.value && runtime.value.activeMode === 'services' && runtime.value.lastProbe?.ok === false
}));

watch(() => route.fullPath, () => {
  sidebarOpen.value = false;
});

const updateOnline = () => {
  online.value = navigator.onLine;
};
const updateRuntime = (event) => {
  runtime.value = event.detail || platformApi.runtime();
};
const showUpdate = () => {
  updateAvailable.value = true;
};
const applyUpdate = () => {
  window.location.reload();
};
const closeSession = async () => {
  await auth.logout();
  router.push({ name: 'login' });
};

onMounted(() => {
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  window.addEventListener('mia:runtime-change', updateRuntime);
  window.addEventListener('mia:update-available', showUpdate);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnline);
  window.removeEventListener('offline', updateOnline);
  window.removeEventListener('mia:runtime-change', updateRuntime);
  window.removeEventListener('mia:update-available', showUpdate);
});
</script>

<template>
  <div class="app-frame">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="app-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="brand-block">
        <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
        <div>
          <div class="brand-title">MiaServicios</div>
          <div class="brand-subtitle">Asistente de contenido</div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación principal">
        <router-link v-for="link in links" :key="link.name" :to="{ name: link.name }" class="sidebar-link">
          <i :class="link.icon"></i>
          <span>{{ link.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="mode-indicator" :class="availabilityClass">
          <span class="status-dot"></span>
          {{ availabilityLabel }}
        </div>
        <button type="button" class="btn btn-outline-light btn-sm btn-block" @click="closeSession">
          <i class="fa-solid fa-right-from-bracket mr-2"></i>Cerrar sesión
        </button>
      </div>
    </aside>

    <section class="app-content">
      <header class="topbar">
        <button type="button" class="btn sidebar-toggle" aria-label="Abrir menú" @click="sidebarOpen = true">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="topbar-heading">
          <div class="page-eyebrow">MiaServicios</div>
          <h1>{{ $route.meta.title || 'Inicio' }}</h1>
        </div>
        <router-link :to="{ name: 'settings' }" class="user-chip" aria-label="Abrir configuración">
          <div class="user-avatar">{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'M' }}</div>
          <div class="user-data d-none d-sm-block">
            <strong>{{ auth.user?.name }}</strong>
            <span>{{ auth.user?.role === 'admin' ? 'Administrador' : 'Usuario' }}</span>
          </div>
        </router-link>
      </header>

      <div v-if="updateAvailable" class="update-banner">
        <div><i class="fa-solid fa-arrows-rotate"></i><span>Hay una actualización lista para aplicar.</span></div>
        <button type="button" class="btn btn-sm btn-light" @click="applyUpdate">Actualizar ahora</button>
      </div>

      <div v-if="!online" class="offline-banner">
        <i class="fa-solid fa-wifi"></i>
        <span>La conexión a Internet se interrumpió. Las funciones disponibles en este navegador continúan activas.</span>
      </div>

      <main id="main-content" class="page-container" tabindex="-1">
        <slot></slot>
      </main>
    </section>
  </div>
</template>
