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
