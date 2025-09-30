# Discord Bot - FateWeaver

Un bot Discord pour gérer les chantiers et personnages dans l'univers de FateWeaver.

## Structure du projet

```
src/
├── commands/              # Commandes slash Discord simples
├── features/              # Fonctionnalités complexes organisées par domaine
│   ├── chantiers/         # Gestion des chantiers (ex: liste, build, add, delete)
│   ├── characters/        # Gestion des personnages
│   └── users/             # Gestion des utilisateurs
├── core/                  # Logique partagée
│   ├── client/            # Configuration du client Discord
│   ├── handlers/          # Gestionnaires d'événements
│   └── middleware/        # Middlewares pour les commandes
├── services/              # Services externes (API, logger, etc.)
├── types/                 # Types TypeScript centralisés
├── utils/                 # Fonctions utilitaires
└── config/                # Configuration de l'application
```

## Installation

1. Clonez le repository
2. Copiez `.env.example` vers `.env` et configurez vos variables d'environnement
3. Installez les dépendances : `npm install`
4. Lancez le bot en développement : `npm run dev`

## Commandes disponibles

- `/ping` - Test de connectivité
- `/profil` - Affichage du profil utilisateur
- `/chantiers liste` - Liste des chantiers de la guilde
- `/chantiers build` - Investir des points d'action dans un chantier
- `/chantiers add` - Ajouter un nouveau chantier (admin seulement)
- `/chantiers delete` - Supprimer un chantier (admin seulement)

## Développement

### Ajouter une nouvelle commande

1. Créez un nouveau dossier dans `src/features/`
2. Créez les fichiers suivants :
   - `feature.types.ts` - Types spécifiques à la fonctionnalité
   - `feature.utils.ts` - Fonctions utilitaires
   - `feature.handlers.ts` - Gestionnaires des sous-commandes
   - `feature.command.ts` - Définition de la commande slash
   - `index.ts` - Export de la commande

### Configuration

Le fichier `src/config/index.ts` contient toute la configuration de l'application. Les variables d'environnement sont validées au démarrage.

## Déploiement des commandes

### 🚀 Déploiement intelligent (recommandé)

Le bot utilise un système de déploiement intelligent qui ne déploie que les commandes nouvelles ou modifiées :

```bash
# En local
npm run deploy

# Avec Docker
docker compose exec discord-botdev npx tsx src/deploy-commands.ts
```

**Avantages :**
- ✅ Évite le rate limiting de l'API Discord
- ✅ Déploiement rapide (uniquement les changements)
- ✅ Logs détaillés des modifications

### 📋 Lister les commandes déployées

```bash
# En local
npm run list-commands

# Avec Docker
docker compose exec discord-botdev npx tsx src/list-commands.ts
```

### ⚠️ Déploiement forcé (si nécessaire)

En cas de problème, vous pouvez forcer un déploiement complet :

```bash
npm run deploy:force
```

**⚠️ Attention :** Cette commande supprime et recrée TOUTES les commandes. Utilisez-la uniquement en cas de problème.

### 📖 Documentation complète

Pour plus de détails sur le système de déploiement, consultez [DEPLOY-COMMANDS.md](./DEPLOY-COMMANDS.md).

## Configuration des modes de déploiement

### Mode Guilde (Développement)
```env
DISCORD_GUILD_ID=123456789  # ID de votre serveur de test
```
- Commandes déployées uniquement sur ce serveur
- Mise à jour instantanée
- Idéal pour le développement

### Mode Global (Production)
```env
DISCORD_GUILD_ID=  # Laisser vide
```
- Commandes déployées sur tous les serveurs
- Propagation jusqu'à 1 heure
- Utilisé en production

## Démarrage du bot

1. Build le projet : `npm run build`
2. Déployez les commandes : `npm run deploy`
3. Lancez le bot : `npm start`