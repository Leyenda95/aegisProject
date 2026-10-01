# Imagen del backend para el despliegue en Railway (ver railway.json).
# Se construye desde la raíz del repo, porque el backend importa el
# contrato compilado, su material ZK y los witnesses de ../contract.
FROM node:22-bookworm-slim

WORKDIR /app

# Primero solo los package.json, para que Docker reutilice la capa de
# dependencias mientras no cambien. El de frontend hace falta porque el
# package-lock.json de los workspaces lo referencia.
COPY package.json package-lock.json ./
COPY contract/package.json contract/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace=@aegis/backend

COPY contract/ contract/
COPY backend/ backend/

# Los ficheros de estado (.contract-address-*, .admin-key-*, .store-key-*)
# se escriben en el directorio de trabajo, así que se arranca desde /data,
# donde va montado el volumen de Railway, para que sobrevivan a los
# reinicios y redespliegues.
WORKDIR /data
ENV TSX_TSCONFIG_PATH=/app/backend/tsconfig.json
EXPOSE 3001
CMD ["/app/node_modules/.bin/tsx", "/app/backend/src/index.ts"]
