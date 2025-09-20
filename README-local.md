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
