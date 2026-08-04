<!-- Gestiona el acceso y registro de usuarios. -->
<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { platformApi } from '../services/platformApi.js';

const router = useRouter();
const auth = useAuthStore();
const baseUrl = import.meta.env.BASE_URL;
const mode = ref('login');
const showPassword = ref(false);
const form = reactive({ name: '', email: 'demo@mia.local', password: 'demo12345' });
const heading = computed(() => mode.value === 'login' ? 'Acceso a MiaServicios' : 'Crear una cuenta');
const submitLabel = computed(() => mode.value === 'login' ? 'Ingresar' : 'Registrar cuenta');
const runtimeLabel = computed(() => platformApi.isDemo ? 'Disponible en este navegador' : 'Conectado al sistema');

const changeMode = (value) => {
  mode.value = value;
  auth.error = '';
  auth.clearNotice();
  form.name = '';
};

const submit = async () => {
  const successful = mode.value === 'login'
    ? await auth.login({ email: form.email, password: form.password })
    : await auth.register({ name: form.name, email: form.email, password: form.password });
  if (successful) router.push({ name: 'dashboard' });
};
</script>

<template>
  <div class="auth-page">
    <section class="auth-visual">
      <img :src="`${baseUrl}brand/miaservicios-cover.png`" alt="Identidad visual de MiaServicios">
      <div class="auth-copy">
        <h1>MiaServicios</h1>
        <p>Organice, analice y reutilice contenido desde una experiencia clara, segura y adaptable a cualquier pantalla.</p>
        <div class="auth-feature-list">
          <span><i class="fa-solid fa-wand-magic-sparkles"></i>Herramientas de texto</span>
          <span><i class="fa-solid fa-clock-rotate-left"></i>Historial personal</span>
          <span><i class="fa-solid fa-mobile-screen-button"></i>Diseño adaptable</span>
        </div>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
          <div>
            <h2>{{ heading }}</h2>
            <p>Ingrese para continuar con sus tareas y resultados guardados.</p>
          </div>
        </div>

        <div class="auth-runtime"><span class="status-dot"></span>{{ runtimeLabel }}</div>

        <div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'login' }" @click="changeMode('login')">Iniciar sesión</button>
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'register' }" @click="changeMode('register')">Registrarse</button>
        </div>

        <div v-if="auth.notice" class="alert alert-info-custom" role="status">
          <i class="fa-solid fa-circle-info mr-2"></i>{{ auth.notice }}
        </div>
        <div v-if="auth.error" class="alert alert-danger-custom" role="alert">{{ auth.error }}</div>

        <form @submit.prevent="submit">
          <div v-if="mode === 'register'" class="form-group">
            <label for="name">Nombre completo</label>
            <input id="name" v-model.trim="form.name" type="text" class="form-control" minlength="2" maxlength="80" autocomplete="name" required>
          </div>

          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model.trim="form.email" type="email" class="form-control" autocomplete="email" required>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-group">
              <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-control" minlength="8" maxlength="72" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required>
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary" aria-label="Mostrar contraseña" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading">
            <i :class="auth.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-arrow-right-to-bracket'" class="mr-2"></i>
            {{ auth.loading ? 'Procesando' : submitLabel }}
          </button>
        </form>

        <div v-if="mode === 'login'" class="demo-credentials">
          <strong>Acceso inicial</strong><br>
          Correo: demo@mia.local<br>
          Contraseña: demo12345
        </div>
      </div>
    </section>
  </div>
</template>
