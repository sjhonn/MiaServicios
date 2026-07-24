// Mantiene la sesion activa de la plataforma.
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { platformApi } from '../services/platformApi.js';

export const useAuthStore = defineStore('auth', () => {
  const session = ref(platformApi.session());
  const loading = ref(false);
  const error = ref('');

  const user = computed(() => session.value?.user || null);
  const authenticated = computed(() => Boolean(session.value?.token));

  const execute = async (action) => {
    loading.value = true;
    error.value = '';

    try {
      session.value = await action();
      return true;
    } catch (exception) {
      error.value = exception.message;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const login = (credentials) => execute(() => platformApi.login(credentials));
  const register = (payload) => execute(() => platformApi.register(payload));

  const logout = () => {
    platformApi.logout();
    session.value = null;
    error.value = '';
  };

  return { session, user, authenticated, loading, error, login, register, logout };
});
