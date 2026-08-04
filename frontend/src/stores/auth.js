// Administra el ciclo completo de la sesion del usuario.
import { defineStore } from 'pinia';
import { platformApi } from '../services/platformApi.js';

let listenersBound = false;
let bootstrapPromise = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null,
    loading: false,
    initialized: false,
    error: '',
    notice: sessionStorage.getItem('mia_auth_notice') || ''
  }),
  getters: {
    authenticated: (state) => Boolean(state.session?.token && state.session?.user),
    user: (state) => state.session?.user || null
  },
  actions: {
    bindSessionEvents() {
      if (listenersBound) return;
      listenersBound = true;
      window.addEventListener('mia:session-refreshed', (event) => {
        this.session = event.detail || platformApi.session();
      });
      window.addEventListener('mia:session-expired', (event) => {
        const reason = event.detail?.reason;
        this.session = null;
        this.notice = reason === 'password-changed'
          ? 'La contraseña fue actualizada. Inicia sesión nuevamente.'
          : 'Tu sesión venció. Inicia sesión nuevamente.';
        sessionStorage.setItem('mia_auth_notice', this.notice);
        if (window.location.hash !== '#/login') window.location.hash = '#/login';
      });
    },
    async bootstrap() {
      this.bindSessionEvents();
      if (this.initialized) return this.authenticated;
      if (!bootstrapPromise) {
        bootstrapPromise = platformApi.initialize().then(() => {
          this.session = platformApi.session();
          this.initialized = true;
          return this.authenticated;
        }).finally(() => {
          bootstrapPromise = null;
        });
      }
      return bootstrapPromise;
    },
    clearNotice() {
      this.notice = '';
      sessionStorage.removeItem('mia_auth_notice');
    },
    async run(action) {
      this.loading = true;
      this.error = '';
      try {
        this.session = await action();
        this.clearNotice();
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
      } catch (error) {
        if (error.code === 'SESSION_EXPIRED') this.session = null;
        return false;
      }
    },
    async updateProfile(payload) {
      const response = await platformApi.updateProfile(payload);
      this.session = {
        ...this.session,
        token: response.token || this.session.token,
        expiresAt: response.expiresAt || this.session.expiresAt,
        user: response.user
      };
      return response.user;
    },
    async logout() {
      await platformApi.logout();
      this.session = null;
      this.error = '';
      this.clearNotice();
    }
  }
});
