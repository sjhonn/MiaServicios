// Gestiona plantillas de texto almacenadas en el navegador.
const storageKey = 'mia_templates_v2';
const defaults = [
  {
    id: 'default-technology',
    title: 'Informe de servicio',
    category: 'Servicio',
    builtIn: true,
    text: 'El servicio registró una mejora sostenida en el tiempo de atención y en la resolución de solicitudes durante el primer contacto. Los usuarios destacaron la claridad de las respuestas y la facilidad para realizar seguimiento. Se recomienda mantener la revisión semanal de casos pendientes y reforzar la comunicación preventiva.'
  },
  {
    id: 'default-operations',
    title: 'Reporte de operaciones',
    category: 'Operaciones',
    builtIn: true,
    text: 'El proceso de distribucion registro una mejora en el tiempo de entrega y una reduccion de errores de inventario. La coordinacion entre almacen, transporte y servicio al cliente permitio mantener la calidad. Se recomienda continuar con el monitoreo de tiempos, incidencias y nivel de cumplimiento.'
  },
  {
    id: 'default-security',
    title: 'Incidente de seguridad',
    category: 'Seguridad',
    builtIn: true,
    text: 'El equipo detecto intentos de acceso no autorizado sobre una cuenta de pruebas. La autenticacion fue bloqueada y los tokens activos fueron revocados. No se identifico perdida de datos, pero se establecio una revision de permisos, registros de auditoria y reglas de acceso.'
  }
];

const readCustom = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
};

const writeCustom = (items) => localStorage.setItem(storageKey, JSON.stringify(items));

export const templateRepository = {
  list: () => [...defaults, ...readCustom()],
  create: ({ title, category, text }) => {
    const item = { id: crypto.randomUUID(), title, category, text, builtIn: false, createdAt: new Date().toISOString() };
    writeCustom([item, ...readCustom()]);
    return item;
  },
  remove: (id) => writeCustom(readCustom().filter((item) => item.id !== id)),
  export: () => readCustom(),
  import: (items) => {
    const valid = Array.isArray(items) ? items.filter((item) => item?.title && item?.text) : [];
    writeCustom(valid.map((item) => ({ ...item, id: item.id || crypto.randomUUID(), builtIn: false })));
  },
  clear: () => localStorage.removeItem(storageKey)
};
