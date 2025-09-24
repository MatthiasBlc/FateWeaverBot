# lister les commandes du bot :

npx tsx src/list-commands.ts
a utiliser dans le container du bot (paser en sh et pas en bash)

# Various info

deploy.yml :
La variable DISCORD_GUILD_ID n'est pas exportée dans le workflow GitHub Actions.
deploy_prod.sh :
La variable DISCORD_GUILD_ID n'est pas listée dans les variables obligatoires (contrairement à DISCORD_TOKEN et DISCORD_CLIENT_ID).
Elle n'est pas non plus exportée dans le script.

-> de fait le bot est déployé globalement et non sur une guilde
(temps de maj possible)
ATTENTION
-> ça a été changé, à reverse lorsque ça sera plus stable

# prisma studio en local

docker compose exec backenddev sh
npx prisma studio



# prisma studio en distanciel
Étapes concrètes
1. Lancer Prisma Studio dans ton container

Sur ton VPS, ouvre un shell dans le container backend :

docker exec -it fateweaver-backend sh


Puis démarre Prisma Studio en écoutant sur toutes les interfaces du container :

npx prisma studio --hostname 0.0.0.0 --port 5555 --browser none


👉 Prisma tourne maintenant dans ton container sur port 5555, mais ce port n’est pas publié vers l’extérieur (il reste privé au réseau Docker).

2. Trouver l’IP interne du container

Toujours sur ton VPS :

docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' fateweaver-backend


Tu obtiendras une IP genre 172.18.0.5.

3. Créer un tunnel SSH depuis ta machine locale

Sur ta machine (pas sur le VPS), lance :

ssh -L 5555:172.18.0.5:5555 user@ton-vps


user@ton-vps → ton utilisateur SSH et l’adresse IP/domaine du VPS

5555:172.18.0.5:5555 → ça dit à SSH de rediriger ton localhost:5555 vers le port 5555 du container

4. Ouvrir Prisma Studio dans ton navigateur

Une fois le tunnel actif, sur ta machine locale :
👉 Va sur http://localhost:5555

Tu verras Prisma Studio, mais il reste totalement invisible à Internet 🌍 (seul ton tunnel SSH l’expose localement).

✅ Donc, le lien final où tu ouvres Prisma Studio est :
👉 http://localhost:5555 (sur ton PC, pas sur le VPS)

# Boiler Plate JS

docker compose up -d --build

docker compose down -v

## Table of contents

- [General info](#general-info)
- [Technologies](#technologies)
- [Prerequisites](#Prerequisites)
- [How to install](#How-to-install)
- [How to use](#How-to-use)
- [Features](#features)
- [Sources](#sources)

## General info

This project is a complete boiler plate for a fullstack JS app.

## Technologies

![Javascript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![ExpressJS](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Github-Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

## Prerequisites

You need to add a docker-compose.yml for dev env:

```
services:
  postgres:
    image: postgres:13
    restart: always
    container_name: postgres
    hostname: postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - ./postgresql/data:/var/lib/postgresql/data
    networks:
      - proxy
    ports:
      - '5432:5432'
  backenddev:
    extends:
      file: common.yml
      service: backend
    ports:
      - "3000:3000"
  frontenddev:
    extends:
      file: common.yml
      service: frontend
    ports:
      - "8080:8080"
networks:
  proxy:
    external: true
```

You need to add an .env file:

```
# Postgres
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

# Backend
PORT=
DATABASE_URL=postgresql://POSTGRES_USER:POSTGRES_PASSWORD@postgres:5432/POSTGRES_DB?schema=backend
SESSION_SECRET=
CORS_ORIGIN=

# Frontend
VITE_BACKEND_URL=
```

The postgresDB must exist in Postgres.

The docker network "proxy" must exist.

## How to install

1 - Clone this repo on your machine
2 - Open it in a Terminal
3 - Run this command to initialize the project :

```
npm run docker:build
```

## How to use

1 - Just run the following commands in your Terminal (inside the project's directory):
for detached version :

```
npm run docker:upd
```

Or for non-detached version:

```
npm run docker:up
```

And for stop the docker:

```
npm run docker:down
```

2 - You can access the project on the url : [http://localhost:8000/](http://localhost:8000/)

That's it!  
You have now access to this boiler plate! You can modify it as you wish for your projects.

## Features

You can:

- Create an account
- Login
- Logout
- See a complete display of your personnals notes
- Create/edit/delete a note

## Sources

This app is created and made by [MatthiasBlc](https://github.com/MatthiasBlc).
