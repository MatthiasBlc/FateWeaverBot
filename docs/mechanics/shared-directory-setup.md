# Shared Directory Setup & Production Build

## Vue d'ensemble

Le projet utilise un dossier `shared/` à la racine pour partager du code TypeScript entre le bot Discord et le backend API. Ce document explique comment ce système fonctionne en développement local et en production.

## Structure

```
FateWeaverBot/
├── shared/                    # Code source partagé
│   ├── constants/
│   │   └── emojis.ts         # Constantes emoji
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   └── controllers/
│   │       └── towns.ts      # Utilise: import { HUNGER } from "@shared/constants/emojis"
│   ├── shared/               # ⚠️ SYMLINK → ../shared (local uniquement)
│   ├── tsconfig.json         # Configure @shared/* → shared/*
│   └── package.json
└── bot/
    ├── src/
    │   └── features/
    │       └── chantiers/
    │           └── chantiers.utils.ts  # Utilise: import { ... } from "@shared/constants/emojis"
    └── tsconfig.json         # Configure @shared/* → ../shared/*
```

## Développement Local

### Backend

**Prérequis** : Créer le symlink
```bash
cd backend
ln -sfn ../shared shared
```

**Vérification** :
```bash
ls -la backend/shared
# Doit afficher: shared -> ../shared
```

**Pourquoi ?**
- TypeScript cherche `@shared/*` via le path mapping dans `tsconfig.json`
- Le path mapping pointe vers `shared/*` (relatif à `backend/`)
- Le symlink `backend/shared → ../shared` permet à TypeScript de trouver les fichiers

### Bot

**Pas de symlink nécessaire**
- Le bot utilise `tsx` (TypeScript direct, pas de compilation)
- Le path mapping `@shared/* → ../shared/*` fonctionne directement
- `tsx` résout les paths à la volée

### Compilation locale

```bash
cd backend
npm run build  # Compile vers dist/
```

**Structure produite** :
```
backend/dist/
├── src/
│   └── server.js
└── shared/              # Compilé depuis le symlink
    └── constants/
        └── emojis.js
```

## Production (Docker)

### Différences avec le développement local

| Aspect | Local | Production (Docker) |
|--------|-------|---------------------|
| Dossier shared | Symlink | Copie réelle |
| Résolution paths | Compilation TS | Runtime avec `tsconfig-paths` |
| Build | `tsc` | `tsc` dans Dockerfile |
| Exécution | `npm run dev` | `node -r tsconfig-paths/register` |

### Backend Dockerfile

```dockerfile
# Builder stage
COPY ./shared ./shared              # Copie réelle, pas de symlink
COPY ./backend/src ./src
RUN npx tsc -p tsconfig.docker.json # Compile avec shared/

# Runtime stage
COPY --from=builder /app/shared ./shared       # Source TS
COPY --from=builder /app/dist ./dist           # Code compilé
COPY --from=builder /app/tsconfig*.json ./     # Config pour tsconfig-paths
```

### Bot Dockerfile

```dockerfile
COPY ./shared /shared               # Copie dans /shared
COPY ./bot .                        # Copie le bot
CMD ["npm", "start"]                # Utilise tsx, pas de compilation
```

### Runtime Path Resolution

**Problème** :
- Le code compilé contient `require("@shared/constants/emojis")`
- Node.js ne comprend pas `@shared/*` (pas un vrai package npm)

**Solution** :
```json
// backend/package.json
{
  "scripts": {
    "start": "node -r tsconfig-paths/register dist/src/server.js"
  },
  "dependencies": {
    "tsconfig-paths": "^4.2.0"  // Doit être en dependencies !
  }
}
```

Le flag `-r tsconfig-paths/register` :
- Charge `tsconfig-paths` avant l'application
- Lit `tsconfig.json` pour trouver les path mappings
- Intercepte les `require()` et résout `@shared/*` vers `./shared/*`

## Vérifications

### Vérifier la structure en local

```bash
# Le symlink existe ?
ls -la backend/shared
# Devrait afficher: shared -> ../shared

# La compilation fonctionne ?
cd backend && npm run build
# Devrait créer dist/shared/constants/emojis.js

# Le dossier shared est accessible ?
cat backend/shared/constants/emojis.ts
# Devrait afficher le contenu
```

### Vérifier le build Docker

```bash
# Backend
docker build -f backend/Dockerfile -t test-backend .

# Vérifier la structure
docker run --rm test-backend ls -la /app/shared
docker run --rm test-backend ls -la /app/dist/shared
docker run --rm test-backend cat /app/tsconfig.json | grep -A3 "paths"

# Vérifier tsconfig-paths
docker run --rm test-backend ls /app/node_modules/ | grep tsconfig
# Devrait afficher: tsconfig-paths

# Bot
docker build -f bot/Dockerfile -t test-bot .
docker run --rm test-bot ls -la /shared
```

## Dépannage

### Erreur : "Cannot find module '@shared/constants/emojis'"

**En développement local (backend)** :
```bash
# Le symlink est manquant ou cassé
cd backend
rm -f shared                    # Supprimer si existe
ln -sfn ../shared shared        # Recréer
ls -la shared                   # Vérifier
```

**En production Docker** :
```bash
# Vérifier que tsconfig-paths est installé
docker run --rm IMAGE_NAME npm list tsconfig-paths

# Vérifier le script start
docker run --rm IMAGE_NAME cat /app/package.json | grep "start"
# Devrait contenir: -r tsconfig-paths/register

# Vérifier tsconfig.json
docker run --rm IMAGE_NAME cat /app/tsconfig.json
```

### Erreur : "Permission denied" sur `dist/shared`

**Cause** : Le dossier `dist/` a été créé par Docker avec les permissions root

**Solution** :
```bash
sudo rm -rf backend/dist
npm run build
```

### Le bot ne trouve pas les emojis

**Vérifier** :
```bash
# En local
ls -la shared/constants/emojis.ts

# Dans Docker
docker run --rm bot-image ls -la /shared/constants/
```

**Le bot utilise `tsx`**, donc pas de compilation. Il doit accéder directement aux fichiers `.ts`.

## Références

- `backend/SETUP.md` - Instructions de configuration backend
- `.claude/production-build.md` - Documentation technique complète
- `.claude/reference.md` - Architecture du projet
- `backend/tsconfig.json` - Configuration TypeScript
- `backend/Dockerfile` - Build de production backend
- `bot/Dockerfile` - Build de production bot

## Historique

- **2025-10-22** : Correction production build
  - Ajout de `tsconfig-paths/register`
  - Documentation du système de symlink
  - Vérification des builds Docker
