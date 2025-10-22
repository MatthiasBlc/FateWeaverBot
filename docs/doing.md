# Est-ce que toutes les routes sont publiques, est-ce que certaines doivent être protégées par requireAuth ?

# Ts doit compiler. + build les images : docker compose up -d --build

> [backenddev builder 10/13] RUN npm run build:
> 0.352
> 0.352 > backend@1.0.0 build
> 0.352 > tsc
> 0.352
> 4.791 prisma/seed.ts(7,27): error TS2307: Cannot find module '@shared/constants/emojis' or its corresponding type declarations.

## 4.791 src/controllers/towns.ts(4,24): error TS2307: Cannot find module '@shared/constants/emojis' or its corresponding type declarations.

Dockerfile:25

---

23 |

24 | # Construction de l'application

25 | >>> RUN npm run build

26 |

27 | # Vérification de la structure du build

---

target backenddev: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2

# Compilation TS doit fonctionner pour la production (deploy.yml, docker-compose.prod.yml, deploy_prod.sh) attention aux dockerfile mais également au dossier partagé entre front et backend shared avec les emojis.

# met en place les tests qu'il reste à faire dans backend-refactoring. n'oublie pas que tout est lancé en docker compose, bdd y compris. Quelle solution est la plus optimisée pour tester le backend dans ces conditions ?
