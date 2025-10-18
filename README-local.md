# Démarrage en environnement local

## Prérequis

- Docker et Docker Compose installés
- Copier le fichier `.env.example` en `.env` :
  ```bash
  cp .env.example .env
  ```
- Mettre à jour les variables dans le fichier `.env` si nécessaire

## Démarrer les services

```bash
docker-compose up -d
```

## Arrêter les services

```bash
docker-compose down
```

## Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique (ex: backend)
docker-compose logs -f backenddev
```

## Accès aux services

- **Backend API**: http://localhost:3000
- **Base de données PostgreSQL**:
  - Hôte: localhost
  - Port: 5432
  - Base de données: mydb (ou celle spécifiée dans `.env`)
  - Utilisateur: myuser (ou celui spécifié dans `.env`)
  - Mot de passe: mypass (ou celui spécifié dans `.env`)

## Commandes utiles

- **Redémarrer un service** (ex: backend):

  ```bash
  docker-compose restart backenddev
  ```

- **Accéder à un conteneur** (ex: base de données):

  ```bash
  docker-compose exec postgres psql -U myuser -d mydb
  ```

- **Voir les conteneurs en cours d'exécution**:
  ```bash
  docker-compose ps
  ```

# Script Prisma Docker

Ce script permet de gérer facilement Prisma dans un environnement Docker, en particulier pour le développement local où la base de données n’existe qu’à l’intérieur des conteneurs.

Installation

Aucune installation nécessaire. Le script fonctionne depuis la racine du projet si tu as Docker et Docker Compose installés.

Assure-toi que le script est exécutable :

chmod +x prisma-docker.sh

Usage

Le script propose trois commandes principales :

1. generate
   ./prisma-docker.sh generate

Action : Génère le client Prisma (@prisma/client) à partir du fichier prisma/schema.prisma.

Quand l’utiliser :

Après avoir modifié schema.prisma.

Avant de lancer le serveur pour s’assurer que le client Prisma est à jour.

2. migrate
   ./prisma-docker.sh migrate

Action : Applique toutes les migrations existantes à la base de données.

Quand l’utiliser :

Pour synchroniser la base de données avec les migrations existantes.

Sur un serveur de production pour appliquer les migrations créées en développement.

3. all
   ./prisma-docker.sh all

Action : Génère le client Prisma et applique toutes les migrations à la base de données.

Quand l’utiliser :

Premier lancement du projet en dev.

Après avoir ajouté ou modifié un modèle dans schema.prisma.

Pour s’assurer que la DB et le client Prisma sont complètement synchronisés.

Exemple de script (prisma-docker.sh)
#!/bin/bash

COMMAND=$1

case $COMMAND in
generate)
docker-compose run --rm backenddev npx prisma generate
;;
migrate)
docker-compose run --rm backenddev npx prisma migrate deploy
;;
all)
docker-compose run --rm backenddev npx prisma generate
docker-compose run --rm backenddev npx prisma migrate deploy
;;
\*)
echo "Usage: $0 {generate|migrate|all}"
exit 1
;;
esac

Notes

Le script fonctionne uniquement si tes services Docker sont lancés (docker-compose up -d postgres backenddev).

En développement, utilise plutôt all pour éviter les erreurs liées à un client Prisma obsolète ou à des migrations manquantes.
