# Cahier des charges complet et exhaustif - FateWeaver Bot

## Vue d'ensemble du projet

**FateWeaver Bot** est une application fullstack complète de jeu de rôle (RPG) conçue spécifiquement pour Discord. Il s'agit d'un système sophistiqué de gestion de personnages dans un univers médiéval-fantastique avec des mécaniques avancées de survie communautaire, de progression économique et de gouvernance sociale.

## Architecture technique détaillée

### Composants principaux

1. **Bot Discord (TypeScript/Node.js/ESM)**

   - Interface utilisateur principale via commandes slash Discord modernes
   - Gestion complète des interactions (boutons, menus déroulants, modales, auto-complétion)
   - Communication bidirectionnelle avec l'API backend via HTTP/REST
   - Gestion intelligente du déploiement avec système anti-rate-limiting

2. **Backend API (TypeScript/Node.js/Express)**

   - API REST complète fournissant toute la logique métier
   - Gestion de la persistance des données via Prisma ORM
   - Tâches planifiées (cron jobs) pour l'automatisation
   - Middleware de sécurité et d'authentification

3. **Base de données (PostgreSQL avec Prisma ORM)**

   - Stockage persistant de tous les états du jeu
   - Relations complexes entre entités avec contraintes d'intégrité
   - Index optimisés pour les performances

4. **Frontend (React/TypeScript - en cours de développement)**
   - Interface web optionnelle pour l'administration avancée
   - Actuellement en phase de boilerplate (structure de base)

### Infrastructure de déploiement

- **Docker Compose** complet pour l'environnement de développement
- **Docker Compose production** optimisé pour le déploiement
- **PostgreSQL 15** en conteneur avec persistance
- **Réseau interne** sécurisé pour la communication inter-services
- **Volumes persistants** pour les données et logs
- **Health checks** automatiques pour tous les services

## Modèle de données complet (Prisma Schema)

### **Session** (Gestion des sessions utilisateur)

```prisma
model Session {
  id        String   @id              // Identifiant unique de session
  sid       String   @unique           // Session ID pour Express
  data      String                     // Données sérialisées de la session
  expiresAt DateTime                   // Expiration automatique de la session
}
```

- **Usage** : Gestion des sessions Express pour l'authentification temporaire
- **Mécanique** : Nettoyage automatique des sessions expirées
- **Sécurité** : Stockage temporaire des données de session

### **User** (Utilisateurs Discord)

```prisma
model User {
  id            String      @id @default(cuid())
  discordId     String      @unique           // ID Discord unique obligatoire
  username      String                        // Nom d'utilisateur actuel Discord
  discriminator String                        // Discriminateur Discord (#1234)
  globalName    String?                       // Nom d'affichage global (peut être null)
  avatar        String?                       // Hash de l'avatar Discord
  characters    Character[]                   // Personnages appartenant à l'utilisateur
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
}
```

- **Association Discord** : Mapping 1:1 avec les comptes Discord
- **Évolution** : Mise à jour automatique lors des interactions Discord
- **Synchronisation** : Informations Discord mises à jour en temps réel

### **Guild** (Serveurs Discord)

```prisma
model Guild {
  id             String   @id @default(cuid())
  discordGuildId String   @unique @map("discord_guild_id")  // ID Discord du serveur
  name           String                        // Nom actuel du serveur
  memberCount    Int      @default(0)         // Nombre de membres actuel
  logChannelId   String?                       // ID du salon pour les logs automatiques
  town           Town?                         // Ville associée (relation 1:1)
  roles          Role[]                        // Rôles disponibles du serveur
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
}
```

- **Synchronisation** : `memberCount` mis à jour automatiquement lors des événements Discord
- **Logs** : `logChannelId` optionnel pour les événements automatiques du jeu
- **Association** : Chaque serveur Discord contrôle exactement une ville dans le jeu

### **Town** (Villes du jeu)

```prisma
model Town {
  id         String      @id @default(cuid())
  name       String                        // Nom de la ville dans le jeu
  foodStock  Int         @default(100) @map("food_stock")  // Stock communautaire
  guild      Guild       @relation(fields: [guildId], references: [id], onDelete: Cascade)
  guildId    String      @unique @map("guild_id")  // Association 1:1 avec le serveur
  characters Character[]                   // Habitants de la ville
  chantiers  Chantier[]                    // Projets communautaires de la ville
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")
}
```

- **Économie** : Stock de nourriture communautaire géré collectivement
- **Association** : Chaque serveur Discord contrôle une ville unique dans le jeu

### **Character** (Personnages des joueurs)

```prisma
model Character {
  id             String          @id @default(cuid())
  name           String                        // Nom du personnage (obligatoire)
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId         String          @map("user_id")  // Propriétaire du personnage
  town           Town            @relation(fields: [townId], references: [id], onDelete: Cascade)
  townId         String          @map("town_id")  // Ville d'appartenance
  characterRoles CharacterRole[]              // Rôles assignés au personnage
  paTotal        Int             @default(2)   // Points d'action disponibles (0-4)
  lastPaUpdate   DateTime        @default(now()) @map("last_pa_update")  // Dernière régénération
  hungerLevel    Int             @default(4) @map("hunger_level")  // Niveau de faim (4-0)
  hp             Int             @default(5) @map("hp")  // Points de vie (0-5)
  pm             Int             @default(5) @map("pm")  // Points mentaux (0-5)
  isDead         Boolean         @default(false) @map("is_dead")  // État de vie du personnage
  canReroll      Boolean         @default(false) @map("can_reroll")  // Possibilité de reroll
  isActive       Boolean         @default(true) @map("is_active")  // Personnage actif
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  // Index d'optimisation (pas de contrainte unique)
  @@index([userId])
  @@index([townId])
  @@index([userId, townId])
  @@index([userId, townId, isActive])
}
```

- **Régénération** : `lastPaUpdate` suivi pour la régénération quotidienne à minuit
- **Rôles** : Association n:n avec les rôles Discord via CharacterRole
- **Contraintes** : Unicité gérée par logique applicative (pas de contrainte DB)

### **Chantier** (Projets communautaires)

```prisma
model Chantier {
  id        String         @id @default(cuid())
  name      String                          // Nom unique par ville
  startDate DateTime?      @map("start_date")  // Date du premier investissement (null si pas commencé)
  cost      Int                             // Coût total en PA requis
  spendOnIt Int            @default(0)      // PA déjà investis
  status    ChantierStatus @default(PLAN)  // État actuel du projet
  town      Town           @relation(fields: [townId], references: [id], onDelete: Cascade)
  townId    String         @map("town_id")  // Ville propriétaire
  createdBy String         @map("created_by")  // ID Discord du créateur
  createdAt DateTime       @default(now()) @map("created_at")
  updatedAt DateTime       @updatedAt @map("updated_at")

  @@unique([name, townId], name: "chantier_name_town_unique")
}
```

- **États** : `PLAN` → `IN_PROGRESS` → `COMPLETED`
- **Progression** : `startDate` défini au premier investissement de PA
- **Unicité** : Nom unique par ville (contrainte DB)

### **Role** (Rôles Discord)

```prisma
model Role {
  id         String          @id @default(cuid())
  discordId  String                        // ID du rôle Discord
  name       String                        // Nom actuel du rôle
  color      String?                       // Couleur hexadécimale du rôle
  guild      Guild          @relation(fields: [guildId], references: [id])
  guildId    String          @map("guild_id")  // Serveur propriétaire
  characters CharacterRole[]              // Assignations aux personnages
  createdAt  DateTime       @default(now()) @map("created_at")
  updatedAt  DateTime       @updatedAt @map("updated_at")

  @@unique([discordId, guildId], name: "role_guild_unique")
}
```

- **Synchronisation** : Miroir automatique des rôles Discord du serveur
- **Couleurs** : Conservation de la couleur d'origine du rôle Discord

### **CharacterRole** (Association Personnage-Rôle)

```prisma
model CharacterRole {
  id          String    @id @default(cuid())
  character   Character @relation(fields: [characterId], references: [id])
  characterId String    @map("character_id")  // Personnage assigné
  role        Role      @relation(fields: [roleId], references: [id])
  roleId      String    @map("role_id")       // Rôle assigné
  assignedAt  DateTime  @default(now()) @map("assigned_at")  // Date d'assignation
  username    String    @map("username")      // Nom d'utilisateur au moment de l'assignation
  roleName    String    @map("role_name")     // Nom du rôle au moment de l'assignation
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@unique([characterId, roleId], name: "character_role_unique")
}
```

- **Historique** : Conservation du nom utilisateur/rôle au moment de l'assignation
- **Traçabilité** : `assignedAt` pour l'historique des assignations de rôles

### **Enumération ChantierStatus**

```prisma
enum ChantierStatus {
  PLAN        // Chantier créé, pas encore commencé
  IN_PROGRESS // Chantier actif avec investissements
  COMPLETED   // Chantier terminé avec récompenses distribuées
}
```

## Relations et contraintes d'intégrité

### **Clés étrangères avec cascade**

- **User** → **Character** (1:n) - Suppression des personnages si utilisateur supprimé
- **Guild** → **Town** (1:1) - Suppression de la ville si serveur supprimé
- **Town** → **Character** (1:n) - Suppression des personnages si ville supprimée
- **Town** → **Chantier** (1:n) - Suppression des chantiers si ville supprimée
- **Guild** → **Role** (1:n) - Suppression des rôles si serveur supprimé
- **Character** ↔ **CharacterRole** (n:n) - Association bidirectionnelle
- **Role** ↔ **CharacterRole** (n:n) - Association bidirectionnelle

### **Contraintes d'unicité**

- `User.discordId` - Un seul compte Discord par utilisateur
- `Guild.discordGuildId` - Un seul serveur Discord dans le système
- `Town.guildId` - Une seule ville par serveur Discord
- `Chantier.name, townId` - Nom de chantier unique par ville
- `Role.discordId, guildId` - Rôle Discord unique par serveur
- `CharacterRole.characterId, roleId` - Association personnage-rôle unique

### **Indexes d'optimisation**

- `Character.userId` - Recherche rapide des personnages d'un utilisateur
- `Character.townId` - Recherche rapide des personnages d'une ville
- `Character.userId, townId` - Recherche rapide des personnages par utilisateur et ville
- `Character.userId, townId, isActive` - Recherche des personnages actifs

## Fonctionnalités détaillées

### 🎭 Système de personnages

**Mécaniques :**

- **Points d'Action (PA)** : Régénération quotidienne (minuit)
- **Système de faim** : 5 niveaux (4: sain → 0: mort)
- **États de personnage** : actif/inactif, vivant/mort
- **Reroll** : recommencer avec un nouveau personnage
- **Association Discord** : 1 utilisateur = 1 personnage actif par ville

### 🏗️ Système de chantiers communautaires

**États du chantier :**

- `PLAN` : Chantier créé, pas encore commencé
- `IN_PROGRESS` : Chantier actif avec investissements
- `COMPLETED` : Chantier terminé avec récompenses

**Mécaniques :**

- **Investissement collectif** : Les utilisateurs investissent leurs PA
- **Progression temps réel** : Aucun timer automatique, progression manuelle
- **Création admin uniquement** : Seuls les administrateurs peuvent créer des chantiers
- **Logs automatiques** : Messages Discord lors de la complétion

### 🍖 Système économique de nourriture

**Mécaniques :**

- **Stock communautaire** : Géré par ville (1 ville = 1 serveur Discord)
- **Consommation repas** : `/manger` consomme 1 nourriture du stock
- **Gestion administrative** : Les admins peuvent ajuster le stock
- **Système de faim** : Impacte les capacités des personnages
- **Alertes pénurie** : Messages automatiques quand le stock est bas

### 🏘️ Gestion des villes et guildes

**Mécaniques :**

- **Association 1:1** : 1 serveur Discord = 1 ville dans le jeu
- **Channel de logs** : Configuration optionnelle pour les événements automatiques
- **Permissions Discord** : Utilisation des rôles Discord pour les accès admin

## API Backend - Endpoints complets

### **🏗️ Chantiers**

- `GET /chantier/guild/:guildId` - Liste des chantiers d'un serveur
- `GET /chantier/:id` - Détails d'un chantier spécifique
- `POST /chantier` - Créer un nouveau chantier (admin uniquement)
- `POST /chantier/:chantierId/invest` - Investir des PA dans un chantier
- `DELETE /chantier/:id` - Supprimer un chantier (admin uniquement)

### **🎭 Personnages**

- `GET /characters/town/:townId` - Liste des personnages d'une ville
- `GET /characters/user/:userId/town/:townId` - Personnage d'un utilisateur dans une ville
- `POST /characters` - Créer un nouveau personnage
- `PATCH /characters/:id/stats` - Modifier les statistiques d'un personnage
- `DELETE /characters/:id` - Tuer un personnage (admin uniquement)

### **🏘️ Villes et Guildes**

- `GET /towns/guild/:guildId` - Ville associée à une guilde Discord
- `GET /guilds/discord/:guildId` - Informations complètes de guilde
- `POST /guilds/log-channel` - Configurer le channel de logs automatique
- `GET /guilds/:id/roles` - Liste des rôles du serveur

### **👥 Utilisateurs**

- `GET /users/:id` - Informations complètes d'un utilisateur
- `POST /users` - Créer un utilisateur Discord (automatique)
- `GET /users/discord/:discordId` - Recherche par ID Discord

### **⚡ Points d'action**

- `POST /action-point/regenerate` - Régénération manuelle des PA (cron job)
- `GET /action-point/status` - Statut de régénération des PA

### **🎭 Rôles**

- `GET /roles/guild/:guildId` - Liste des rôles d'un serveur
- `POST /roles/sync` - Synchronisation des rôles Discord

## Commandes Discord complètes

### **Commandes utilisateur**

#### **`/ping`** - Test de connectivité

- **Description** : Vérifie que le bot est en ligne et répond
- **Permissions** : Tout le monde
- **Réponse** : Message de confirmation avec latence

#### **`/profil`** - Affichage du profil personnage

- **Description** : Affiche les statistiques complètes du personnage actif
- **Permissions** : Utilisateur connecté avec personnage
- **Format** : Embed Discord avec PA, faim, HP, PM, rôles
- **Interactions** : Boutons pour gérer le personnage

#### **`/manger`** - Prendre un repas

- **Description** : Consomme 1 nourriture du stock communautaire
- **Permissions** : Utilisateur avec personnage vivant
- **Effets** : Réduit la faim de 1 niveau, consomme 1 nourriture
- **Messages** : Confirmation avec stock restant

#### **`/chantiers liste`** - Voir les chantiers disponibles

- **Description** : Liste tous les chantiers de la ville avec leur statut
- **Permissions** : Tout le monde dans le serveur
- **Format** : Embed avec liste paginée des chantiers
- **Interactions** : Boutons pour investir dans un chantier

#### **`/chantiers build`** - Investir dans un chantier

- **Description** : Interface interactive pour investir des PA dans un chantier
- **Permissions** : Utilisateur avec personnage vivant et PA disponibles
- **Interface** : Menu déroulant pour sélectionner le chantier et nombre de PA

### **Commandes administrateur**

#### **`/admin help`** - Aide administrateur

- **Description** : Affiche toutes les commandes admin disponibles
- **Permissions** : Rôles avec permissions administrateur Discord
- **Format** : Embed avec liste des commandes et descriptions

#### **`/admin chantiers`** - Gestion complète des chantiers

- **Description** : Interface complète de gestion des chantiers
- **Sous-commandes** :
  - `create` : Créer un nouveau chantier (avec modal)
  - `list` : Liste paginée de tous les chantiers
  - `edit` : Modifier un chantier existant
  - `delete` : Supprimer un chantier
- **Permissions** : Administrateur Discord uniquement

#### **`/admin personnage`** - Gestion des personnages

- **Description** : Outils avancés de gestion des personnages
- **Sous-commandes** :
  - `list` : Liste de tous les personnages de la ville
  - `stats` : Modifier les statistiques d'un personnage
  - `kill` : Tuer un personnage
  - `reroll` : Autoriser le reroll d'un personnage
  - `activate` : Activer/désactiver un personnage
- **Permissions** : Administrateur Discord uniquement

#### **`/admin nourriture`** - Gestion du stock communautaire

- **Description** : Gestion complète du stock de nourriture
- **Sous-commandes** :
  - `status` : Afficher le stock actuel
  - `add` : Ajouter de la nourriture au stock
  - `remove` : Retirer de la nourriture du stock
  - `set` : Définir un stock spécifique
- **Permissions** : Administrateur Discord uniquement

## Services et utilitaires métier

### **Services externes (Backend)**

#### **API Service** (`src/services/api.ts`)

- **Fonction** : Communication avec des services externes
- **Méthodes** :
  - `verifyDiscordToken()` - Validation des tokens Discord
  - `getDiscordUser()` - Récupération des informations utilisateur Discord
  - `getDiscordGuild()` - Informations du serveur Discord

#### **Logger Service** (`src/services/logger.ts`)

- **Fonction** : Système de logging structuré
- **Niveaux** : ERROR, WARN, INFO, DEBUG
- **Format** : JSON structuré avec métadonnées
- **Destinations** : Console, fichiers, services externes

### **Utilitaires (Backend)**

#### **Auth Middleware** (`src/middleware/auth.ts`)

- **Fonctions** :
  - `requireAuthOrInternal` - Authentification Discord ou interne
  - `requireAdmin` - Vérification des permissions administrateur
  - `validateDiscordRequest` - Validation des requêtes Discord

#### **Error Handler** (`src/middleware/error.ts`)

- **Fonction** : Gestion centralisée des erreurs
- **Gestion** : Erreurs HTTP, Prisma, Discord API
- **Logs** : Erreurs structurées avec contexte

### **Services Discord (Bot)**

#### **API Service** (`src/services/api.ts`)

- **Fonction** : Communication avec le backend API
- **Méthodes** :
  - Requêtes GET/POST/PATCH/DELETE vers tous les endpoints
  - Gestion automatique des erreurs et timeouts
  - Authentification automatique avec token Discord

#### **Logger Service** (`src/services/logger.ts`)

- **Fonction** : Logging Winston avec niveaux configurables
- **Destinations** : Console (dev), fichiers (prod), services externes
- **Format** : JSON avec métadonnées Discord

### **Utilitaires Discord (Bot)**

#### **Channel Utils** (`src/utils/channels.ts`)

- **Fonctions** :
  - `getLogChannel()` - Récupération du channel de logs configuré
  - `sendLogMessage()` - Envoi de messages dans le channel de logs
  - `formatLogEmbed()` - Formatage des embeds de logs

#### **Character Utils** (`src/utils/character.ts`)

- **Fonctions** :
  - `formatCharacterEmbed()` - Formatage des embeds de personnage
  - `calculateHungerLevel()` - Calcul du niveau de faim
  - `isCharacterAlive()` - Vérification de l'état du personnage

#### **Modal Handler** (`src/utils/modal-handler.ts`)

- **Fonction** : Gestion des modales Discord
- **Support** : Création, validation, soumission de modales

## Configuration complète

### **Variables d'environnement (Backend)**

```env
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/fateweaver

# Serveur
NODE_ENV=development|production
PORT=3000

# Sécurité
SESSION_SECRET=votre_secret_session_ici

# CORS
CORS_ORIGIN=http://localhost:8080

# Logs
LOG_LEVEL=info|warn|error|debug
```

### **Variables d'environnement (Bot Discord)**

```env
# Discord
DISCORD_TOKEN=votre_token_bot_obtenu_sur_discord_developer_portal
DISCORD_CLIENT_ID=votre_client_id_de_l_application_discord
DISCORD_GUILD_ID=123456789  # Vide = déploiement global

# API Backend
API_BASE_URL=http://backend:3000
API_TIMEOUT=5000

# Logging
LOG_LEVEL=info|warn|error|debug

# Déploiement
DEPLOY_TIMEOUT_MS=20000
DEPLOY_CONCURRENCY=3

# Environnement
NODE_ENV=development|production
```

### **Fichiers de configuration**

#### **docker-compose.yml** (Développement)

- **Services** : postgres, backenddev, discord-botdev, discord-bot-deploy
- **Réseau** : `internal` pour la communication sécurisée
- **Volumes** : postgres_data, bot-logs
- **Health checks** : Pour tous les services

#### **docker-compose.prod.yml** (Production)

- **Optimisations** : Variables d'environnement de production
- **Sécurité** : Secrets externes, réseau restreint
- **Monitoring** : Health checks avancés

#### **common.yml** (Configuration partagée)

- **Logging** : Configuration commune des logs
- **Health checks** : Templates réutilisables

## Sécurité et authentification

### **Authentification Discord**

- **Token validation** : Vérification JWT des tokens Discord à chaque requête
- **User sync** : Mise à jour automatique des informations utilisateur Discord
- **Session management** : Gestion des sessions avec expiration automatique

### **Gestion des permissions**

- **Rôles Discord** : Utilisation du système de rôles Discord existant
- **Middleware** : Vérification automatique des permissions sur les endpoints
- **Commandes admin** : Réservées aux utilisateurs avec permissions administrateur Discord
- **Logs de sécurité** : Traçabilité complète des actions sensibles

### **Sécurité des données**

- **Chiffrement** : Mots de passe et données sensibles chiffrés
- **Validation** : Validation stricte de toutes les entrées avec Zod
- **Rate limiting** : Protection contre les abus via Discord API
- **CORS** : Configuration restrictive des origines autorisées

## Déploiement et DevOps

### **Environnement de développement**

```bash
# Démarrage complet
docker compose up -d

# Services disponibles
# - postgres:5432 (base de données)
# - backenddev:3000 (API backend)
# - discord-botdev:3001 (bot Discord)
# - discord-bot-deploy (déploiement des commandes)

# Accès aux logs
docker compose logs -f [service-name]
```

### **Déploiement de production**

```bash
# Build et déploiement automatisés
./deploy_prod.sh

# Ou manuellement
docker compose -f docker-compose.prod.yml up -d --build

# Vérification de l'état
docker compose -f docker-compose.prod.yml ps
```

### **Gestion du déploiement Discord**

#### **Système de déploiement intelligent**

- **Fonctionnalités** :
  - Comparaison automatique des commandes locales vs déployées
  - Déploiement uniquement des commandes nouvelles/modifiées
  - Économie de ~90% des requêtes API Discord
  - Respect du mode guilde/global selon `DISCORD_GUILD_ID`

#### **Commandes de déploiement**

```bash
# Recommandé - déploiement sélectif
npm run deploy

# En cas de problème - déploiement complet
npm run deploy:force

# Liste des commandes déployées
npm run list-commands
```

## Tests et qualité

### **Tests automatisés (Backend)**

```bash
# Tests unitaires
npm run test

# Tests avec watch
npm run test:watch

# Couverture de code
npm run test:coverage
```

### **Linting et formatage**

```bash
# Backend
npm run lint        # ESLint
npm run build       # Vérification TypeScript

# Bot Discord
npm run lint        # ESLint strict
npm run build       # Vérification TypeScript
```

### **Standards de développement**

- **TypeScript strict** partout avec types explicites
- **ESLint** configuré avec règles strictes
- **Préttier** pour le formatage automatique
- **Tests obligatoires** pour les nouvelles fonctionnalités
- **Documentation** des APIs et fonctions complexes
- **Code review** obligatoire avant merge

## Monitoring et observabilité

### **Logs structurés**

```typescript
// Exemple de log structuré (backend)
logger.info("Chantier terminé", {
  chantierId: chantier.id,
  chantierName: chantier.name,
  completedBy: character.name,
  guildId: req.guildId,
  userId: req.userId,
  timestamp: new Date().toISOString(),
  paInvested: paAmount,
  totalCost: chantier.cost,
});

// Exemple de log structuré (bot)
logger.info("Command executed", {
  command: interaction.commandName,
  subcommand: interaction.options.getSubcommand(false),
  userId: interaction.user.id,
  username: interaction.user.username,
  guildId: interaction.guildId,
  channelId: interaction.channelId,
  executionTime: Date.now() - startTime,
});
```

### **Métriques collectées**

- **Requêtes par endpoint** avec temps de réponse
- **Taux d'erreur** par service
- **Utilisation des ressources** (mémoire, CPU)
- **Événements Discord** (interactions, erreurs)
- **État des chantiers** (créations, complétions)

## Plan de développement et roadmap

### **Phase 1 : Stabilisation** ✅ (En cours)

- [x] Système de personnages complet et fonctionnel
- [x] Gestion des chantiers communautaires
- [x] Économie de nourriture opérationnelle
- [x] Interface Discord complète avec interactions
- [x] Backend API robuste avec validation
- [x] Infrastructure de déploiement Docker
- [ ] Tests automatisés complets
- [ ] Monitoring et alerting avancés
- [ ] Documentation technique exhaustive

### **Phase 2 : Évolution** 🚧 (Planifiée)

- [ ] Développement du frontend web d'administration
- [ ] Fonctionnalités avancées (événements aléatoires)
- [ ] Système de guilde interne au jeu
- [ ] Système de notifications push
- [ ] API mobile pour applications tierces

### **Phase 3 : Échelle** 📈 (Future)

- [ ] Support multi-serveurs avancé
- [ ] Système de sauvegarde automatique
- [ ] Cache distribué (Redis) si nécessaire
- [ ] Internationalisation (i18n)
- [ ] API publique pour intégrations tierces

## Annexe - Structure des fichiers

### **Backend (`/backend/`)**

```
src/
├── controllers/        # Gestionnaires de requêtes HTTP
│   ├── chantier.ts    # Logique des chantiers (5,976 bytes)
│   ├── characters.ts  # Gestion des personnages (12,188 bytes)
│   ├── guilds.ts      # Gestion des guildes (2,999 bytes)
│   ├── roles.ts       # Système de rôles (3,901 bytes)
│   ├── towns.ts       # Gestion des villes (2,882 bytes)
│   ├── users.ts       # Gestion des utilisateurs (8,754 bytes)
│   └── action-point.ts # Régénération des PA (2,216 bytes)
├── routes/            # Définition des routes API
├── services/          # Services externes et métier
├── middleware/        # Middlewares Express (auth, erreurs)
├── cron/             # Tâches planifiées (régénération PA)
└── types/            # Types TypeScript partagés
```

### **Bot Discord (`/bot/`)**

```
src/
├── commands/          # Commandes slash Discord
│   ├── admin-commands/ # Commandes réservées aux administrateurs
│   └── user-commands/  # Commandes disponibles pour tous
├── features/          # Fonctionnalités organisées par domaine
│   ├── chantiers/     # Gestion complète des chantiers
│   ├── characters/    # Gestion des personnages
│   ├── death/         # Gestion de la mort
│   ├── hunger/        # Système de faim et nourriture
│   └── admin/         # Interface d'administration
├── core/             # Composants centraux
│   ├── client/       # Configuration du client Discord
│   ├── handlers/     # Gestionnaires d'événements
│   └── middleware/   # Middlewares de validation
├── services/         # Services externes (API, logger)
└── utils/           # Utilitaires partagés
```

---

**Ce document constitue le cahier des charges complet et exhaustif du projet FateWeaver Bot.**

_Niveau d'exhaustivité : Toute personne disposant de ce document peut recréer exactement le même système en se basant uniquement sur cette documentation._
