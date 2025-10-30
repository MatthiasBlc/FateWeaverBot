> backend@1.0.0 start:migrate:prod
> prisma migrate deploy && prisma db seed && node -r tsconfig-paths/register dist/src/server.js
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres_fate_weaver", schema "backend" at "fateweaver-postgres:5432"
32 migrations found in prisma/migrations
Applying migration `20251029091142_remove_original_project_id`
Applying migration `20251029222917_auto_migration`
The following migrations have been applied:
migrations/
  └─ 20251029091142_remove_original_project_id/
    └─ migration.sql
  └─ 20251029222917_auto_migration/
    └─ migration.sql
      
All migrations have been successfully applied.
Running seed command `sh scripts/seed-docker.sh` ...
🐳 Running seed with Docker tsconfig...
🌱 Seeding de la base de données...
✅ 14 capacités déjà présentes
✅ 13 métiers déjà présents
✅ 8 types de ressources déjà présents
✅ 21 compétences déjà présentes
✅ 45 types d'objets déjà présents
✅ 34 entrées de loot de pêche déjà présentes
🎉 Seeding terminé avec succès !
🌱  The seed command has been executed.
┌─────────────────────────────────────────────────────────┐
│  Update available 5.5.2 -> 6.18.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
🔧 Initializing CRON jobs...
NODE_ENV: production
✅ Starting CRON jobs (not in test mode)
INF INF INF INF Job CRON unifié de minuit configuré (00:00:00) | INF INF INF INF Job CRON unifié de minuit configuré (00:00:00) | timestamp=2025-10-29T23:15:26.679Z
INF INF INF INF   - Ordre garanti: Hunger → PM → Expedition Lock → PA Update | INF INF INF INF   - Ordre garanti: Hunger → PM → Expedition Lock → PA Update | timestamp=2025-10-29T23:15:26.681Z
✅ Midnight unified job started (Hunger → PM → Expedition Lock → PA Update)
INF INF INF INF Morning expedition update job scheduled for 08:00 daily (returns then departs) | INF INF INF INF Morning expedition update job scheduled for 08:00 daily (returns then departs) | timestamp=2025-10-29T23:15:26.683Z
✅ Morning expedition job started (08:00 - Return → Depart)
Job de changement de saison programmé pour s'exécuter tous les lundis à minuit
✅ Season change job started
INF INF INF INF Daily message job scheduled for 08:00:05 daily (after expedition processing) | INF INF INF INF Daily message job scheduled for 08:00:05 daily (after expedition processing) | timestamp=2025-10-29T23:15:26.688Z
✅ Daily message job started
🎉 All CRON jobs initialized successfully
Trust proxy settings: enabled
Server running on port: 3000!
GET /api/admin/emojis/list 200 14.511 ms
GET /api/towns/guild/1418955325070905404 200 17.557 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 53.542 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/admin/emojis/list 200 4.031 ms
GET /api/users/discord/661588578622767104 200 4.129 ms
PUT /api/users/discord/661588578622767104 200 21.182 ms
POST /api/guilds 200 6.864 ms
GET /api/users/discord/661588578622767104 200 2.075 ms
GET /api/guilds/discord/1418955325070905404 200 2.682 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 58.797 ms
GET /api/towns/guild/1418955325070905404 200 5.808 ms
GET /api/users/discord/661588578622767104 200 1.478 ms
GET /api/users/discord/661588578622767104 200 1.314 ms
GET /api/guilds/discord/1418955325070905404 200 2.039 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.995 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 4.727 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 3.643 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 60.959 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 5.198 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 60.822 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 4.576 ms
GET /api/capabilities/cataplasme-stock/cmgwqm40z0007g50hzf45oq33 200 7.092 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 3.587 ms
INF INF INF INF === Starting morning expedition update at 08:00 === | INF INF INF INF === Starting morning expedition update at 08:00 === | timestamp=2025-10-30T07:00:00.085Z
INF INF INF INF Found 0 expeditions to check for return | INF INF INF INF Found 0 expeditions to check for return | timestamp=2025-10-30T07:00:00.261Z
INF INF INF INF Returned 0 expeditions, 0 expeditions blocked (no members) | INF INF INF INF Returned 0 expeditions, 0 expeditions blocked (no members) | timestamp=2025-10-30T07:00:00.262Z
INF INF INF INF Found 0 expeditions to depart | INF INF INF INF Found 0 expeditions to depart | timestamp=2025-10-30T07:00:00.395Z
INF INF INF INF Departed 0 expeditions | INF INF INF INF Departed 0 expeditions | timestamp=2025-10-30T07:00:00.396Z
INF INF INF INF === Morning expedition update completed === | INF INF INF INF === Morning expedition update completed === | timestamp=2025-10-30T07:00:00.397Z
INF INF INF INF Starting daily message broadcast at 08:00 | INF INF INF INF Starting daily message broadcast at 08:00 | timestamp=2025-10-30T07:05:00.053Z
GET /api/guilds 200 218.806 ms
WRN WRN WRN WRN No daily message channel configured for guild 1423306013033107496 | WRN WRN WRN WRN No daily message channel configured for guild 1423306013033107496 | timestamp=2025-10-30T07:05:00.461Z
WRN WRN WRN WRN Failed to send daily message for A Tale of Stars City - check Discord service | WRN WRN WRN WRN Failed to send daily message for A Tale of Stars City - check Discord service | timestamp=2025-10-30T07:05:00.462Z
INF INF INF INF Daily messages sent to 0 towns | INF INF INF INF Daily messages sent to 0 towns | timestamp=2025-10-30T07:05:00.463Z
GET /api/towns/cmgwqj7zf0001g50hecwj7u03/weather 200 9.955 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03/actions-recap 200 10.548 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03/expeditions-summary 200 19.431 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03/stocks-summary 200 24.213 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/users/discord/661588578622767104 200 32.698 ms
PUT /api/users/discord/661588578622767104 200 21.995 ms
POST /api/guilds 200 11.196 ms
GET /api/users/discord/661588578622767104 200 1.458 ms
GET /api/guilds/discord/1418955325070905404 200 3.510 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 87.244 ms
GET /api/towns/guild/1418955325070905404 200 15.588 ms
GET /api/users/discord/661588578622767104 200 2.640 ms
GET /api/users/discord/661588578622767104 200 1.361 ms
GET /api/guilds/discord/1418955325070905404 200 3.645 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 12.072 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 4.649 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 4.086 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 52.105 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 4.975 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 64.629 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 4.571 ms
GET /api/capabilities/cataplasme-stock/cmgwqm40z0007g50hzf45oq33 200 9.250 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 5.952 ms
GET /api/users/discord/661588578622767104 200 2.029 ms
PUT /api/users/discord/661588578622767104 200 3.576 ms
POST /api/guilds 200 4.096 ms
GET /api/towns/guild/1418955325070905404 200 4.505 ms
GET /api/characters/active/661588578622767104/cmgwqj7zf0001g50hecwj7u03 200 13.435 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 2.763 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 4.268 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 3.180 ms
GET /api/towns/guild/1418955325070905404 200 6.381 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 51.236 ms
POST /api/objects 201 64.594 ms
GET /api/towns/guild/1418955325070905404 200 5.553 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 2.177 ms
GET /api/towns/guild/1418955325070905404 200 7.025 ms
GET /api/resources/types 200 2.815 ms
GET /api/users/discord/290254533718835201 200 1.737 ms
PUT /api/users/discord/290254533718835201 200 3.334 ms
POST /api/guilds 200 5.077 ms
GET /api/users/discord/290254533718835201 200 2.647 ms
GET /api/guilds/discord/1418955325070905404 200 1.836 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.877 ms
GET /api/towns/guild/1418955325070905404 200 4.744 ms
GET /api/users/discord/290254533718835201 200 1.220 ms
GET /api/users/discord/290254533718835201 200 1.143 ms
GET /api/guilds/discord/1418955325070905404 200 1.956 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.557 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/capabilities 200 2.784 ms
GET /api/action-points/cmgzgct7i000xg50hbwl2ah4i 200 2.051 ms
GET /api/expeditions/character/cmgzgct7i000xg50hbwl2ah4i/active 200 3.255 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/skills 200 3.159 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/objects 200 8.213 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/objects 200 2.942 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/inventory 200 2.977 ms
GET /api/towns/guild/1418955325070905404 200 4.572 ms
GET /api/characters/active/290254533718835201/cmgwqj7zf0001g50hecwj7u03 200 10.315 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 3.785 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.077 ms
GET /api/resources/types 200 6.933 ms
GET /api/towns/guild/1418955325070905404 200 5.906 ms
GET /api/characters/active/290254533718835201/cmgwqj7zf0001g50hecwj7u03 200 9.324 ms
POST /api/characters/cmgzgct7i000xg50hbwl2ah4i/eat-alternative 200 39.226 ms
GET /api/towns/guild/1418955325070905404 200 4.986 ms
GET /api/characters/active/290254533718835201/cmgwqj7zf0001g50hecwj7u03 200 9.923 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 3.013 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.500 ms
GET /api/guilds/discord/1418955325070905404 200 3.050 ms
GET /api/resources/types 200 1.907 ms
GET /api/resources/types 200 1.749 ms
POST /api/projects 201 29.963 ms
GET /api/towns/guild/1418955325070905404 200 6.267 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 4.390 ms
GET /api/towns/guild/1418955325070905404 200 5.009 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 5.182 ms
GET /api/towns/guild/1418955325070905404 200 5.560 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 2.852 ms
GET /api/towns/guild/1418955325070905404 200 5.738 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.574 ms
GET /api/towns/guild/1418955325070905404 200 5.269 ms
GET /api/objects 200 13.031 ms
GET /api/objects 200 7.369 ms
GET /api/users/discord/661588578622767104 200 2.014 ms
PUT /api/users/discord/661588578622767104 200 3.832 ms
POST /api/guilds 200 5.190 ms
GET /api/users/discord/661588578622767104 200 1.743 ms
GET /api/guilds/discord/1418955325070905404 200 2.293 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.184 ms
GET /api/towns/guild/1418955325070905404 200 5.870 ms
GET /api/users/discord/661588578622767104 200 2.770 ms
GET /api/users/discord/661588578622767104 200 1.285 ms
GET /api/guilds/discord/1418955325070905404 200 1.644 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.029 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 2.093 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 1.573 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 2.801 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 2.064 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 4.719 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 2.902 ms
GET /api/capabilities/cataplasme-stock/cmgwqm40z0007g50hzf45oq33 200 4.428 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 3.382 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33 200 12.998 ms
GET /api/towns/guild/1418955325070905404 200 9.340 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.416 ms
GET /api/resources/types 200 2.024 ms
GET /api/resources/types 200 2.172 ms
GET /api/resources/types 200 2.309 ms
GET /api/towns/guild/1418955325070905404 200 5.336 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.812 ms
GET /api/towns/guild/1418955325070905404 200 5.876 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.095 ms
GET /api/resources/types 200 2.213 ms
GET /api/towns/guild/1418955325070905404 200 4.725 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 2.685 ms
GET /api/resources/types 200 2.461 ms
GET /api/resources/types 200 3.016 ms
POST /api/projects 201 15.948 ms
GET /api/towns/guild/1418955325070905404 200 5.460 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.722 ms
GET /api/towns/guild/1418955325070905404 200 5.549 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.382 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 1.352 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 1.602 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 2.480 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 4.886 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 3.356 ms
GET /api/towns/guild/1418955325070905404 200 10.700 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 10.167 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 2.415 ms
GET /api/towns/guild/1418955325070905404 200 7.329 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.397 ms
GET /api/capabilities 200 6.385 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 2.066 ms
GET /api/towns/guild/1418955325070905404 200 5.125 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.445 ms
GET /api/capabilities 200 2.258 ms
INF INF INF INF Tentative d'ajout de capacité cmgwqhqcc0006g52t0e3rg0yi au personnage cmgwqm40z0007g50hzf45oq33 | INF INF INF INF Tentative d'ajout de capacité cmgwqhqcc0006g52t0e3rg0yi au personnage cmgwqm40z0007g50hzf45oq33 | timestamp=2025-10-30T09:51:49.907Z
POST /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities/cmgwqhqcc0006g52t0e3rg0yi 201 13.289 ms
GET /api/users/discord/661588578622767104 200 1.797 ms
PUT /api/users/discord/661588578622767104 200 4.628 ms
POST /api/guilds 200 6.772 ms
GET /api/users/discord/661588578622767104 200 1.690 ms
GET /api/guilds/discord/1418955325070905404 200 1.732 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.462 ms
GET /api/towns/guild/1418955325070905404 200 5.995 ms
GET /api/users/discord/661588578622767104 200 2.289 ms
GET /api/users/discord/661588578622767104 200 1.715 ms
GET /api/guilds/discord/1418955325070905404 200 2.083 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.126 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 2.498 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 1.922 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 2.761 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 1.428 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 3.895 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 2.324 ms
GET /api/capabilities/cataplasme-stock/cmgwqm40z0007g50hzf45oq33 200 3.347 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 2.370 ms
GET /api/users/discord/661588578622767104 200 1.662 ms
GET /api/towns/guild/1418955325070905404 200 9.653 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.703 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 1.687 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03/craft-type/TISSER 200 5.765 ms
GET /api/users/discord/661588578622767104 200 2.165 ms
GET /api/towns/guild/1418955325070905404 200 5.612 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.889 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 2.933 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03/craft-type/TISSER 200 5.834 ms
GET /api/users/discord/661588578622767104 200 1.814 ms
GET /api/towns/guild/1418955325070905404 200 4.409 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.978 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.578 ms
POST /api/projects/characters/cmgwqm40z0007g50hzf45oq33/projects/cmhd8vlgc0009g50hixugx82r/contribute 200 41.478 ms
GET /api/guilds/discord/1418955325070905404 200 2.194 ms
GET /api/guilds/discord/1418955325070905404 200 2.574 ms
GET /api/towns/guild/1418955325070905404 200 7.165 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.481 ms
GET /api/towns/guild/1418955325070905404 200 8.755 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 4.951 ms
GET /api/towns/guild/1418955325070905404 200 5.045 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 3.567 ms
GET /api/towns/guild/1418955325070905404 200 8.629 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 6.717 ms
POST /api/objects 201 46.308 ms
POST /api/objects 201 3.933 ms
GET /api/towns/guild/1418955325070905404 200 29.537 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 6.214 ms
GET /api/users/discord/366604463982772224 200 1.977 ms
PUT /api/users/discord/366604463982772224 200 5.130 ms
POST /api/guilds 200 4.260 ms
GET /api/users/discord/366604463982772224 200 1.282 ms
GET /api/guilds/discord/1418955325070905404 200 1.779 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 53.412 ms
GET /api/towns/guild/1418955325070905404 200 5.911 ms
GET /api/users/discord/366604463982772224 200 1.042 ms
GET /api/users/discord/366604463982772224 200 1.237 ms
GET /api/guilds/discord/1418955325070905404 200 1.762 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.717 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities 200 2.426 ms
GET /api/action-points/cmgxp91qf000ig50i3xsbuqzk 200 2.494 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 47.908 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/skills 200 2.011 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 8.082 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 3.319 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory 200 4.318 ms
GET /api/towns/guild/1418955325070905404 200 5.802 ms
GET /api/objects 200 10.775 ms
GET /api/objects 200 10.273 ms
GET /api/resources/types 200 2.138 ms
GET /api/resources/types 200 2.321 ms
GET /api/resources/types 200 1.996 ms
GET /api/resources/types 200 2.750 ms
GET /api/resources/types 200 2.527 ms
GET /api/resources/types 200 2.230 ms
POST /api/projects 201 10.215 ms
GET /api/towns/guild/1418955325070905404 200 4.713 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 4.299 ms
GET /api/towns/guild/1418955325070905404 200 34.397 ms
GET /api/objects 200 7.067 ms
GET /api/objects 200 7.463 ms
GET /api/resources/types 200 2.088 ms
GET /api/resources/types 200 1.894 ms
GET /api/resources/types 200 3.284 ms
GET /api/resources/types 200 2.341 ms
GET /api/resources/types 200 1.700 ms
GET /api/resources/types 200 2.798 ms
POST /api/projects 201 108.217 ms
GET /api/towns/guild/1418955325070905404 200 7.042 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.081 ms
GET /api/towns/guild/1418955325070905404 200 6.304 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.679 ms
GET /api/action-points/cmgwqkl3a0004g50hev6ke04m 200 1.567 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 1.879 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/skills 200 2.296 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 4.846 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 3.652 ms
GET /api/towns/guild/1418955325070905404 200 6.911 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.164 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.824 ms
GET /api/towns/guild/1418955325070905404 200 5.646 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 10.178 ms
GET /api/capabilities 200 3.015 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.103 ms
GET /api/towns/guild/1418955325070905404 200 4.739 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.740 ms
GET /api/capabilities 200 2.267 ms
INF INF INF INF Tentative d'ajout de capacité cmgwqhqcg0008g52tufdy95p4 au personnage cmgwqkl3a0004g50hev6ke04m | INF INF INF INF Tentative d'ajout de capacité cmgwqhqcg0008g52tufdy95p4 au personnage cmgwqkl3a0004g50hev6ke04m | timestamp=2025-10-30T10:04:59.213Z
POST /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities/cmgwqhqcg0008g52tufdy95p4 201 2567.275 ms
GET /api/towns/guild/1418955325070905404 200 6.182 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.922 ms
GET /api/towns/guild/1418955325070905404 200 5.051 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.563 ms
GET /api/action-points/cmgwqn5je000ag50hxlilde94 200 1.595 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/capabilities 200 2.121 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/skills 200 1.521 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/objects 200 4.342 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/objects 200 2.905 ms
GET /api/towns/guild/1418955325070905404 200 5.566 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.262 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/capabilities 200 3.707 ms
GET /api/towns/guild/1418955325070905404 200 5.263 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.796 ms
GET /api/capabilities 200 3.474 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/capabilities 200 2.247 ms
GET /api/towns/guild/1418955325070905404 200 5.798 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.191 ms
GET /api/capabilities 200 2.322 ms
INF INF INF INF Tentative d'ajout de capacité cmgwqhqce0007g52t80v8k6b7 au personnage cmgwqn5je000ag50hxlilde94 | INF INF INF INF Tentative d'ajout de capacité cmgwqhqce0007g52t80v8k6b7 au personnage cmgwqn5je000ag50hxlilde94 | timestamp=2025-10-30T10:05:22.961Z
POST /api/characters/cmgwqn5je000ag50hxlilde94/capabilities/cmgwqhqce0007g52t80v8k6b7 201 8.388 ms
GET /api/towns/guild/1418955325070905404 200 7.597 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03 200 53.258 ms
GET /api/towns/guild/1418955325070905404 200 5.743 ms
GET /api/resources/types 200 1.941 ms
GET /api/resources/types 200 1.919 ms
GET /api/resources/types 200 2.792 ms
GET /api/resources/types 200 1.866 ms
GET /api/resources/types 200 2.074 ms
GET /api/resources/types 200 1.788 ms
GET /api/resources/types 200 1.776 ms
POST /api/projects 201 15.726 ms
GET /api/users/discord/326475805653991434 200 2.088 ms
PUT /api/users/discord/326475805653991434 200 3.653 ms
POST /api/guilds 200 5.827 ms
GET /api/users/discord/326475805653991434 200 1.504 ms
GET /api/guilds/discord/1418955325070905404 200 1.794 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 53.887 ms
GET /api/towns/guild/1418955325070905404 200 5.044 ms
GET /api/users/discord/326475805653991434 200 3.558 ms
GET /api/users/discord/326475805653991434 200 1.273 ms
GET /api/guilds/discord/1418955325070905404 200 1.948 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 7.274 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/capabilities 200 3.423 ms
GET /api/action-points/cmh0xnc4x0007g50hfmaykvqr 200 1.496 ms
GET /api/expeditions/character/cmh0xnc4x0007g50hfmaykvqr/active 200 51.877 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/skills 200 3.712 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/objects 200 52.339 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/objects 200 2.988 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/inventory 200 3.348 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/capabilities 200 3.311 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr 200 7.724 ms
GET /api/characters/cmh0xnc4x0007g50hfmaykvqr/capabilities 200 2.479 ms
POST /api/characters/cmh0xnc4x0007g50hfmaykvqr/capabilities/use 200 75.907 ms
GET /api/expeditions/character/cmh0xnc4x0007g50hfmaykvqr/active 200 7.367 ms
GET /api/guilds/discord/1418955325070905404 200 2.078 ms
GET /api/towns/guild/1418955325070905404 200 7.330 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 69.683 ms
GET /api/towns/guild/1418955325070905404 200 11.373 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 9.937 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 2.629 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 4.120 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 2.252 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 60.165 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 16.542 ms
GET /api/users/discord/661588578622767104 200 2.205 ms
PUT /api/users/discord/661588578622767104 200 3.887 ms
POST /api/guilds 200 4.866 ms
GET /api/users/discord/661588578622767104 200 1.616 ms
GET /api/guilds/discord/1418955325070905404 200 2.005 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 54.402 ms
GET /api/towns/guild/1418955325070905404 200 10.446 ms
GET /api/users/discord/661588578622767104 200 1.375 ms
GET /api/users/discord/661588578622767104 200 2.635 ms
GET /api/guilds/discord/1418955325070905404 200 2.250 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 7.256 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/capabilities 200 3.237 ms
GET /api/action-points/cmgwqm40z0007g50hzf45oq33 200 1.974 ms
GET /api/expeditions/character/cmgwqm40z0007g50hzf45oq33/active 200 46.205 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/skills 200 1.948 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 44.886 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/objects 200 2.975 ms
GET /api/capabilities/cataplasme-stock/cmgwqm40z0007g50hzf45oq33 200 3.186 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 2.772 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33 200 8.582 ms
GET /api/towns/guild/1418955325070905404 200 5.169 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.032 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 3.379 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33 200 9.952 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e 200 16.400 ms
GET /api/characters/cmgwqm40z0007g50hzf45oq33/inventory 200 6.801 ms
POST /api/characters/cmgwqm40z0007g50hzf45oq33/inventory/transfer 200 19.187 ms
BadRequestError: Validation failed
    at /app/dist/src/api/middleware/validation.middleware.js:21:49
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at requireAuthOrInternal (/app/dist/src/middleware/auth.js:166:16)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:119:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at /app/node_modules/express/lib/router/index.js:284:15
    at param (/app/node_modules/express/lib/router/index.js:365:14) {
  errors: [
    {
      validation: 'cuid',
      code: 'invalid_string',
      message: 'Invalid cuid',
      path: [Array]
    }
  ]
}
GET /api/expeditions/town/undefined 400 6.377 ms
GET /api/guilds/discord/1418955325070905404 200 2.249 ms
GET /api/users/discord/297664601372360704 200 2.417 ms
PUT /api/users/discord/297664601372360704 200 4.618 ms
POST /api/guilds 200 4.318 ms
GET /api/users/discord/297664601372360704 200 1.266 ms
GET /api/guilds/discord/1418955325070905404 200 1.729 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 51.540 ms
GET /api/towns/guild/1418955325070905404 200 4.885 ms
GET /api/users/discord/297664601372360704 200 1.261 ms
GET /api/users/discord/297664601372360704 200 1.082 ms
GET /api/guilds/discord/1418955325070905404 200 1.870 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.950 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities 200 3.167 ms
GET /api/action-points/cmgy4vxeq000vg50hije1z4zi 200 2.224 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 45.037 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/skills 200 1.805 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/objects 200 45.022 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/objects 200 4.023 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/inventory 200 5.617 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi 200 15.456 ms
GET /api/towns/guild/1418955325070905404 200 12.906 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 7.925 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/inventory 200 4.445 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi 200 6.729 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk 200 9.170 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/inventory 200 2.930 ms
POST /api/characters/cmgy4vxeq000vg50hije1z4zi/inventory/transfer 200 14.137 ms
GET /api/expeditions/town/undefined 400 1.284 ms
BadRequestError: Validation failed
    at /app/dist/src/api/middleware/validation.middleware.js:21:49
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at requireAuthOrInternal (/app/dist/src/middleware/auth.js:166:16)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:119:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at /app/node_modules/express/lib/router/index.js:284:15
    at param (/app/node_modules/express/lib/router/index.js:365:14) {
  errors: [
    {
      validation: 'cuid',
      code: 'invalid_string',
      message: 'Invalid cuid',
      path: [Array]
    }
  ]
}
GET /api/guilds/discord/1418955325070905404 200 2.498 ms
GET /api/users/discord/366604463982772224 200 1.955 ms
PUT /api/users/discord/366604463982772224 200 3.553 ms
POST /api/guilds 200 4.472 ms
GET /api/users/discord/366604463982772224 200 1.457 ms
GET /api/guilds/discord/1418955325070905404 200 1.889 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 10.190 ms
GET /api/towns/guild/1418955325070905404 200 5.186 ms
GET /api/users/discord/366604463982772224 200 6.274 ms
GET /api/users/discord/366604463982772224 200 1.201 ms
GET /api/guilds/discord/1418955325070905404 200 1.912 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.403 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities 200 1.895 ms
GET /api/action-points/cmgxp91qf000ig50i3xsbuqzk 200 2.102 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 2.732 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/skills 200 1.262 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 4.464 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 3.833 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory 200 3.011 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities 200 3.067 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk 200 6.441 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities 200 3.181 ms
POST /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities/use 200 57.879 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 3.222 ms
GET /api/guilds/discord/1418955325070905404 200 2.083 ms
GET /api/users/discord/297664601372360704 200 1.974 ms
PUT /api/users/discord/297664601372360704 200 3.386 ms
POST /api/guilds 200 6.085 ms
GET /api/users/discord/297664601372360704 200 1.171 ms
GET /api/guilds/discord/1418955325070905404 200 2.709 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 52.710 ms
GET /api/towns/guild/1418955325070905404 200 5.909 ms
GET /api/characters/active/297664601372360704/cmgwqj7zf0001g50hecwj7u03 200 12.226 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 45.173 ms
GET /api/chantiers/guild/1418955325070905404 200 74.717 ms
GET /api/users/discord/297664601372360704 200 1.704 ms
PUT /api/users/discord/297664601372360704 200 3.334 ms
POST /api/guilds 200 4.456 ms
GET /api/towns/guild/1418955325070905404 200 4.938 ms
GET /api/characters/active/297664601372360704/cmgwqj7zf0001g50hecwj7u03 200 8.414 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 4.124 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 9.374 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.885 ms
GET /api/users/discord/297664601372360704 200 3.478 ms
PUT /api/users/discord/297664601372360704 200 3.315 ms
POST /api/guilds 200 3.852 ms
GET /api/users/discord/297664601372360704 200 1.203 ms
GET /api/guilds/discord/1418955325070905404 200 2.559 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.675 ms
GET /api/towns/guild/1418955325070905404 200 7.549 ms
GET /api/users/discord/297664601372360704 200 1.321 ms
GET /api/users/discord/297664601372360704 200 1.277 ms
GET /api/guilds/discord/1418955325070905404 200 2.080 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.944 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities 200 2.856 ms
GET /api/action-points/cmgy4vxeq000vg50hije1z4zi 200 1.374 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 2.647 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/skills 200 1.677 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/objects 200 55.143 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/objects 200 3.621 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/inventory 200 3.227 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities 200 3.033 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi 200 7.185 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities 200 3.207 ms
POST /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities/use 200 87.839 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 4.391 ms
GET /api/guilds/discord/1418955325070905404 200 2.462 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities 200 3.200 ms
POST /api/characters/cmgy4vxeq000vg50hije1z4zi/capabilities/use 200 17.904 ms
GET /api/expeditions/character/cmgy4vxeq000vg50hije1z4zi/active 200 2.593 ms
GET /api/guilds/discord/1418955325070905404 200 1.792 ms
GET /api/users/discord/366604463982772224 200 1.948 ms
PUT /api/users/discord/366604463982772224 200 4.546 ms
POST /api/guilds 200 3.818 ms
GET /api/towns/guild/1418955325070905404 200 4.973 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 9.598 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 5.505 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 5.931 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.165 ms
GET /api/users/discord/290254533718835201 200 1.770 ms
PUT /api/users/discord/290254533718835201 200 3.714 ms
POST /api/guilds 200 5.337 ms
GET /api/towns/guild/1418955325070905404 200 5.479 ms
GET /api/characters/active/290254533718835201/cmgwqj7zf0001g50hecwj7u03 200 75.981 ms
GET /api/expeditions/character/cmgzgct7i000xg50hbwl2ah4i/active 200 45.668 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 4.496 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.910 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/users/discord/290254533718835201 200 1.957 ms
PUT /api/users/discord/290254533718835201 200 3.571 ms
POST /api/guilds 200 5.306 ms
GET /api/users/discord/290254533718835201 200 5.351 ms
GET /api/guilds/discord/1418955325070905404 200 2.212 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 52.036 ms
GET /api/towns/guild/1418955325070905404 200 5.542 ms
GET /api/users/discord/290254533718835201 200 1.486 ms
GET /api/users/discord/290254533718835201 200 2.703 ms
GET /api/guilds/discord/1418955325070905404 200 2.006 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.074 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/capabilities 200 3.357 ms
GET /api/action-points/cmgzgct7i000xg50hbwl2ah4i 200 1.387 ms
GET /api/expeditions/character/cmgzgct7i000xg50hbwl2ah4i/active 200 45.596 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/skills 200 3.377 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/objects 200 46.621 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/objects 200 2.924 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/inventory 200 3.950 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i/capabilities 200 2.406 ms
GET /api/characters/cmgzgct7i000xg50hbwl2ah4i 200 9.324 ms
GET /api/seasons/current 200 6.504 ms
POST /api/characters/cmgzgct7i000xg50hbwl2ah4i/capabilities/use 200 87.355 ms
GET /api/guilds/discord/1418955325070905404 200 2.035 ms
GET /api/users/discord/290254533718835201 200 2.489 ms
PUT /api/users/discord/290254533718835201 200 3.486 ms
POST /api/guilds 200 3.662 ms
GET /api/towns/guild/1418955325070905404 200 5.858 ms
GET /api/characters/active/290254533718835201/cmgwqj7zf0001g50hecwj7u03 200 13.500 ms
GET /api/expeditions/character/cmgzgct7i000xg50hbwl2ah4i/active 200 4.068 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 3.972 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 1.984 ms
GET /api/users/discord/109604651682279424 200 2.281 ms
PUT /api/users/discord/109604651682279424 200 3.490 ms
POST /api/guilds 200 5.336 ms
GET /api/users/discord/109604651682279424 200 1.571 ms
GET /api/guilds/discord/1418955325070905404 200 4.591 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 26.073 ms
GET /api/towns/guild/1418955325070905404 200 8.653 ms
GET /api/characters/active/109604651682279424/cmgwqj7zf0001g50hecwj7u03 200 18.114 ms
GET /api/expeditions/character/cmgwqkl3a0004g50hev6ke04m/active 200 2.816 ms
GET /api/chantiers/guild/1418955325070905404 200 64.693 ms
GET /api/users/discord/109604651682279424 200 1.878 ms
PUT /api/users/discord/109604651682279424 200 3.288 ms
POST /api/guilds 200 4.167 ms
GET /api/users/discord/109604651682279424 200 1.174 ms
GET /api/guilds/discord/1418955325070905404 200 3.342 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.677 ms
GET /api/towns/guild/1418955325070905404 200 6.878 ms
GET /api/users/discord/109604651682279424 200 1.448 ms
GET /api/users/discord/109604651682279424 200 1.330 ms
GET /api/guilds/discord/1418955325070905404 200 3.189 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.014 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.494 ms
GET /api/action-points/cmgwqkl3a0004g50hev6ke04m 200 1.646 ms
GET /api/expeditions/character/cmgwqkl3a0004g50hev6ke04m/active 200 2.353 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/skills 200 1.193 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 44.867 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 4.137 ms
GET /api/capabilities/cataplasme-stock/cmgwqkl3a0004g50hev6ke04m 200 3.665 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/inventory 200 3.327 ms
GET /api/users/discord/109604651682279424 200 1.765 ms
GET /api/towns/guild/1418955325070905404 200 4.450 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 8.283 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 3.976 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03/craft-type/MENUISER 200 82.564 ms
GET /api/users/discord/366604463982772224 200 2.030 ms
PUT /api/users/discord/366604463982772224 200 3.394 ms
POST /api/guilds 200 3.553 ms
GET /api/towns/guild/1418955325070905404 200 4.158 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 55.907 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 42.142 ms
GET /api/towns/cmgwqj7zf0001g50hecwj7u03 200 3.947 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 5.244 ms
GET /api/towns/guild/1418955325070905404 200 6.973 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 52.831 ms
GET /api/towns/guild/1418955325070905404 200 4.652 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.100 ms
GET /api/action-points/cmgxy6bax0002g50ht436us7y 200 1.967 ms
GET /api/characters/cmgxy6bax0002g50ht436us7y/capabilities 200 3.409 ms
GET /api/characters/cmgxy6bax0002g50ht436us7y/skills 200 2.065 ms
GET /api/characters/cmgxy6bax0002g50ht436us7y/objects 200 58.502 ms
GET /api/characters/cmgxy6bax0002g50ht436us7y/objects 200 3.747 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/users/discord/109604651682279424 200 2.008 ms
PUT /api/users/discord/109604651682279424 200 3.591 ms
POST /api/guilds 200 5.279 ms
GET /api/users/discord/109604651682279424 200 1.456 ms
GET /api/guilds/discord/1418955325070905404 200 3.846 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 49.867 ms
GET /api/towns/guild/1418955325070905404 200 4.194 ms
GET /api/users/discord/109604651682279424 200 1.021 ms
GET /api/users/discord/109604651682279424 200 0.995 ms
GET /api/guilds/discord/1418955325070905404 200 2.957 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.474 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.416 ms
GET /api/action-points/cmgwqkl3a0004g50hev6ke04m 200 1.190 ms
GET /api/expeditions/character/cmgwqkl3a0004g50hev6ke04m/active 200 46.502 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/skills 200 1.674 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 45.791 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 4.683 ms
GET /api/capabilities/cataplasme-stock/cmgwqkl3a0004g50hev6ke04m 200 3.632 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/inventory 200 3.674 ms
GET /api/users/discord/109604651682279424 200 1.989 ms
GET /api/towns/guild/1418955325070905404 200 6.268 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 11.165 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.526 ms
GET /api/projects/town/cmgwqj7zf0001g50hecwj7u03/craft-type/MENUISER 200 56.508 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/users/discord/978702166988582912 200 11.022 ms
PUT /api/users/discord/978702166988582912 200 3.821 ms
POST /api/guilds 200 3.818 ms
GET /api/users/discord/978702166988582912 200 1.181 ms
GET /api/guilds/discord/1418955325070905404 200 2.194 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 50.810 ms
GET /api/towns/guild/1418955325070905404 200 8.569 ms
GET /api/users/discord/978702166988582912 200 2.416 ms
GET /api/users/discord/978702166988582912 200 1.784 ms
GET /api/guilds/discord/1418955325070905404 200 1.721 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 5.607 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/capabilities 200 2.488 ms
GET /api/action-points/cmgxo86ln000fg50ip7iloc7e 200 1.189 ms
GET /api/expeditions/character/cmgxo86ln000fg50ip7iloc7e/active 200 46.642 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/skills 200 3.495 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/objects 200 55.036 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/objects 200 3.211 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/inventory 200 2.806 ms
GET /api/towns/guild/1418955325070905404 200 4.685 ms
GET /api/characters/active/978702166988582912/cmgwqj7zf0001g50hecwj7u03 200 11.736 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 4.475 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 4.282 ms
GET /api/towns/guild/1418955325070905404 200 14.963 ms
GET /api/characters/active/978702166988582912/cmgwqj7zf0001g50hecwj7u03 200 32.268 ms
POST /api/characters/cmgxo86ln000fg50ip7iloc7e/eat-alternative 200 53.428 ms
GET /api/towns/guild/1418955325070905404 200 5.450 ms
GET /api/characters/active/978702166988582912/cmgwqj7zf0001g50hecwj7u03 200 13.133 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 3.454 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 1.846 ms
GET /api/guilds/discord/1418955325070905404 200 2.527 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/capabilities 200 3.096 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e 200 9.539 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e 200 8.673 ms
GET /api/guilds/discord/1418955325070905404 200 2.367 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.137 ms
GET /api/characters/cmgxo86ln000fg50ip7iloc7e/capabilities 200 2.909 ms
[LUCKY_COOK] PA: 2 | Vivres: 5 | Max possible: 15 | Roll 1: 2 | Roll 2: 7 | Résultat: 7
POST /api/characters/cmgxo86ln000fg50ip7iloc7e/capabilities/use 200 78.679 ms
GET /api/expeditions/character/cmgxo86ln000fg50ip7iloc7e/active 200 3.221 ms
GET /api/guilds/discord/1418955325070905404 200 2.074 ms
GET /api/users/discord/168107702659186688 200 2.148 ms
PUT /api/users/discord/168107702659186688 200 3.696 ms
POST /api/guilds 200 7.397 ms
GET /api/users/discord/168107702659186688 200 2.019 ms
GET /api/guilds/discord/1418955325070905404 200 2.399 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 56.946 ms
GET /api/towns/guild/1418955325070905404 200 5.059 ms
GET /api/users/discord/168107702659186688 200 1.088 ms
GET /api/users/discord/168107702659186688 200 1.015 ms
GET /api/guilds/discord/1418955325070905404 200 2.304 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 7.625 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/capabilities 200 3.075 ms
GET /api/action-points/cmgwqn5je000ag50hxlilde94 200 1.702 ms
GET /api/expeditions/character/cmgwqn5je000ag50hxlilde94/active 200 51.195 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/skills 200 1.904 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/objects 200 50.740 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/objects 200 3.843 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/inventory 200 3.730 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94/capabilities 200 2.547 ms
GET /api/characters/cmgwqn5je000ag50hxlilde94 200 10.118 ms
GET /api/seasons/current 200 4.180 ms
[LUCKY_MINE] Personnage: Gerolt | Roll 1: 3 | Roll 2: 4 | Résultat: 4
POST /api/characters/cmgwqn5je000ag50hxlilde94/capabilities/use 200 74.016 ms
GET /api/guilds/discord/1418955325070905404 200 2.000 ms
GET /api/users/discord/366604463982772224 200 2.182 ms
PUT /api/users/discord/366604463982772224 200 4.764 ms
POST /api/guilds 200 4.817 ms
GET /api/users/discord/366604463982772224 200 1.790 ms
GET /api/guilds/discord/1418955325070905404 200 2.203 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 58.915 ms
GET /api/towns/guild/1418955325070905404 200 4.507 ms
GET /api/users/discord/366604463982772224 200 1.420 ms
GET /api/users/discord/366604463982772224 200 1.500 ms
GET /api/guilds/discord/1418955325070905404 200 1.638 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.138 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/capabilities 200 2.504 ms
GET /api/action-points/cmgxp91qf000ig50i3xsbuqzk 200 1.671 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 61.927 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/skills 200 1.792 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 58.151 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/objects 200 4.314 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory 200 3.873 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk 200 8.580 ms
GET /api/towns/guild/1418955325070905404 200 4.138 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.511 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory 200 4.348 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk 200 8.650 ms
GET /api/characters/cmgy4vxeq000vg50hije1z4zi 200 18.324 ms
GET /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory 200 3.802 ms
POST /api/characters/cmgxp91qf000ig50i3xsbuqzk/inventory/transfer 200 32.454 ms
BadRequestError: Validation failed
    at /app/dist/src/api/middleware/validation.middleware.js:21:49
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at requireAuthOrInternal (/app/dist/src/middleware/auth.js:166:16)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:119:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at /app/node_modules/express/lib/router/index.js:284:15
    at param (/app/node_modules/express/lib/router/index.js:365:14) {
  errors: [
    {
      validation: 'cuid',
      code: 'invalid_string',
      message: 'Invalid cuid',
      path: [Array]
    }
  ]
}
GET /api/expeditions/town/undefined 400 2.955 ms
GET /api/guilds/discord/1418955325070905404 200 2.141 ms
GET /api/users/discord/366604463982772224 200 1.774 ms
PUT /api/users/discord/366604463982772224 200 3.583 ms
POST /api/guilds 200 5.383 ms
GET /api/towns/guild/1418955325070905404 200 5.494 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 58.809 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 44.214 ms
GET /api/towns/guild/1418955325070905404 200 4.297 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 2.470 ms
GET /api/towns/guild/1418955325070905404 200 5.764 ms
GET /api/towns/guild/1418955325070905404 200 4.890 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 6.330 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 2.178 ms
GET /api/users/discord/366604463982772224 200 1.780 ms
PUT /api/users/discord/366604463982772224 200 5.098 ms
POST /api/guilds 200 4.559 ms
GET /api/towns/guild/1418955325070905404 200 4.214 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 55.936 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 48.483 ms
GET /api/towns/guild/1418955325070905404 200 5.007 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 3.170 ms
GET /api/towns/guild/1418955325070905404 200 6.358 ms
GET /api/towns/guild/1418955325070905404 200 5.744 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 7.034 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 2.395 ms
GET /api/towns/guild/1418955325070905404 200 5.009 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 7.147 ms
GET /api/towns/guild/1418955325070905404 200 4.907 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.581 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.442 ms
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
NotFoundError: Endpoint not found
    at /app/dist/src/app.js:165:36
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at session (/app/node_modules/express-session/index.js:487:7)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
    at /app/node_modules/express/lib/router/index.js:286:9
GET /api/towns/guild/1418955325070905404 200 6.144 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 7.878 ms
GET /api/users/discord/366604463982772224 200 2.034 ms
PUT /api/users/discord/366604463982772224 200 3.871 ms
POST /api/guilds 200 3.967 ms
GET /api/towns/guild/1418955325070905404 200 4.874 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 8.166 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 2.597 ms
GET /api/towns/guild/1418955325070905404 200 4.161 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 1.928 ms
GET /api/users/discord/366604463982772224 200 2.223 ms
PUT /api/users/discord/366604463982772224 200 5.335 ms
POST /api/guilds 200 7.913 ms
GET /api/towns/guild/1418955325070905404 200 8.726 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 8.805 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 2.321 ms
GET /api/towns/guild/1418955325070905404 200 5.011 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 2.793 ms
GET /api/towns/guild/1418955325070905404 200 9.346 ms
GET /api/towns/guild/1418955325070905404 200 3.866 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 7.396 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 2.234 ms
GET /api/towns/guild/1418955325070905404 200 5.686 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 6.550 ms
GET /api/towns/guild/1418955325070905404 200 3.663 ms
GET /api/towns/guild/1418955325070905404 200 5.818 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 6.319 ms
INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. initialResources=[] INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. initialResources=[] timestamp=2025-10-30T17:05:51.783Z INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. initialResources=[] INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | createdBy=366604463982772224 event=created expeditionId=cmhdoednn001sg50h4wb5d2pz expeditionName=La maison est derrière, le monde est devant. initialResources=[] timestamp=2025-10-30T17:05:51.783Z townId=cmgwqj7zf0001g50hecwj7u03
POST /api/expeditions 201 16.909 ms
INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined expeditionId=cmhdoednn001sg50h4wb5d2pz joinedBy=366604463982772224 INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined expeditionId=cmhdoednn001sg50h4wb5d2pz INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk INF INF INF INF expedition_event | INF INF INF INF expedition_event | characterId=cmgxp91qf000ig50i3xsbuqzk characterName=Hasan al-Arshad event=character_joined expeditionId=cmhdoednn001sg50h4wb5d2pz joinedBy=366604463982772224 timestamp=2025-10-30T17:05:51.803Z
POST /api/expeditions/cmhdoednn001sg50h4wb5d2pz/join 201 14.948 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 2.122 ms
GET /api/guilds/discord/1418955325070905404 200 2.447 ms
GET /api/users/discord/366604463982772224 200 1.918 ms
PUT /api/users/discord/366604463982772224 200 3.204 ms
POST /api/guilds 200 7.578 ms
GET /api/towns/guild/1418955325070905404 200 6.225 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 10.956 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 7.155 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 1.968 ms
GET /api/towns/guild/1418955325070905404 200 5.726 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 8.364 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 3.129 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 1.211 ms
GET /api/towns/guild/1418955325070905404 200 6.635 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 7.167 ms
GET /api/towns/guild/1418955325070905404 200 10.638 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.379 ms
GET /api/resources/types 200 2.781 ms
GET /api/towns/guild/1418955325070905404 200 4.678 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 3.455 ms
GET /api/expeditions?includeReturned=true 200 5.585 ms
GET /api/expeditions/cmhdoednn001sg50h4wb5d2pz 200 5.911 ms
GET /api/expeditions/cmhdoednn001sg50h4wb5d2pz 200 3.878 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 1.416 ms
GET /api/resources/types 200 1.859 ms
GET /api/resources/types 200 1.731 ms
GET /api/users/discord/366604463982772224 200 1.627 ms
PUT /api/users/discord/366604463982772224 200 2.624 ms
POST /api/guilds 200 3.799 ms
GET /api/towns/guild/1418955325070905404 200 3.767 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 53.818 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active?userId=366604463982772224 200 55.461 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 1.822 ms
GET /api/towns/guild/1418955325070905404 200 5.607 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 9.919 ms
GET /api/expeditions/character/cmgxp91qf000ig50i3xsbuqzk/active 200 4.134 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 1.300 ms
GET /api/towns/guild/1418955325070905404 200 5.252 ms
GET /api/characters/active/366604463982772224/cmgwqj7zf0001g50hecwj7u03 200 8.235 ms
GET /api/towns/guild/1418955325070905404 200 4.132 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 1.641 ms
GET /api/resources/types 200 1.802 ms
GET /api/towns/guild/1418955325070905404 200 4.085 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.439 ms
GET /api/users/discord/109604651682279424 200 1.855 ms
PUT /api/users/discord/109604651682279424 200 3.515 ms
POST /api/guilds 200 5.549 ms
GET /api/users/discord/109604651682279424 200 1.056 ms
GET /api/guilds/discord/1418955325070905404 200 1.859 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 56.674 ms
GET /api/towns/guild/1418955325070905404 200 5.693 ms
GET /api/users/discord/109604651682279424 200 1.045 ms
GET /api/users/discord/109604651682279424 200 0.918 ms
GET /api/guilds/discord/1418955325070905404 200 1.511 ms
GET /api/characters/town/cmgwqj7zf0001g50hecwj7u03 200 6.395 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/capabilities 200 2.564 ms
GET /api/action-points/cmgwqkl3a0004g50hev6ke04m 200 1.421 ms
GET /api/expeditions/character/cmgwqkl3a0004g50hev6ke04m/active 200 64.252 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/skills 200 8.172 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 65.084 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/objects 200 3.873 ms
GET /api/capabilities/cataplasme-stock/cmgwqkl3a0004g50hev6ke04m 200 9.959 ms
GET /api/characters/cmgwqkl3a0004g50hev6ke04m/inventory 200 3.686 ms
GET /api/towns/guild/1418955325070905404 200 6.128 ms
GET /api/characters/active/109604651682279424/cmgwqj7zf0001g50hecwj7u03 200 46.978 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 6.911 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.322 ms
GET /api/towns/guild/1418955325070905404 200 4.781 ms
GET /api/characters/active/109604651682279424/cmgwqj7zf0001g50hecwj7u03 200 6.320 ms
GET /api/towns/guild/1418955325070905404 200 9.787 ms
GET /api/characters/active/109604651682279424/cmgwqj7zf0001g50hecwj7u03 200 40.841 ms
POST /api/characters/cmgwqkl3a0004g50hev6ke04m/eat-alternative 200 18.446 ms
POST /api/characters/cmgwqkl3a0004g50hev6ke04m/eat-alternative 200 13.697 ms
GET /api/towns/guild/1418955325070905404 200 5.428 ms
GET /api/characters/active/109604651682279424/cmgwqj7zf0001g50hecwj7u03 200 17.054 ms
GET /api/expeditions/town/cmgwqj7zf0001g50hecwj7u03 200 5.142 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 2.597 ms
GET /api/guilds/discord/1418955325070905404 200 2.382 ms
GET /api/towns/guild/1418955325070905404 200 5.277 ms
GET /api/resources/CITY/cmgwqj7zf0001g50hecwj7u03 200 1.732 ms
GET /api/expeditions?includeReturned=true 200 46.318 ms
GET /api/expeditions/cmhdoednn001sg50h4wb5d2pz 200 55.048 ms
GET /api/expeditions/cmhdoednn001sg50h4wb5d2pz 200 10.115 ms
GET /api/resources/EXPEDITION/cmhdoednn001sg50h4wb5d2pz 200 5.018 ms
GET /api/resources/types 200 2.149 ms
GET /api/resources/types 200 1.867 ms
GET /api/resources/types 200 1.796 ms
GET /api/resources/types 200 1.884 ms