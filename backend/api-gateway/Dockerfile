# Ejecuta el servicio Node.js en un contenedor.
FROM node:20-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json ./
RUN npm install --omit=dev
COPY --chown=node:node src ./src
RUN mkdir -p /app/data && chown -R node:node /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
USER node
CMD ["npm", "start"]
