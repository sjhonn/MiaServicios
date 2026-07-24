# MiaServicios

Aplicación para analizar, organizar y reutilizar contenido desde una interfaz clara, adaptable y orientada al usuario.
Saas - v2.0

## Funciones principales

- Registro, inicio de sesión, perfil y cambio de contraseña.
- Resumen, análisis de sentimiento, palabras clave y clasificación.
- Estadísticas de lectura y limpieza de texto.
- Historial con búsqueda, filtros, ordenamiento, exportación y eliminación.
- Plantillas reutilizables para tareas frecuentes.
- Panel con actividad reciente, accesos directos y estado general.
- Vista Experiencia con recorrido de uso, principios visuales y guía personalizada.
- Carga de imágenes PNG, JPG, WEBP y SVG con almacenamiento en el navegador.
- Exportación del recorrido de usuario en PNG y SVG.
- Uso adaptable en escritorio, tablet y móvil.
- Publicación gratuita desde la carpeta `/docs`.

## Requisitos

- Node.js 20.18 o superior.
- npm 10 o superior.

## Instalación

```bash
npm install
npm run dev
```

Aplicación web: `http://localhost:5173`

Acceso inicial:

```text
demo@mia.local
demo12345
```

## Iconos

No se requiere un comando adicional. `npm install` instala Font Awesome porque la dependencia ya está declarada en el proyecto.

Para incorporarlo manualmente en una copia anterior:

```bash
npm install --workspace=@miaservicios/frontend @fortawesome/fontawesome-free
```

## Validación

```bash
npm run validate
```

## Publicación

```bash
npm run build
```

La compilación se genera en `/docs`. En GitHub Pages seleccione la rama `main` y la carpeta `/docs`.

## Información técnica

La versión del sistema y las tecnologías utilizadas se consultan dentro de la opción **Configuración**, en la sección **Sistemas y versiones**.
