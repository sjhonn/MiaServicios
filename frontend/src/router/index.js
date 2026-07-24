// Define rutas privadas compatibles con GitHub Pages.
import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import TextLabView from '../views/TextLabView.vue';
import HistoryView from '../views/HistoryView.vue';
import TemplatesView from '../views/TemplatesView.vue';
import SettingsView from '../views/SettingsView.vue';
import ArchitectureView from '../views/ArchitectureView.vue';
import NotFoundView from '../views/NotFoundView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, title: 'Acceso' } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, title: 'Panel general' } },
    { path: '/laboratorio', name: 'text-lab', component: TextLabView, meta: { requiresAuth: true, title: 'Herramientas' } },
    { path: '/historial', name: 'history', component: HistoryView, meta: { requiresAuth: true, title: 'Historial' } },
    { path: '/plantillas', name: 'templates', component: TemplatesView, meta: { requiresAuth: true, title: 'Plantillas' } },
    { path: '/configuracion', name: 'settings', component: SettingsView, meta: { requiresAuth: true, title: 'Configuracion' } },
    { path: '/experiencia', name: 'architecture', component: ArchitectureView, meta: { requiresAuth: true, title: 'Experiencia' } },
    { path: '/arquitectura', redirect: '/experiencia' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Pagina no encontrada' } }
  ],
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.authenticated) return { name: 'login' };
  if (to.meta.guestOnly && auth.authenticated) return { name: 'dashboard' };
  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.title || 'Plataforma'} | MiaServicios`;
});

export default router;
