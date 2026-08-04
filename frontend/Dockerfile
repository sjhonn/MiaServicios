# Construye y publica la interfaz de MiaServicios.
FROM node:20-bookworm-slim AS build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/docs /usr/share/nginx/html
EXPOSE 80
