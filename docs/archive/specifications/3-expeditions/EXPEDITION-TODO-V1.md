1 — Stratégie générale (haute priorité)

Atomicité et invariants : toute opération de transfert de nourriture (ville ↔ expédition), join/leave, et clôture instantanée doit être faite dans une transaction DB pour éviter conditions de course.

Séparer responsabilités : DB = modèle & contraintes → Backend = logique métier & validation → Bot = interface utilisateurs (slash commands + boutons) → Cron = transitions de temps (lock / depart / return).

Idempotence : chaque handler exposé (API/cron) doit être idempotent (si exécuté deux fois, état final inchangé).

Ephémérité UI Discord : interactions admin = éphémères ; affichages utilisateur = embeds + composants dynamiques.

Observabilité : logs structurés pour chaque changement de status et pour chaque transfert de foodStock.

2 — Modifications Prisma & migrations

Nouveaux modèles / enums (déjà validés conceptuellement). Ajouter dans schema.prisma :

model Expedition {
id String @id @default(cuid())
name String
town Town @relation(fields: [townId], references: [id], onDelete: Cascade)
townId String
foodStock Int @default(0)
duration Int // en jours
status ExpeditionStatus @default(PLANNING)
createdAt DateTime @default(now()) @map("created_at")
lockedAt DateTime?
departedAt DateTime?
returnAt DateTime?
members ExpeditionMember[]
@@index([townId])
}

model ExpeditionMember {
id String @id @default(cuid())
expedition Expedition @relation(fields: [expeditionId], references: [id], onDelete: Cascade)
expeditionId String
character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
characterId String
joinedAt DateTime @default(now())
@@unique([expeditionId, characterId])
}

enum ExpeditionStatus {
PLANNING
LOCKED
DEPARTED
RETURNED
}

Migration :

npx prisma migrate dev --name add_expeditions

Vérifier contraintes uniques/indexes.

3 — Endpoints backend (Express / TypeScript)

Créer contrôleur src/controllers/expedition.ts + routes src/routes/expeditions.ts. Principaux endpoints (tous protégés : liaisons guild/town/permissions vérifiées):

User endpoints:

POST /expedition — créer expédition (body: name, duration, takeFood: number)

Validation Zod.

Transaction:

Créer Expedition(status PLANNING).

Si takeFood > 0 : vérifier Town.foodStock >= takeFood puis Town.foodStock -= takeFood && Expedition.foodStock += takeFood.

Créer ExpeditionMember pour créateur.

Retourner embed-like JSON.

POST /expedition/:id/join — rejoindre (characterId)

Vérifier status PLANNING.

Transaction:

Créer ExpeditionMember.

Optionnel: si request contains takeFood, effectuer transfert ville→expédition.

POST /expedition/:id/leave — quitter (characterId) — only while PLANNING

Transaction:

Supprimer ExpeditionMember.

Si after deletion there are 0 members -> auto-terminate: set status = RETURNED (or delete?) — spec: terminer instantanément et rendre vivres → effectue Town.foodStock += Expedition.foodStock; Expedition.foodStock = 0; status = RETURNED; set returnAt = now().

POST /expedition/:id/transfer — transfer food (amount, direction enum 'toExpedition'|'toTown') — only PLANNING

Transaction with balance checks.

GET /expedition/:id — info (only members can read detailed info; others see limited info)

Return: status, foodStock, members (names), createdAt, lockedAt, departedAt, returnAt, duration.

Admin endpoints:

GET /admin/expeditions — list (exclude RETURNED for normal lists unless ?archived=true)

PATCH /admin/expeditions/:id — modify duration/foodStock/status (force-return etc.)

POST /admin/expeditions/:id/force-return — set RETURNED and transfer food back to town.

Important: All transfers + status changes must log via logger.info('expedition_change', {...}).

4 — Logic backend & services

Create src/services/expeditionService.ts with exported functions:

createExpedition({townId, name, duration, creatorCharacterId, takeFood})

joinExpedition(expeditionId, characterId, takeFood?)

leaveExpedition(expeditionId, characterId)

transferFood(expeditionId, amount, direction)

lockExpeditionsForDate(date) — set LOCKED for PLANNING that were created before midnight of date.

departExpeditionsForDateTime(datetime) — set DEPARTED for LOCKED; set departedAt = 08:00 that day if not set; compute returnAt = departedAt + duration days.

returnExpeditionsDue(now) — for DEPARTED where returnAt <= now, transfer foodStock back to town, set status RETURNED.

Each function uses Prisma transaction (prisma.$transaction) and returns structured result.

5 — Cron jobs (scheduling)

Add cron tasks in src/cron/expedition.cron.ts (or reuse existing cron system).

Schedules:

Midnight lock: 0 0 \* \* \* (server timezone must be consistent; prefer UTC config or Europe/Paris if server in that TZ). Implementation: lockExpeditionsForDate(today) — set LOCKED for PLANNING expeditions created before or at midnight (spec: “verrouillée à minuit, le soir de la création” → lock at next midnight after creation; ensure createdAt < today's midnight? We'll set: any PLANNING expedition with createdAt < today 00:00 → LOCKED).

08:00 depart: 0 8 \* \* \* — call departExpeditionsForDateTime(nowAt08h).

Every 10 minutes: run returnExpeditionsDue(now) to catch returns promptly.

Notes:

Use a job runner with leader election if multiple replicas (only one should run cron). If deploy single container, fine.

6 — Bot Discord (TypeScript/ESM)

Files to change: /bot/src/commands/expedition/_, /bot/src/features/expeditions/_, /bot/src/utils/embeds.ts

Slash commands:

/expedition start (modal): fields: name, duration (int), takeFood (int optional). On submit, call backend POST /expedition. Send ephemeral confirmation and public announcement in town channel if desired.

/expedition join — show dropdown of PLANNING expeditions for the guild (fetch GET /expedition/guild/:guildId?status=PLANNING). On select, call backend /expedition/:id/join and show ephemeral confirm.

/expedition info — command shows embed with expedition info. If status=PLANNING and user is member, include two buttons:

Quitter (secondary style) → triggers interaction that calls /expedition/:id/leave.

Transférer (primary) → opens modal to enter amount and direction (toExpedition/toTown) → calls /expedition/:id/transfer.

Buttons only visible/active if expedition.status === PLANNING.

If last member leaves (server-side), backend returns response indicating expedition ended; bot should edit message or send notice: "Expédition terminée — vivres restitués au stock de la ville".

Permissions:

Verify character ownership & membership in responses using API: bot sends characterId with requests.

Disable city commands:

When handling city commands (ex: /chantier build, /manger for town), the API should check the character's current expedition membership and status; if member and status in {LOCKED, DEPARTED} → return 403 with message "Cannot perform city actions while on active expedition". Bot should surfice that error and show friendly message.

Admin UI (/expedition-admin):

Implement exactly like character-admin:

Dropdown listing expeditions (exclude RETURNED by default).

On selection, show ephemeral admin embed + action buttons: Modify duration (modal), Modify foodStock (modal), Manage members (submenu: add by character select, kick by dropdown), Force-return button.

All admin actions call respective admin endpoints.

Edge UX:

When user tries to join an expedition that is FULL/just-locked, show friendly error; re-fetch list.

7 — Transactionality & consistency rules (must include in prompt)

Always perform transfers & member add/removal inside a single prisma.$transaction.

Use SELECT ... FOR UPDATE equivalent? Prisma doesn't expose easily; rely on transactions + optimistic checks (check balances and counts inside transaction and throw if invalid).

Use database constraints for unique ExpeditionMember ([expeditionId, characterId]) to prevent duplicates.

8 — Logging & monitoring

Log each event: create/join/leave/transfer/lock/depart/return with payload {expeditionId, townId, userId, characterId, amount, prevFoodStockTown, prevFoodStockExpedition, newStatus, timestamp}.

Add metrics counters: expedition.created, expedition.joined, expedition.returned.

9 — Tests to implement (important)

Unit & integration tests (Jest + supertest):

DB unit tests:

createExpedition with takeFood > town stock => fails.

joinExpedition dup join => fails.

leaveExpedition last member => expedition becomes RETURNED and food returned.

transferFood > available => fails.

Cron tests:

simulate creation at day-1 -> run lock cron -> check status LOCKED.

simulate locked -> run depart cron at 08:00 -> status DEPARTED and returnAt computed.

simulate elapsed returnAt -> run return cron -> resources transferred to town, status RETURNED.

API E2E tests:

Bot -> create -> join -> transfer -> leave -> check DB state.

Bot integration tests (if infra exists) mocking API responses to verify button flows.

10 — QA acceptance criteria (what Supernova must deliver)

DB migration file + updated Prisma schema.

expeditionService with tests covering core cases.

Controllers & routes functional, with proper Zod validation and unit tests.

Cron tasks scheduled and idempotent.

Bot commands implemented exactly as specified (start/join/info with buttons, admin panel).

All transfers and status changes wrapped in transactions, logged.

API returns clear error messages and codes (400/403/409/500).

expedition-admin replicates character-admin behaviour with dropdown selection and ephemeral interactions.

Documentation snippet in repo docs/expeditions.md describing endpoints, cron schedule, and UX for bot.

Tests green (CI config update optional).
