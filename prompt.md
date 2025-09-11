# ✅ Contraintes non négociables

- Architecture 100% dynamique: toute donnée vient de la DB → backend → frontend (aucun mock, aucun JSON statique, aucune valeur fallback).
- DB distante Render: ne pas installer Postgres en local. Utiliser l’`env DATABASE_URL` pour toutes connexions/migrations/seeds.
- Deux réponses JSON par page front:
  - 1) un JSON imbriqué “complet” (toutes les données nécessaires à la page)
  - 2) un JSON de “stats calculées” (dérivés/agrégations)
- Nommage et structure:
  - Respect des conventions de nommage claires et consistantes.
  - Ne crée jamais de fichiers préfixés “Optimized…”. Intègre les optimisations dans les fichiers existants.
  - Services de calcul robustes et complets (pas “simplifiés”).
- UI: design classique, minimaliste, propre. Pas d’ornements superflus.
- Pas de logique/données hardcodées. Supprimer toutes les données figées de démo/fixtures non conformes.

---

## 🧹 Étape 1 — Nettoyage complet du projet

- Supprime tout fichier/dossier obsolète, redondant ou non référencé par les 3 .md.
- Supprime mocks, fixtures statiques, JSON statiques, exemples non conformes.
- Supprime fichiers/dossiers “Optimized…” et variantes.
- Conserve uniquement l’architecture minimale et nécessaire pour implémenter la DB, l’API et le Front.

Livrable:
- Un récapitulatif des suppressions (liste courte + justification).
- Un arbre de projet final propre.

---

## 🗄️ Étape 2 — Reconstruction DB (Postgres)

- Implémente exactement le schéma de `DATABASE_STRUCTURE.md`:
  - Tables, colonnes, index, contraintes (PK, FK, uniques), enums, relations.
- Génère des migrations idempotentes adaptées à Postgres.
- Prépare des seeds conformes aux spécifications (données réalistes, cohérentes).
- Se connecte via `process.env.DATABASE_URL` (Render). Ne jamais tenter une instance locale.

Livrables:
- Dossier des migrations et script(s) de migration.
- Script(s) de seed idempotent(s).
- Documentation succincte “comment lancer migrations + seeds”.

---

## 🧰 Étape 3 — Backend (API REST/GraphQL)

- Tech: Node.js + (stack existante du repo: Express/Nest/etc.), TypeScript si présent.
- Implémente tous les endpoints prévus par `API_DOCUMENTATION.md`:
  - Authentification, utilisateurs/personnages, données statiques, systèmes de jeu, pages “optimisées”.
  - Valider l’entrée (ex: zod/joi/class-validator selon stack) et renvoyer des erreurs propres.
  - Respecter les statuts HTTP et la sécurité (auth, rate limit si indiqué).
- Par page front, exposer 2 endpoints:
  - “data complète imbriquée”
  - “stats calculées”
- Implémenter la logique de relations/join/agrégations côté service, sans hardcode.
- Interdire toute donnée bidon. Si vide, renvoyer 204/404 approprié (sans valeurs par défaut inventées).

Livrables:
- Liste des endpoints implémentés (méthode + route).
- Schéma de validation par endpoint.
- Tests minimums (unitaires/services) si présents dans le projet.

---

## 🖥️ Étape 4 — Frontend (aligné sur Features)

- Aligner routes/pages/composants avec `FEATURES_DOCUMENTATION.md`:
  - `/`, `/login`, `/register`, `/dashboard`, `/character`, `/achievements`, `/dungeons`, `/game`, `/quests`, `/guilds`, `/friends`, `/settings`, `/inventory`, `/stats`, `/demo`, `/admin` (selon doc).
- Récupérer systématiquement les données depuis les endpoints backend définis:
  - Utiliser les 2 flux par page: “data complète” + “stats calculées”.
  - Aucun JSON local ni fixture.
- UI sobre, maintenable:
  - Dossiers clairs, composants réutilisables, séparation data/présentation.
  - Gestion d’état (selon stack existante) propre et limitée aux besoins.

Livrables:
- Liste des pages et composants clés.
- Points d’intégration API (qui appelle quoi).
- Indication des “données complètes” vs “stats” consommées par page.

---

## 🔗 Cohérence globale

- Vérifier de bout en bout: DB → services → contrôleurs → routes → front → rendu.
- Vérifier toutes les relations (ex: personnage ↔ inventaire ↔ items).
- Vérifier que chaque affichage correspond à des données issues de la DB.

---

## 🧪 Qualité & Maintenabilité

- Types stricts, contrôles d’erreurs, logs utiles.
- Arborescence modulaire, séparation claire (domain/services/controllers/routes/ui).
- Documentation courte aux endroits complexes (calculs, agrégations, règles métier).

---

## 📦 Sorties attendues (checklist)

- [ ] Arbre du projet final (post-nettoyage).
- [ ] Migrations Postgres + scripts.
- [ ] Seeds idempotents.
- [ ] API complète selon `API_DOCUMENTATION.md`.
- [ ] Double endpoints par page (data complète + stats calculées).
- [ ] Front aligné sur `FEATURES_DOCUMENTATION.md`, sans données statiques.
- [ ] README “lancer localement contre DB Render”:
  - Variables requises (incl. `DATABASE_URL`).
  - Commandes: installer, migrer, seed, lancer backend, lancer frontend.
- [ ] Courte note “écarts résolus” si ambiguïtés entre code et docs.

---

## 🚫 À ne pas faire

- ❌ Aucune donnée hardcodée / dummy / fixture non conforme.
- ❌ Aucun fallback inventé si data manquante (retourner statut correct).
- ❌ Aucun fichier préfixé “Optimized…”.
- ❌ Aucune déviation par rapport aux 3 .md sans justification.