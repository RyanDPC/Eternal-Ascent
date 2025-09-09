#!/bin/bash

# Script d'initialisation de la base de données
echo "Initialisation de la base de données..."

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "Erreur: DATABASE_URL n'est pas défini."
  exit 1
fi

# Exécuter les scripts SQL
if [ -f "/app/server/database-schema.sql" ]; then
  echo "Exécution du schéma de base de données..."
  psql "$DATABASE_URL" -f /app/server/database-schema.sql
fi

if [ -f "/app/server/database-views.sql" ]; then
  echo "Exécution des vues de base de données..."
  psql "$DATABASE_URL" -f /app/server/database-views.sql
fi

if [ -f "/app/server/seed-data.js" ]; then
  echo "Exécution du seed data..."
  cd /app/server && node seed-data.js
fi

echo "Initialisation terminée !"
