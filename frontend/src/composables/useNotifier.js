// Administra notificaciones breves de la interfaz.
import { reactive } from 'vue';

const notifications = reactive([]);

const remove = (id) => {
  const index = notifications.findIndex((item) => item.id === id);
  if (index >= 0) notifications.splice(index, 1);
};

const push = (message, type = 'info', timeout = 3200) => {
  const id = crypto.randomUUID();
  notifications.push({ id, message, type });
  window.setTimeout(() => remove(id), timeout);
};

export const useNotifier = () => ({ notifications, push, remove });
