# Discord Bot - FateWeaver

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**FateWeaver Bot** est un bot Discord sophistiqué pour gérer un jeu de rôle avec des mécaniques avancées de gestion de personnages, chantiers communautaires et survie.

## 🌟 Fonctionnalités détaillées

### 🎭 **Système de personnages complet**

- **Création de personnages** avec statistiques personnalisables
- **Points d'action (PA)** régénérables quotidiennement
- **Système de faim** avec niveaux (affamé → mort de faim)
- **États des personnages** : actif/inactif, vivant/mort
- **Reroll** pour recommencer avec un nouveau personnage

### 🏗️ **Gestion avancée des chantiers**

- **Chantiers communautaires** avec objectifs de PA collectifs
- **Progression en temps réel** avec suivi des contributions
- **États multiples** : Planifié → En cours → Terminé
- **Gestion automatique** de la complétion avec logs
- **Interface interactive** avec menus de sélection et modales

### 🍖 **Système économique de nourriture**

- **Stock communautaire** géré par les administrateurs
- **Consommation automatique** lors des repas
- **Système de faim** impactant les capacités des personnages
- **Gestion des pénuries** avec messages d'alerte

### 📊 **Interface d'administration**

- **Gestion complète des personnages** (stats, vie, mort)
- **Contrôle du stock de nourriture**
- **Logs automatiques** des événements importants
- **Commandes sécurisées** avec vérification des permissions

### 🔧 **Architecture technique**

- **Commandes slash** modernes avec auto-complétion
- **Gestion des interactions** (boutons, menus, modales)
- **Middleware de validation** des permissions utilisateur
- **Service API externe** pour la logique métier

## 📋 Commandes disponibles

### 🎮 **Commandes utilisateur**

- `/ping` - Test de connectivité du bot
- `/profil` - Affichage du profil personnage actuel
- `/manger` - Prendre un repas (consomme des vivres)
- `/chantiers liste` - Voir tous les chantiers disponibles
- `/chantiers build` - Investir des PA dans un chantier sélectionné

### ⚙️ **Commandes administrateur**

- `/admin help` - Afficher l'aide administrateur
- `/admin chantiers` - Gestion complète des chantiers (ajout/suppression)
- `/admin personnage` - Gestion des personnages (stats, vie/mort, reroll)
- `/admin nourriture` - Gestion du stock de vivres communautaire

## 🏗️ Structure du projet

```
src/
├── commands/              # Commandes slash Discord
│   ├── admin-commands/    # Commandes réservées aux administrateurs
│   └── user-commands/     # Commandes disponibles pour tous les utilisateurs
├── features/              # Fonctionnalités organisées par domaine
│   ├── chantiers/         # Gestion complète des chantiers
│   │   ├── chantiers.handlers.ts    # Gestion des interactions
│   │   ├── chantiers.utils.ts       # Utilitaires des chantiers
│   │   └── chantiers.command.ts     # Définition de la commande
│   ├── characters/        # Gestion des personnages
│   ├── death/             # Gestion de la mort
│   ├── hunger/            # Système de faim et nourriture
│   ├── admin/             # Interface d'administration
│   └── users/             # Gestion des utilisateurs
├── core/                  # Composants centraux
│   ├── client/            # Configuration du client Discord
│   ├── handlers/          # Gestionnaires d'événements
│   └── middleware/        # Middlewares de validation
├── services/              # Services externes
│   ├── api.ts             # Service API backend
│   ├── logger.ts          # Système de logging
│   └── roles.ts           # Gestion des rôles Discord
├── utils/                 # Utilitaires partagés
│   ├── channels.ts        # Gestion des channels Discord
│   ├── character.ts       # Utilitaires personnages
│   └── modal-handler.ts   # Gestionnaire de modales
└── config/                # Configuration
    └── index.ts           # Configuration centralisée
```

## 🚀 Guide de développement

### Ajouter une nouvelle commande

1. **Créer la structure de fichiers** :

   ```bash
   mkdir -p src/features/nouvelle-feature
   touch src/features/nouvelle-feature/{feature.handlers.ts,feature.utils.ts,feature.command.ts,feature.types.ts}
   ```

2. **Définir les types** dans `feature.types.ts` :

   ```typescript
   export interface NouvelleFeatureData {
     id: string;
     name: string;
     // ... autres propriétés
   }
   ```

3. **Implémenter la logique** dans `feature.handlers.ts` :

   ```typescript
   export async function handleNouvelleFeature(interaction: any) {
     // Logique de traitement
   }
   ```

4. **Créer la commande** dans `feature.command.ts` :

   ```typescript
   import { SlashCommandBuilder } from "discord.js";

   export const command = new SlashCommandBuilder()
     .setName("nouvelle-commande")
     .setDescription("Description de la commande");
   ```

### Configuration des permissions

Le système utilise des **middlewares** pour vérifier les permissions :

```typescript
// Dans les commandes admin
const isUserAdmin = await checkAdmin(interaction);
if (!isUserAdmin) return;
```

### Gestion des erreurs

Le bot implémente une gestion d'erreur complète avec :

- **Logs détaillés** pour le debugging
- **Messages d'erreur conviviaux** pour les utilisateurs
- **Gestion des timeouts** pour les interactions

## 📡 API externe

Le bot communique avec un **backend API externe** pour :

- **Persistance des données** (personnages, chantiers, villes)
- **Logique métier complexe** (calculs, validations)
- **Gestion des états** (actif/inactif, vivant/mort)

### Endpoints principaux utilisés :

- `getChantiersByServer()` - Récupération des chantiers d'un serveur
- `investInChantier()` - Investissement de PA dans un chantier
- `getTownCharacters()` - Récupération des personnages d'une ville
- `killCharacter()` - Gestion de la mort d'un personnage

## 🔧 Configuration

### Variables d'environnement

```env
# Discord
DISCORD_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_GUILD_ID=serveur_de_test  # Vide = déploiement global

# API Backend
API_BASE_URL=http://backend:3000

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### Modes de déploiement

#### 🚀 **Développement (mode guilde)**

- Commandes déployées uniquement sur un serveur de test
- Déploiement instantané
- Idéal pour les tests

```env
DISCORD_GUILD_ID=123456789012345678
```

#### 🌍 **Production (mode global)**

- Commandes déployées sur tous les serveurs
- Propagation jusqu'à 1 heure
- Utilisé en production

```env
DISCORD_GUILD_ID=  # Laisser vide
```

## 🚢 Déploiement

### 1. Build du projet

```bash
npm run build
```

### 2. Déploiement intelligent des commandes

```bash
# Recommandé - déploiement sélectif
npm run deploy

# En cas de problème - déploiement complet
npm run deploy:force
```

### 3. Démarrage du bot

```bash
# Développement avec hot reload
npm run dev

# Production
npm start
```

## 🛠️ Outils de développement

### 📋 **Lister les commandes déployées**

```bash
npm run list-commands
```

### 🔍 **Debugging**

- **Logs détaillés** : `npm run dev` avec logs en temps réel
- **Variables d'environnement** validées au démarrage
- **Gestion d'erreurs** complète avec stack traces

### 🧪 **Tests**

```bash
npm run test          # Lancer tous les tests
npm run test:watch    # Mode watch pour le développement
```

## 📈 Monitoring et logs

### Logs des événements Discord

Le bot envoie automatiquement des messages dans le **channel de logs** configuré :

- 💀 **Morts de personnages** (naturelle, faim, admin)
- 🍽️ **Repas pris** avec stock restant
- 🏗️ **Chantiers terminés** avec nom du chantier et personnage

### Logs applicatifs

- **Erreurs** : Toutes les erreurs sont loggées avec contexte
- **Interactions** : Logs détaillés des commandes exécutées
- **API calls** : Suivi des appels vers le backend

## 🔐 Sécurité

- **Validation des tokens** Discord à chaque requête
- **Vérification des permissions** utilisateur pour les commandes admin
- **Gestion sécurisée** des données sensibles
- **Logs anonymisés** pour la protection de la vie privée

## 🤝 Contribution

### Standards de code

- **TypeScript strict** avec types explicites
- **ESLint** pour la qualité du code
- **Préttier** pour le formatage
- **Tests unitaires** pour les fonctionnalités critiques

### Processus de développement

1. Créer une branche feature
2. Implémenter avec tests
3. Code review
4. Merge après validation

---

**Développé avec ❤️ par [MatthiasBlc](https://github.com/MatthiasBlc)**
