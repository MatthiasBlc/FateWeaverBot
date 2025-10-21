# FateWeaver Bot - Jeu de rôle Discord

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**FateWeaver** est un bot Discord complet pour gérer un jeu de rôle avec gestion de personnages, chantiers communautaires, système de nourriture et mécanique de survie.

## 🌟 Fonctionnalités principales

### 🎭 **Gestion des personnages**

- Création et personnalisation de personnages
- Système de points d'action (PA) régénérables
- Gestion de la faim et de la mort
- Système de reroll pour recommencer

### 🏗️ **Système de chantiers**

- Chantiers communautaires nécessitant des investissements collectifs
- Progression en temps réel avec objectifs PA
- Gestion des contributions individuelles
- Messages automatiques lors de la complétion

### 🍖 **Gestion de la nourriture**

- Stock communautaire de vivres
- Système de faim affectant les personnages
- Repas nécessitant des vivres du stock commun

### 📊 **Administration**

- Commandes administrateur pour la gestion du serveur
- Gestion des personnages (modification stats, mort, reroll)
- Gestion des stocks de nourriture
- Logs automatiques des événements importants

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Discord Bot   │◄──►│   Backend API    │◄──►│   PostgreSQL    │
│                 │    │                  │    │                 │
│ • Commands      │    │ • REST API       │    │ • Characters    │
│ • Events        │    │ • Business       │    │ • Chantiers     │
│ • Interactions  │    │   Logic          │    │ • Towns         │
└─────────────────┘    └──────────────────┘    │ • Users         │
                                              │ • Guilds        │
┌─────────────────┐    ┌──────────────────┐    └─────────────────┘
│    Frontend     │◄──►│   Database       │
│   (Dashboard)   │    │   (Prisma ORM)   │
└─────────────────┘    └──────────────────┘
```

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18+
- **Docker** et **Docker Compose**
- **PostgreSQL** (via Docker)
- **Compte Discord** avec token bot

### Installation

1. **Cloner le repository**

   ```bash
   git clone https://github.com/MatthiasBlc/FateWeaverBot.git
   cd FateWeaverBot
   ```

2. **Configuration de l'environnement**

   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

3. **Lancer les services**

   ```bash
   # Développement
   docker compose up -d

   # Production
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Configuration du bot Discord**

   - Créez une application Discord sur https://discord.com/developers/applications
   - Récupérez le token et l'ID client
   - Ajoutez le bot à votre serveur

5. **Déploiement initial**
   ```bash
   # Dans le container du bot
   docker compose exec discord-botdev npm run deploy
   ```

## 📚 Documentation détaillée

- **[Bot Discord](./bot/README.md)** - Fonctionnalités, commandes et déploiement
- **[Backend API](./backend/README.md)** - Architecture serveur et endpoints
- **[Frontend](./frontend/README.md)** - Interface utilisateur (si disponible)

## 🛠️ Développement

### Structure du code

```
FateWeaverBot/
├── bot/                 # Bot Discord (TypeScript)
│   ├── src/
│   │   ├── commands/    # Commandes slash simples
│   │   ├── features/    # Fonctionnalités complexes
│   │   ├── services/    # Services externes
│   │   └── utils/       # Utilitaires
│   └── package.json
├── backend/            # API REST (TypeScript)
│   ├── src/
│   │   ├── controllers/ # Endpoints API
│   │   ├── routes/      # Définition des routes
│   │   └── services/    # Logique métier
│   └── package.json
├── frontend/           # Interface React (optionnelle)
└── common.yml         # Configuration Docker partagée
```

### Commandes de développement

```bash
# Bot Discord
cd bot
npm run dev          # Développement avec hot reload
npm run build        # Build de production
npm run deploy       # Déploiement intelligent des commandes

# Backend API
cd backend
npm run dev          # Développement
npm run build        # Build

# Services complets
docker compose up -d # Tous les services
```

## 📋 Commandes Discord disponibles

### 🎮 **Commandes utilisateur**

- `/ping` - Test de connectivité
- `/profil` - Affichage du profil personnage
- `/manger` - Prendre un repas
- `/chantiers liste` - Voir les chantiers disponibles
- `/chantiers build` - Investir dans un chantier

### ⚙️ **Commandes administrateur**

- `/admin help` - Aide administrateur
- `/admin chantiers` - Gestion des chantiers
- `/admin personnage` - Gestion des personnages
- `/admin nourriture` - Gestion du stock

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Discord
DISCORD_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_GUILD_ID=123456789  # Vide = mode global

# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db

# Backend
PORT=3000
SESSION_SECRET=votre_secret_session

# CORS (si nécessaire)
CORS_ORIGIN=http://localhost:8080
```

## 🚢 Déploiement

### Développement

```bash
docker compose up -d
```

### Production

```bash
# Build et déploiement
./deploy_prod.sh

# Ou manuellement
docker compose -f docker-compose.prod.yml up -d --build
```

## 📈 Logs et monitoring

- **Logs des événements** : Messages automatiques dans le channel de logs configuré
- **Logs applicatifs** : Via Docker logs ou fichiers de logs
- **Base de données** : Prisma Studio accessible via tunnel SSH

## 🔐 Sécurité

- Variables d'environnement sécurisées
- Validation des tokens Discord
- Gestion des permissions utilisateur
- Logs sécurisés des actions sensibles

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence privée. Voir le fichier LICENSE pour plus de détails.

## 👨‍💻 Auteur

**MatthiasBlc** - [GitHub](https://github.com/MatthiasBlc)

---

⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !!
