#!/bin/bash

# Script d'initialisation de la base de données (Render-compatible, sans psql)
set -euo pipefail

echo "Initialisation de la base de données..."

# Vérifier que DATABASE_URL est défini
if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur: DATABASE_URL n'est pas défini."
  exit 1
fi

# Déterminer le chemin du repo et du dossier server
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

# Si on est dans un conteneur (WORKDIR /app), utiliser le chemin /app/server
if [ -d "/app/server" ]; then
  SERVER_DIR="/app/server"
fi

echo "Application du schéma, des vues et des seeds via Node..."
node "$SERVER_DIR/scripts/reset-and-seed.js"

echo "Initialisation terminée !"
