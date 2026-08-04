# MiaServicios

MiaServicios es una plataforma web para analizar, organizar, limpiar y reutilizar contenido. Funciona en desarrollo local, en Docker y como publicación estática mediante la carpeta `docs`.

La interfaz muestra únicamente la marca **MiaServicios**. La información técnica y las versiones se concentran en `Configuración > Sistemas y versiones`.

## Funciones principales

- Resumen de contenido por cantidad de oraciones.
- Análisis de sentimiento.
- Extracción de palabras clave.
- Clasificación temática.
- Estadísticas de lectura y estructura.
- Limpieza y normalización de texto.
- Importación de archivos TXT mediante selección o arrastre.
- Guardado automático y recuperación de borradores.
- Comparación entre contenido original y resultado.
- Exportación en TXT, JSON, PNG, JPG, WEBP e impresión en PDF.
- Historial con búsqueda, filtros, favoritos, detalle, eliminación y restauración.
- Plantillas reutilizables.
- Perfil, cambio de contraseña, respaldo e importación de información.
- Preferencias de contraste, tamaño de texto, densidad y reducción de movimiento.
- Renovación automática de sesión y recuperación controlada cuando el acceso vence.
- Funcionamiento en navegador cuando los servicios no están disponibles.
- Instalación como aplicación web y disponibilidad sin conexión después de la primera carga.
- Diseño responsive para móvil, tablet y escritorio.

## Estructura

El código fuente se organiza en tres carpetas principales:

```text
MiaServicios/
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── ai-service/
│   ├── history-service/
│   ├── tests/
│   └── tools/
├── frontend/
│   ├── deploy/
│   ├── public/
│   └── src/
├── docs/
├── compose.yaml
├── package.json
└── README.md
```

`README.md` es el único archivo Markdown del proyecto. Para ver únicamente `backend`, `frontend` y `docs` en Visual Studio Code, abra el archivo `MiaServicios.code-workspace`.

## Requisitos

- Node.js 20.18 o superior.
- npm 10 o superior.
- Docker Desktop únicamente para la ejecución con contenedores.

## Instalación local

Desde la raíz del proyecto:

```bash
npm install
npm run env:init
npm run dev
```

Abra:

```text
http://localhost:5173
```

Servicios locales:

```text
Interfaz:       http://localhost:5173
API principal:  http://localhost:4000
Acceso:         http://localhost:4001
Procesamiento:  http://localhost:4002
Historial:      http://localhost:4003
```

Credenciales iniciales:

```text
Correo: demo@mia.local
Contraseña: demo12345
```

`npm run env:init` crea claves aleatorias seguras en `.env`. Si el archivo ya existe, no se reemplaza. Para regenerarlo de forma intencional:

```bash
npm run env:init -- --force
```

## Validación

Ejecute todas las comprobaciones antes de publicar:

```bash
npm run validate
```

La validación comprueba:

- Estructura principal con `backend`, `frontend` y `docs`.
- Existencia de un único archivo Markdown: `README.md`.
- Sintaxis de servicios y herramientas.
- Pruebas del procesamiento de contenido.
- Pruebas de sesión.
- Compilación de producción del frontend.

## Producción con Docker

Genere el archivo `.env` una sola vez:

```bash
npm run env:init
```

Valide la configuración:

```bash
npm run docker:config
```

Construya e inicie MiaServicios:

```bash
npm run docker:up
```

Abra:

```text
http://localhost:8080
```

Consulte el estado:

```bash
npm run docker:status
```

Detenga únicamente MiaServicios, sin eliminar sus volúmenes:

```bash
npm run docker:down
```

El proyecto Compose usa el nombre fijo `miaservicios`, por lo que no modifica otros proyectos como `login-admin`. No utilice `docker compose down -v`, `docker volume prune` ni `docker system prune` si desea conservar bases de datos y recursos existentes.

Para cambiar el puerto publicado, modifique `WEB_PORT` dentro de `.env`:

```text
WEB_PORT=8081
```

## Publicación en GitHub Pages

Genere la carpeta pública:

```bash
npm run build:pages
```

El resultado se guarda en `docs`. Suba el proyecto al repositorio y configure GitHub Pages con:

```text
Branch: main
Folder: /docs
```

En GitHub Pages, MiaServicios funciona en modo navegador y conserva la información mediante el almacenamiento local. No requiere servidor, base de datos externa ni servicio de pago.

## Comandos disponibles

```text
npm run dev             Inicia frontend y backend para desarrollo.
npm run dev:frontend    Inicia únicamente la interfaz.
npm run dev:backend     Inicia únicamente los servicios.
npm run build           Genera la carpeta docs.
npm run preview         Previsualiza la compilación.
npm run serve:docs      Sirve docs en http://127.0.0.1:8080.
npm run start:local     Inicia servicios y la publicación de docs.
npm run env:init        Crea el archivo .env con secretos aleatorios.
npm run check           Revisa estructura y sintaxis.
npm test                Ejecuta pruebas funcionales internas.
npm run validate        Ejecuta revisión, pruebas y compilación.
npm run docker:up       Construye e inicia los contenedores.
npm run docker:status   Muestra el estado de los contenedores.
npm run docker:down     Detiene MiaServicios sin borrar volúmenes.
```

## Datos persistentes

En ejecución local, las bases se crean dentro de:

```text
backend/auth-service/data/
backend/history-service/data/
```

En Docker, los datos se conservan mediante los volúmenes del proyecto `miaservicios`.

## Seguridad operativa

- No suba el archivo `.env` al repositorio.
- Cambie la contraseña inicial después del primer acceso en un entorno compartido.
- Mantenga `JWT_SECRET` y `SERVICE_KEY` con valores aleatorios independientes.
- Publique la aplicación detrás de HTTPS cuando se exponga fuera del equipo local.
- Conserve copias de seguridad antes de eliminar historial o volúmenes.

## Solución rápida de problemas

### La sesión aparece vencida

Cierre sesión y vuelva a ingresar. MiaServicios intenta renovar el acceso automáticamente y elimina sesiones incompatibles cuando ya no pueden recuperarse.

### Docker no inicia por variables faltantes

```bash
npm run env:init
npm run docker:config
npm run docker:up
```

### El navegador muestra una compilación anterior

Recargue con `Ctrl + F5`. Si la aplicación informa que existe una actualización, utilice `Actualizar ahora`.

### El puerto 8080 está ocupado

Cambie `WEB_PORT` en `.env` y vuelva a ejecutar:

```bash
npm run docker:up
```

## Licencia

El proyecto incluye un archivo `LICENSE` con los términos aplicables.
