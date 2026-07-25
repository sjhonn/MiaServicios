# MiaServicios

MiaServicios es una plataforma de trabajo para resumir, clasificar, limpiar y revisar contenido. Incluye autenticación, historial, plantillas, respaldos, preferencias visuales y una versión publicada que funciona directamente desde el navegador.

## Funciones principales

- Espacio de trabajo con guardado automático de borradores.
- Importación de archivos TXT de hasta 1 MB.
- Resumen, sentimiento, palabras clave, clasificación, estadísticas y limpieza.
- Historial con búsqueda, filtros, paginación y exportación.
- Plantillas incluidas y personalizadas.
- Respaldo e importación de datos.
- Preferencias de densidad, contraste y movimiento.
- Guía de uso y recorrido visual para el usuario.
- Funcionamiento automático en navegador o con servicios conectados.
- Interfaz responsive para móvil, tablet y escritorio.
- Publicación preparada en la carpeta `docs`.

## Requisitos

- Node.js 20.18 o superior.
- npm 10 o superior.
- Docker es opcional.

## Inicio local completo

```bash
npm install
npm run dev
```

Direcciones:

```text
Interfaz:        http://localhost:5173
API Gateway:     http://localhost:4000
Autenticación:   http://localhost:4001
Procesamiento:   http://localhost:4002
Historial:       http://localhost:4003
```

Acceso inicial:

```text
Correo: demo@mia.local
Contraseña: demo12345
```

## Validar la versión publicada

La carpeta `docs` puede revisarse sin instalar dependencias:

```bash
npm run serve:docs
```

Abra:

```text
http://127.0.0.1:8080
```

## Compilar para producción

```bash
npm install
npm run validate
```

El frontend se genera directamente en:

```text
docs/
```

## Publicar en GitHub Pages

El repositorio incluye el flujo `.github/workflows/pages.yml`. Al enviar cambios a `main`, GitHub Actions instala dependencias, ejecuta las pruebas, compila el frontend y publica `docs`.

También puede utilizar la publicación clásica:

```text
Settings > Pages > Deploy from a branch > main > /docs
```

## Ejecutar con Docker

Copie las variables de ejemplo y ajuste sus valores:

```bash
cp .env.compose.example .env
```

Luego ejecute:

```bash
docker compose up --build
```

Abra:

```text
http://localhost:8080
```

En este modo, la interfaz se conecta automáticamente con los servicios internos mediante el mismo dominio.

## Configuración del funcionamiento

La interfaz utiliza `frontend/public/runtime-config.js` para decidir cómo trabajar:

```js
window.MiaServiciosConfig = {
  mode: 'auto',
  apiUrl: '',
  requestTimeout: 8000
};
```

Valores disponibles:

- `auto`: intenta utilizar servicios conectados y, si no están disponibles, continúa en el navegador.
- `browser`: utiliza almacenamiento y procesamiento del navegador.
- `services`: exige conexión con el API Gateway.

La dirección también puede cambiarse desde `Configuración > Funcionamiento`.

## Comandos

```bash
npm run dev
npm run dev:web
npm run dev:backend
npm run build
npm run serve:docs
npm run start
npm run start:local
npm run check
npm test
npm run validate
```

## Persistencia

El modo navegador utiliza almacenamiento local. El modo conectado utiliza SQLite en:

```text
services/auth-service/data/auth.db
services/history-service/data/history.db
```

Los volúmenes de Docker conservan estos datos entre reinicios.

## Marca visible

La interfaz utiliza únicamente el nombre `MiaServicios`. La numeración técnica se mantiene dentro de archivos de mantenimiento y en la sección `Sistemas y versiones` de Configuración.
