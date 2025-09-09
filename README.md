# 🚀 Eternal Ascent - Système de Base de Données

## 📋 Vue d'ensemble

Ce projet implémente un système complet de persistance pour le jeu RPG "Eternal Ascent" avec :
- **Base de données PostgreSQL** sur Render
- **API REST** avec Express.js
- **Système d'authentification** JWT
- **Sauvegarde automatique** des données
- **Interface React** moderne

## 🗄️ Structure de la Base de Données

### Tables Principales

| Table | Description | Relations |
|-------|-------------|-----------|
| `users` | Comptes utilisateurs | - |
| `characters` | Personnages des joueurs | `user_id` → `users.id` |
| `items_catalog` | Catalogue d'objets | - |
| `character_inventory` | Inventaire des personnages | `character_id` → `characters.id` |
| `dungeons` | Donjons disponibles | - |
| `combat_sessions` | Sessions de combat | `character_id` → `characters.id` |
| `quests` | Quêtes disponibles | - |
| `character_quests` | Progression des quêtes | `character_id` → `characters.id` |
| `guilds` | Guildes | - |
| `guild_members` | Membres de guilde | `guild_id` → `guilds.id` |

### Types ENUM

- **`item_rarity`**: common, uncommon, rare, epic, legendary, mythic
- **`character_class`**: warrior, mage, archer, assassin, tank, healer
- **`item_type`**: weapon, armor, accessory, consumable, material, quest
- **`dungeon_difficulty`**: easy, normal, hard, nightmare, hell
- **`dungeon_status`**: locked, available, completed, mastered

## 🔌 Configuration de la Base de Données

### 1. Nettoyage et Configuration

```bash
# Exécuter le script de configuration
node setup_database.js
```

Ce script :
- Nettoie complètement la base existante
- Crée toutes les tables et types ENUM
- Insère les données de base (objets, donjons, quêtes)
- Configure les index et triggers

### 2. Vérification

```bash
# Tester la connexion
curl http://localhost:3001/api/health
```

## 🚀 Démarrage du Serveur

### 1. Installation des Dépendances

```bash
cd server
npm install
```

### 2. Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur le port 3000 et se connecte automatiquement à PostgreSQL.

## 🔐 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Personnages
- `GET /api/characters/:id` - Récupérer un personnage
- `PUT /api/characters/:id` - Mettre à jour un personnage

### Inventaire
- `GET /api/characters/:id/inventory` - Récupérer l'inventaire
- `PUT /api/characters/:id/inventory` - Mettre à jour l'inventaire

### Donjons
- `GET /api/dungeons` - Liste des donjons disponibles

### Combat
- `POST /api/combat-sessions` - Sauvegarder une session de combat

### Quêtes
- `GET /api/characters/:id/quests` - Quêtes disponibles
- `PUT /api/characters/:id/quests/:questId` - Mettre à jour la progression

## 💾 Système de Sauvegarde Automatique

### Hook React `useAutoSave`

```javascript
import { useAutoSave } from '../hooks/useAutoSave';

const { saveData, forceSave, lastSave, isConnected } = useAutoSave(
  characterData,
  inventoryData,
  {
    autoSaveInterval: 30000,    // 30 secondes
    saveOnUnload: true,         // Sauvegarder avant de quitter
    saveOnChange: true,         // Sauvegarder sur modification
    debounceDelay: 2000         // Délai de debounce
  }
);
```

### Fonctionnalités

- **Sauvegarde périodique** automatique
- **Sauvegarde sur modification** avec debounce
- **Sauvegarde avant fermeture** de la page
- **Sauvegarde locale** en cas d'erreur
- **Restauration** depuis les sauvegardes locales

### Composant de Notification

```javascript
import SaveNotification from '../components/common/SaveNotification';

<SaveNotification
  lastSave={lastSave}
  isConnected={isConnected}
  onForceSave={forceSave}
/>
```

## 🎮 Intégration dans l'Application

### 1. Service de Base de Données

```javascript
import databaseService from '../services/databaseService';

// Vérifier la connexion
const isConnected = await databaseService.checkConnection();

// Authentifier un utilisateur
const authData = await databaseService.authenticateUser(credentials);

// Sauvegarder un personnage
await databaseService.saveCharacterData(characterData);
```

### 2. Hook de Sauvegarde

```javascript
// Dans un composant
const { saveData, forceSave } = useAutoSave(character, inventory);

// Sauvegarder manuellement
await forceSave();
```

### 3. Modal d'Authentification

```javascript
import AuthModal from '../components/auth/AuthModal';

<AuthModal
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  onAuthSuccess={handleAuthSuccess}
/>
```

## 🔧 Configuration Environnement

### Variables d'Environnement

```bash
# .env
REACT_APP_API_URL=http://localhost:3000/api
JWT_SECRET=your_secret_key_here
```

### Configuration de la Base de Données

```javascript
// server/server.js
const dbConfig = {
  host: 'dpg-d2jnela4d50c73891omg-a.frankfurt-postgres.render.com',
  port: 5432,
  database: 'eterna',
  user: 'eterna_user',
  password: 'u5K6UbCBstAUIXvuIEqlaC7ZyHUor79G',
  ssl: { rejectUnauthorized: false }
};
```

## 📱 Interface Utilisateur

### Composants Principaux

- **`SaveNotification`** - Indicateur de statut de sauvegarde
- **`AuthModal`** - Modal d'authentification
- **`useAutoSave`** - Hook de sauvegarde automatique

### Design

- **Thème sombre** par défaut
- **Responsive** pour mobile et desktop
- **Animations** avec Framer Motion
- **Icônes** Lucide React

## 🚨 Gestion des Erreurs

### Sauvegarde de Secours

En cas d'échec de sauvegarde :
1. Tentative de sauvegarde locale
2. Notification d'erreur à l'utilisateur
3. Possibilité de restauration manuelle

### Reconnexion Automatique

- Vérification périodique de la connexion
- Tentative de reconnexion automatique
- Sauvegarde différée jusqu'à reconnexion

## 🔒 Sécurité

### Authentification JWT

- Tokens d'accès avec expiration (24h)
- Vérification des permissions par utilisateur
- Protection des routes sensibles

### Validation des Données

- Vérification des types et formats
- Sanitisation des entrées utilisateur
- Protection contre les injections SQL

## 📊 Performance

### Optimisations

- **Index** sur les clés étrangères
- **Requêtes préparées** avec paramètres
- **Pool de connexions** PostgreSQL
- **Debounce** pour les sauvegardes

### Monitoring

- Logs détaillés des opérations
- Métriques de performance
- Gestion des timeouts

## 🧪 Tests

### Test de Connexion

```bash
# Vérifier la santé de l'API
curl http://localhost:3001/api/health

# Tester l'authentification
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'
```

## 🚀 Déploiement

### Prérequis

- Node.js 16+
- PostgreSQL 12+
- Serveur web (Nginx/Apache)

### Étapes

1. **Configurer** les variables d'environnement
2. **Installer** les dépendances
3. **Construire** l'application React
4. **Démarrer** le serveur Express
5. **Configurer** le reverse proxy

## 📝 Logs et Debug

### Niveaux de Log

- **INFO** - Opérations normales
- **WARN** - Situations d'attention
- **ERROR** - Erreurs critiques
- **DEBUG** - Informations détaillées

### Fichiers de Log

- `server.log` - Logs du serveur
- `database.log` - Logs de la base de données
- `auth.log` - Logs d'authentification

## 🤝 Contribution

### Structure du Code

- **Composants** dans `client/src/components/`
- **Hooks** dans `client/src/hooks/`
- **Services** dans `client/src/services/`
- **Serveur** dans `server/`

### Standards

- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Conventional Commits** pour les messages
- **Tests unitaires** pour les fonctions critiques

## 📞 Support

### Problèmes Courants

1. **Connexion refusée** - Vérifier le serveur et la base
2. **Erreur JWT** - Vérifier la clé secrète
3. **Timeout** - Vérifier la latence réseau
4. **SSL** - Vérifier la configuration TLS

### Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)

---

**Eternal Ascent** - Système de persistance complet et robuste pour votre aventure RPG ! 🎮✨
