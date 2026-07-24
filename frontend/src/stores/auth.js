// Administra la sesion y el perfil del usuario.
import { defineStore } from 'pinia';
import { platformApi } from '../services/platformApi.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: platformApi.session(),
    loading: false,
    error: ''
  }),
  getters: {
    authenticated: (state) => Boolean(state.session?.token && state.session?.user),
    user: (state) => state.session?.user || null
  },
  actions: {
    async run(action) {
      this.loading = true;
      this.error = '';
      try {
        this.session = await action();
        return true;
      } catch (error) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },
    login(credentials) {
      return this.run(() => platformApi.login(credentials));
    },
    register(payload) {
      return this.run(() => platformApi.register(payload));
    },
    async refresh() {
      if (!this.authenticated) return false;
      try {
        const response = await platformApi.me();
        this.session = { ...this.session, user: response.user };
        return true;
      } catch {
        this.logout();
        return false;
      }
    },
    async updateProfile(payload) {
      const response = await platformApi.updateProfile(payload);
      this.session = { ...this.session, token: response.token || this.session.token, user: response.user };
      return response.user;
    },
    logout() {
      platformApi.logout();
      this.session = null;
      this.error = '';
    }
  }
});
