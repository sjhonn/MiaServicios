// Inicializa Vue, Pinia, rutas y estilos globales.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/theme.css';
import App from './App.vue';
import router from './router/index.js';

createApp(App).use(createPinia()).use(router).mount('#app');
