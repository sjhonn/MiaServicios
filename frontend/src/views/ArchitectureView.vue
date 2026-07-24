<!-- Documenta los componentes tecnicos del proyecto. -->
<script setup>
import AppShell from '../layouts/AppShell.vue';
import { platformApi } from '../services/platformApi.js';

const components = [
  {
    title: 'Frontend web',
    icon: 'fa-solid fa-display',
    description: 'Interfaz Vue 3 compilada como sitio estatico en la carpeta docs, con rutas hash para compatibilidad directa con GitHub Pages.',
    technologies: ['Vue 3', 'Vite', 'Pinia', 'Bootstrap 4.6', 'Font Awesome']
  },
  {
    title: 'API Gateway',
    icon: 'fa-solid fa-network-wired',
    description: 'Punto de entrada Node.js que valida sesiones, aplica limites de solicitud y coordina autenticacion, procesamiento e historial.',
    technologies: ['Node.js', 'Express', 'Helmet', 'Rate Limit', 'Fetch API']
  },
  {
    title: 'Servicio de autenticacion',
    icon: 'fa-solid fa-user-shield',
    description: 'Gestiona usuarios, contrasenas cifradas y tokens JWT. La persistencia se mantiene en una base SQLite independiente.',
    technologies: ['JWT', 'bcryptjs', 'SQLite', 'Zod']
  },
  {
    title: 'Servicio NLP',
    icon: 'fa-solid fa-brain',
    description: 'Procesa texto localmente mediante puntuacion estadistica y reglas linguisticas, sin consumir APIs comerciales ni generar costos por solicitud.',
    technologies: ['Resumen', 'Sentimiento', 'Keywords', 'Clasificacion']
  },
  {
    title: 'Servicio de historial',
    icon: 'fa-solid fa-database',
    description: 'Registra resultados, tiempos de proceso y metadatos por usuario en una base SQLite separada del servicio de identidad.',
    technologies: ['SQLite', 'WAL', 'REST', 'Persistencia local']
  },
  {
    title: 'Modo GitHub Pages',
    icon: 'fa-brands fa-github',
    description: 'La compilacion publica utiliza un adaptador local en el navegador para conservar login, procesamiento e historial cuando no existe backend remoto.',
    technologies: ['LocalStorage', 'Web Crypto', 'SPA estatica', 'Costo cero']
  }
];
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Arquitectura de la solucion</h2>
      <p>El repositorio admite dos modos: microservicios Node.js para ejecucion completa y adaptador local para la publicacion estatica en GitHub Pages.</p>
    </div>

    <div class="alert alert-dark-custom mb-4">
      <strong>Modo actual: {{ platformApi.isDemo ? 'GitHub Pages estatico' : 'Microservicios Node.js' }}</strong>
      <div class="small mt-2 text-muted">No se requiere una licencia comercial ni una API de inteligencia artificial de pago.</div>
    </div>

    <section class="architecture-grid">
      <article v-for="component in components" :key="component.title" class="architecture-card">
        <div class="architecture-icon"><i :class="component.icon"></i></div>
        <h3>{{ component.title }}</h3>
        <p>{{ component.description }}</p>
        <div class="tech-list">
          <span v-for="technology in component.technologies" :key="technology">{{ technology }}</span>
        </div>
      </article>
    </section>
  </AppShell>
</template>
