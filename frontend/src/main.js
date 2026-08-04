// Inicializa MiaServicios y restaura la sesión antes de mostrar la interfaz.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/theme.css';
import App from './App.vue';
import router from './router/index.js';
import { preferences } from './services/preferences.js';
import { useAuthStore } from './stores/auth.js';

preferences.apply();

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const registration = await navigator.serviceWorker.register('./service-worker.js').catch(() => null);
  if (!registration) return;
  registration.update().catch(() => null);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        window.dispatchEvent(new CustomEvent('mia:update-available'));
      }
    });
  });
};

const startApplication = async () => {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);

  const auth = useAuthStore(pinia);
  await auth.bootstrap();
  await router.isReady();
  app.mount('#app');

  if (document.readyState === 'complete') await registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
};

startApplication().catch((error) => {
  console.error('No se pudo iniciar MiaServicios.', error);
});
