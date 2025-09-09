# Dockerfile pour monorepo Node.js/React
FROM node:18-alpine

# Installer les dépendances système
RUN apk add --no-cache \
    curl \
    postgresql-client \
    redis \
    bash

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Installer les dépendances
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p server/logs server/cache

# Exposer les ports
EXPOSE 3000 3001

# Commande par défaut pour le développement
CMD ["npm", "run", "dev"]