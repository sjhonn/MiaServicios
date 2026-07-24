<!-- Administra plantillas reutilizables para las herramientas de texto. -->
<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '../layouts/AppShell.vue';
import EmptyState from '../components/EmptyState.vue';
import { useNotifier } from '../composables/useNotifier.js';
import { templateRepository } from '../services/templateRepository.js';

const router = useRouter();
const { push } = useNotifier();
const templates = ref(templateRepository.list());
const search = ref('');
const showForm = ref(false);
const form = reactive({ title: '', category: 'General', text: '' });
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return templates.value.filter((item) => !term || `${item.title} ${item.category} ${item.text}`.toLowerCase().includes(term));
});

const resetForm = () => {
  form.title = '';
  form.category = 'General';
  form.text = '';
  showForm.value = false;
};

const create = () => {
  if (form.title.trim().length < 3 || form.text.trim().length < 20) {
    push('Complete un titulo y un texto de al menos 20 caracteres.', 'danger');
    return;
  }
  const item = templateRepository.create({ title: form.title.trim(), category: form.category.trim() || 'General', text: form.text.trim() });
  templates.value = [item, ...templates.value];
  resetForm();
  push('Plantilla guardada.', 'success');
};

const remove = (item) => {
  if (item.builtIn || !window.confirm('Se eliminara esta plantilla personalizada.')) return;
  templateRepository.remove(item.id);
  templates.value = templates.value.filter((current) => current.id !== item.id);
  push('Plantilla eliminada.', 'success');
};

const useTemplate = (item, operation = 'summarize') => {
  sessionStorage.setItem('mia_lab_draft', JSON.stringify({ text: item.text, operation }));
  router.push({ name: 'text-lab' });
};

const copy = async (item) => {
  await navigator.clipboard.writeText(item.text);
  push('Texto copiado al portapapeles.', 'success');
};
</script>

<template>
  <AppShell>
    <div class="section-heading section-heading-row">
      <div>
        <h2>Plantillas de contenido</h2>
        <p>Guarde contenido frecuente y reutilícelo directamente en una nueva tarea.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showForm = !showForm">
        <i class="fa-solid fa-plus mr-2"></i>Nueva plantilla
      </button>
    </div>

    <section v-if="showForm" class="panel-card mb-4">
      <div class="panel-title">
        <h2>Crear plantilla</h2>
        <button type="button" class="btn btn-outline-light btn-sm" @click="resetForm"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="row">
        <div class="col-md-8 form-group">
          <label for="template-title">Titulo</label>
          <input id="template-title" v-model="form.title" type="text" class="form-control" maxlength="80">
        </div>
        <div class="col-md-4 form-group">
          <label for="template-category">Categoria</label>
          <input id="template-category" v-model="form.category" type="text" class="form-control" maxlength="40">
        </div>
      </div>
      <div class="form-group">
        <label for="template-text">Contenido</label>
        <textarea id="template-text" v-model="form.text" class="form-control" rows="6" maxlength="20000"></textarea>
      </div>
      <button type="button" class="btn btn-primary" @click="create"><i class="fa-solid fa-floppy-disk mr-2"></i>Guardar plantilla</button>
    </section>

    <section class="panel-card mb-4">
      <label for="template-search">Buscar plantillas</label>
      <div class="input-group">
        <div class="input-group-prepend"><span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span></div>
        <input id="template-search" v-model="search" type="search" class="form-control" placeholder="Buscar por titulo, categoria o contenido">
      </div>
    </section>

    <section v-if="filtered.length" class="template-grid">
      <article v-for="item in filtered" :key="item.id" class="template-card">
        <div class="template-card-header">
          <div>
            <span class="template-category">{{ item.category }}</span>
            <h3>{{ item.title }}</h3>
          </div>
          <span v-if="item.builtIn" class="template-origin">Incluida</span>
        </div>
        <p>{{ item.text }}</p>
        <div class="template-card-actions">
          <button type="button" class="btn btn-primary btn-sm" @click="useTemplate(item)"><i class="fa-solid fa-arrow-up-right-from-square mr-2"></i>Usar</button>
          <button type="button" class="btn btn-outline-light btn-sm" @click="copy(item)"><i class="fa-regular fa-copy"></i></button>
          <button v-if="!item.builtIn" type="button" class="btn btn-outline-danger btn-sm" @click="remove(item)"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </article>
    </section>

    <EmptyState v-else title="No hay plantillas coincidentes" description="Cambie la busqueda o cree una plantilla personalizada." icon="fa-solid fa-layer-group" />
  </AppShell>
</template>
