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
