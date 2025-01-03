# Utilise une image officielle Python
FROM python:3.11

# Définit le répertoire de travail
WORKDIR /app

# Copie les fichiers de configuration
COPY requirements.txt requirements.txt

# Installe les dépendances
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copie tout le contenu du projet
COPY . .

# Copie le script d'entrypoint et le rend exécutable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose le port 8000
EXPOSE 8000

# Utilise le script d'entrypoint
ENTRYPOINT ["/entrypoint.sh"]
