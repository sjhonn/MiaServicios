<!-- Gestiona el acceso y registro de usuarios. -->
<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { platformApi } from '../services/platformApi.js';

const router = useRouter();
const baseUrl = import.meta.env.BASE_URL;
const auth = useAuthStore();
const mode = ref('login');
const form = reactive({
  name: '',
  email: 'demo@mia.local',
  password: 'demo12345'
});

const heading = computed(() => mode.value === 'login' ? 'Acceso a la plataforma' : 'Crear una cuenta');
const submitLabel = computed(() => mode.value === 'login' ? 'Ingresar' : 'Registrar cuenta');

const changeMode = (value) => {
  mode.value = value;
  auth.error = '';
};

const submit = async () => {
  const successful = mode.value === 'login'
    ? await auth.login({ email: form.email, password: form.password })
    : await auth.register({ name: form.name, email: form.email, password: form.password });

  if (successful) {
    router.push({ name: 'dashboard' });
  }
};
</script>

<template>
  <div class="auth-page">
    <section class="auth-visual">
      <img :src="`${baseUrl}brand/miaservicios-cover.png`" alt="Identidad visual de MiaServicios">
      <div class="auth-copy">
        <h1><strong>Mia</strong>Servicios</h1>
        <p>Procesamiento de lenguaje, autenticacion e historial mediante una arquitectura modular preparada para operar sin servicios de pago.</p>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="brand-symbol"><i class="fa-solid fa-brain"></i></div>
          <div>
            <h2>{{ heading }}</h2>
            <p>{{ platformApi.isDemo ? 'Ejecucion estatica con datos locales' : 'Conexion con microservicios Node.js' }}</p>
          </div>
        </div>

        <div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'login' }" @click="changeMode('login')">
            Iniciar sesion
          </button>
          <button type="button" class="auth-tab" :class="{ 'is-active': mode === 'register' }" @click="changeMode('register')">
            Registrarse
          </button>
        </div>

        <div v-if="auth.error" class="alert alert-danger-custom" role="alert">
          {{ auth.error }}
        </div>

        <form @submit.prevent="submit">
          <div v-if="mode === 'register'" class="form-group">
            <label for="name">Nombre completo</label>
            <input id="name" v-model.trim="form.name" type="text" class="form-control" minlength="2" maxlength="80" required>
          </div>

          <div class="form-group">
            <label for="email">Correo electronico</label>
            <input id="email" v-model.trim="form.email" type="email" class="form-control" autocomplete="email" required>
          </div>

          <div class="form-group">
            <label for="password">Contrasena</label>
            <input id="password" v-model="form.password" type="password" class="form-control" minlength="8" maxlength="72" autocomplete="current-password" required>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading">
            <i :class="auth.loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-arrow-right-to-bracket'" class="mr-2"></i>
            {{ auth.loading ? 'Procesando' : submitLabel }}
          </button>
        </form>

        <div v-if="mode === 'login'" class="demo-credentials">
          <strong>Acceso inicial</strong><br>
          Correo: demo@mia.local<br>
          Contrasena: demo12345
        </div>
      </div>
    </section>
  </div>
</template>
