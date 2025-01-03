# Étape 1 : Construction de l'application
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers source
COPY . .

# Construire le projet Next.js
RUN npm run build

# Étape 2 : Lancer l'application
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement le dossier de build depuis l'étape précédente
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Définir la variable d'environnement pour le mode production
ENV NODE_ENV=production

# Exposer le port
EXPOSE 3000

# Lancer l'application Next.js
CMD ["npm", "run", "start"]
