// Inicializa MiaServicios y resuelve el entorno antes de mostrar la interfaz.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fortawesome/fontawesome-free/js/all.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/theme.css';
import App from './App.vue';
import router from './router/index.js';
import { platformApi } from './services/platformApi.js';
import { preferences } from './services/preferences.js';

preferences.apply();
await platformApi.initialize();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
