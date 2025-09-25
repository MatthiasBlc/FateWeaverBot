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
- `/chantiers liste` - Liste des chantiers du serveur
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

## Déploiement

1. Build le projet : `npm run build`
2. Déployez les commandes : `npm run deploy-commands`
3. Lancez le bot : `npm start`