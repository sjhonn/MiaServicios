<!-- Reúne orientación y respuestas para el uso diario. -->
<script setup>
import { ref } from 'vue';
import AppShell from '../layouts/AppShell.vue';

const openItem = ref('first-task');
const guides = [
  {
    id: 'first-task',
    icon: 'fa-solid fa-play',
    title: 'Realizar la primera tarea',
    steps: ['Abra Espacio de trabajo.', 'Elija la tarea que desea realizar.', 'Escriba, pegue o importe el contenido.', 'Revise el resultado y guárdelo o descárguelo.']
  },
  {
    id: 'resume-work',
    icon: 'fa-solid fa-arrow-rotate-right',
    title: 'Continuar un trabajo pendiente',
    steps: ['El borrador se guarda mientras escribe.', 'Regrese al Espacio de trabajo desde cualquier vista.', 'El contenido y la tarea seleccionada se recuperarán automáticamente.']
  },
  {
    id: 'reuse-result',
    icon: 'fa-solid fa-clock-rotate-left',
    title: 'Reutilizar un resultado',
    steps: ['Abra Historial.', 'Busque por contenido o filtre por tipo de tarea.', 'Abra el detalle, copie el resultado o márquelo como favorito.']
  },
  {
    id: 'backup',
    icon: 'fa-solid fa-box-archive',
    title: 'Crear un respaldo',
    steps: ['Abra Configuración.', 'Ubique Respaldo de datos.', 'Exporte el archivo y guárdelo en una ubicación segura.']
  }
];
const questions = [
  { question: '¿Mi trabajo se pierde al cerrar la página?', answer: 'El borrador activo se guarda automáticamente en el navegador. Los resultados completados quedan disponibles en el Historial.' },
  { question: '¿Puedo usar un archivo de texto?', answer: 'Sí. En Espacio de trabajo puede importar archivos TXT de hasta 1 MB.' },
  { question: '¿Dónde cambio el tamaño visual de la interfaz?', answer: 'En Configuración puede ajustar el tamaño de texto, el espaciado, el contraste y el movimiento.' },
  { question: '¿Cómo traslado mi información a otro equipo?', answer: 'Exporte un respaldo desde Configuración e impórtelo en el otro navegador.' },
  { question: '¿Qué ocurre cuando vence mi sesión?', answer: 'MiaServicios intenta renovarla automáticamente. Si ya no puede renovarse, vuelve al acceso sin mostrar errores técnicos.' },
  { question: '¿Puedo guardar un resultado como imagen?', answer: 'Sí. Desde el resultado puede descargar archivos PNG, JPG o WEBP, además de TXT y JSON.' }
];
</script>

<template>
  <AppShell>
    <div class="section-heading">
      <h2>Guía de uso</h2>
      <p>Consulte instrucciones breves para completar las acciones más frecuentes dentro de MiaServicios.</p>
    </div>

    <section class="help-hero panel-card">
      <div class="help-hero-icon"><i class="fa-solid fa-circle-question"></i></div>
      <div>
        <h2>Encuentre una respuesta rápida</h2>
        <p>La plataforma conserva el avance, organiza los resultados y mantiene las acciones principales disponibles en cada momento.</p>
      </div>
      <router-link :to="{ name: 'text-lab' }" class="btn btn-primary">Abrir espacio de trabajo</router-link>
    </section>

    <div class="help-layout">
      <section class="panel-card">
        <div class="panel-title"><h2>Guías rápidas</h2></div>
        <div class="guide-list">
          <article v-for="guide in guides" :key="guide.id" class="guide-item" :class="{ 'is-open': openItem === guide.id }">
            <button type="button" @click="openItem = openItem === guide.id ? '' : guide.id">
              <span class="guide-icon"><i :class="guide.icon"></i></span>
              <strong>{{ guide.title }}</strong>
              <i :class="openItem === guide.id ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
            </button>
            <ol v-if="openItem === guide.id">
              <li v-for="step in guide.steps" :key="step">{{ step }}</li>
            </ol>
          </article>
        </div>
      </section>

      <aside class="panel-card">
        <div class="panel-title"><h2>Accesos directos</h2></div>
        <div class="help-shortcuts">
          <router-link :to="{ name: 'text-lab' }"><i class="fa-solid fa-pen-to-square"></i><span><strong>Nueva tarea</strong><small>Comience o continúe un borrador.</small></span></router-link>
          <router-link :to="{ name: 'history' }"><i class="fa-solid fa-clock-rotate-left"></i><span><strong>Historial</strong><small>Busque y reutilice resultados.</small></span></router-link>
          <router-link :to="{ name: 'templates' }"><i class="fa-solid fa-layer-group"></i><span><strong>Plantillas</strong><small>Prepare contenido frecuente.</small></span></router-link>
          <router-link :to="{ name: 'settings' }"><i class="fa-solid fa-sliders"></i><span><strong>Configuración</strong><small>Ajuste cuenta, vista y respaldo.</small></span></router-link>
        </div>
      </aside>
    </div>

    <section class="panel-card mt-4">
      <div class="panel-title"><h2>Preguntas frecuentes</h2></div>
      <div class="faq-grid">
        <article v-for="item in questions" :key="item.question">
          <i class="fa-regular fa-circle-check"></i>
          <div><strong>{{ item.question }}</strong><p>{{ item.answer }}</p></div>
        </article>
      </div>
    </section>
  </AppShell>
</template>
