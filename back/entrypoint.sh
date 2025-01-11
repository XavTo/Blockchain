#!/bin/bash

# Appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer le superutilisateur si il n'existe pas déjà
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
EOF

# Lancer le serveur Django
exec gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000}
