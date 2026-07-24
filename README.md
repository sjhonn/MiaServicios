<!-- Describe la instalacion y operacion de MiaServicios. -->
# MiaServicios

Plataforma de procesamiento de texto con arquitectura de microservicios en Node.js y una interfaz Vue 3 preparada para GitHub Pages.

## Componentes

- `frontend`: Vue 3, Vite, Pinia, Vue Router, Bootstrap 4.6.2 y Font Awesome.
- `api-gateway`: entrada unificada y orquestacion de servicios.
- `auth-service`: registro, inicio de sesion y validacion JWT con SQLite.
- `ai-service`: resumen, sentimiento, palabras clave y clasificacion mediante NLP local.
- `history-service`: persistencia del historial en SQLite.
- `docs`: compilacion estatica lista para GitHub Pages.

## Requisitos

- Node.js 22.18 o superior.
- npm 10 o superior.

## Ejecucion completa

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Gateway: `http://localhost:4000`

Credenciales iniciales:

```text
demo@mia.local
demo12345
```

## Compilacion para GitHub Pages

```bash
npm run build
```

El resultado se genera en `/docs`. En GitHub, seleccione `Settings > Pages > Deploy from a branch > main > /docs`.

La compilacion de produccion usa modo demostracion local para que GitHub Pages funcione sin un servidor. Para conectar un backend remoto, edite `frontend/.env.production` y establezca `VITE_DEMO_MODE=false` junto con `VITE_API_URL`.
