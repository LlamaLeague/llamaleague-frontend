FROM node:16.20.2-slim

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias incluyendo steam-resources desde GitHub
RUN npm install
RUN npm install seishun/node-steam-resources

# Copiar código
COPY index.js ./

CMD ["node", "index.js"]
