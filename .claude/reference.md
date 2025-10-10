# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FateWeaver is a Discord role-playing game bot with a backend API. It manages characters, community projects (chantiers), expeditions, resources, and survival mechanics like hunger across Discord servers. The system uses a 3-tier architecture: Discord Bot (TypeScript) ↔ Backend API (Express/TypeScript) ↔ PostgreSQL (via Prisma ORM).

**Important Notes:**
- The `frontend/` directory is deprecated and should be ignored
- The `docs/` directory contains development notes and historical planning documents that may not reflect the current or future state of the codebase
- **Collaboration Protocol:** See `docs/COLLABORATION-PROTOCOL.md` for working with Code Supernova to optimize token usage

**Meta-Protocol: Documenting Efficient Workflows**
When you (Claude) discover or establish an efficient workflow, process, or pattern:
1. **Document it:** Create a new file in `docs/` (e.g., `docs/WORKFLOW-NAME.md`)
2. **Reference it:** Add a pointer in this file or relevant documentation
3. **Optimize for tokens:** Keep this file minimal, detailed docs in separate files
4. **Purpose:** Future Claude sessions should benefit from discovered patterns without re-learning

## Common Commands

### Development Setup
```bash
# Start all services (bot, backend, postgres)
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f discord-botdev    # Bot logs
docker compose logs -f backenddev        # Backend logs
```

### Bot Development
```bash
# Inside bot container or bot/ directory
npm run dev              # Start bot with hot reload
npm run deploy           # Smart deploy only changed commands
npm run deploy:force     # Force redeploy all commands
npm run list-commands    # List deployed Discord commands
npm run build            # Build TypeScript
npm run lint             # Run ESLint
```

### Backend Development
```bash
# Inside backend container or backend/ directory
npm run dev              # Start with ts-node (hot reload)
npm run build            # Build TypeScript to dist/
npm run start            # Run built code (production)
npm run lint             # Run ESLint

# Prisma commands
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create and apply migration
npx prisma db seed       # Seed database
npx prisma studio        # Open Prisma Studio (port 5555)
```

### Prisma via Docker (from project root)
```bash
./prisma-docker.sh all       # Run migrations + generate client
./prisma-docker.sh migrate   # Run migrations only
./prisma-docker.sh generate  # Generate client only
```

## Architecture

### Directory Structure
```
bot/                     # Discord bot (discord.js v14)
├── src/
│   ├── commands/        # Slash commands (auto-loaded)
│   │   ├── admin-commands/    # Admin-only commands
│   │   └── user-commands/     # Public commands
│   ├── features/        # Feature-based organization
│   │   ├── chantiers/   # Community projects system
│   │   ├── expeditions/ # Expedition management
│   │   ├── stock/       # Resource/food stock
│   │   ├── hunger/      # Hunger mechanics
│   │   └── admin/       # Admin features
│   ├── core/            # Core bot infrastructure
│   ├── services/        # External services (API client, logger)
│   └── utils/           # Shared utilities

backend/                 # REST API (Express + Prisma)
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic services
│   ├── cron/            # Scheduled tasks
│   │   ├── daily-pa.cron.ts          # Daily PA regeneration
│   │   ├── hunger-increase.cron.ts   # Hunger system
│   │   ├── expedition.cron.ts        # Expedition returns
│   │   └── season-change.cron.ts     # Season cycling
│   ├── middleware/      # Express middleware
│   └── util/            # Utilities
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration history
│   └── seed.ts          # Database seeding
```

### Key Concepts

**Discord Bot → Backend Communication:**
- Bot calls backend via HTTP (axios) at `API_URL` env var
- Backend runs at `http://backenddev:3000` in Docker
- Service layer: `bot/src/services/api.ts` wraps all API calls

**Data Model Flow:**
1. Discord Guild → Guild → Town (1:1:1)
2. Discord User → User → Characters (1:1:many)
3. Each Character belongs to one Town and one User
4. Characters have roles, capabilities, PA (action points), hunger, HP, PM

**Command Deployment:**
- Uses intelligent deployment system (only deploys changed commands)
- Guild mode (dev): Set `DISCORD_GUILD_ID` for instant updates
- Global mode (prod): Leave `DISCORD_GUILD_ID` empty (up to 1hr propagation)
- Admin commands use `PermissionFlagsBits.Administrator`

**Feature Organization:**
- Each feature has: `feature.command.ts`, `feature.handlers.ts`, `feature.utils.ts`, `feature.types.ts`
- Commands in `commands/` directories are auto-loaded by the bot
- Interactions (buttons, modals, select menus) handled in `features/*/handlers.ts`

### Database Schema (Key Models)

**Core Entities:**
- `Guild`: Discord server → 1:1 with Town
- `Town`: In-game city, has resourceStocks, chantiers, expeditions
- `User`: Discord user account
- `Character`: Player character with PA, hunger, HP, PM, capabilities
- `Chantier`: Community project requiring collective PA investment
- `Expedition`: Group journey with members and separate resource stocks
- `ResourceStock`: Polymorphic (Town or Expedition), tracks resource quantities
- `ResourceType`: Types of resources (food, materials, etc.)

**Important Fields:**
- `Character.paTotal`: Current action points (0-4)
- `Character.hungerLevel`: 0=dead, 1=agony, 2=starving, 3=hungry, 4=healthy
- `Character.isActive`: Only one active character per user per town
- `Chantier.status`: PLAN → IN_PROGRESS → COMPLETED
- `Expedition.status`: PLANNING → LOCKED → DEPARTED → RETURNED

### Cron Jobs (Backend)

The backend runs automated tasks:
- **Daily PA regeneration** (daily-pa.cron.ts): Resets PA for all characters
- **Hunger increase** (hunger-increase.cron.ts): Increases hunger over time
- **Expedition returns** (expedition.cron.ts): Processes expeditions that return
- **Season changes** (season-change.cron.ts): Cycles between summer/winter

## Development Workflow

### Adding a New Discord Command

1. Choose directory: `bot/src/commands/admin-commands/` or `user-commands/`
2. Create file: `command-name.ts`
3. Use template from `bot/src/commands/_template.ts`
4. For admin commands, add `.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)`
5. Run `npm run deploy` to register with Discord
6. Commands are auto-loaded at bot startup

### Adding a New Feature

1. Create `bot/src/features/feature-name/` directory
2. Add files: `feature.command.ts`, `feature.handlers.ts`, `feature.utils.ts`, `feature.types.ts`
3. Export command from `feature.command.ts`
4. Handle interactions (buttons, modals) in `feature.handlers.ts`
5. Register interaction handlers in `bot/src/index.ts` if needed

### Adding a Backend Endpoint

1. Define route in `backend/src/routes/*.ts`
2. Implement controller in `backend/src/controllers/*.ts`
3. Add business logic in `backend/src/services/*.ts` if complex
4. Update Prisma schema if database changes needed
5. Run migration: `npm run prisma:migrate:dev`
6. Call from bot using `bot/src/services/api.ts`

### Database Changes

1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description_of_change` in backend
3. Prisma client auto-regenerates
4. Update seed file if needed: `backend/prisma/seed.ts`
5. Docker: Use `./prisma-docker.sh all` from project root

## Testing & Deployment

### Local Testing
- Use guild mode: Set `DISCORD_GUILD_ID` in `.env` for instant command updates
- Check bot logs: `docker compose logs -f discord-botdev`
- Check backend logs: `docker compose logs -f backenddev`
- Access Prisma Studio: `http://localhost:5555` (if exposed)

### Production Deployment
```bash
# Option 1: Use deployment script
./deploy_prod.sh

# Option 2: Manual
docker compose -f docker-compose.prod.yml up -d --build
```

### Important Notes
- Bot requires initial command deployment: `npm run deploy` in bot container
- Backend auto-runs migrations on startup via docker-compose command
- Commands in global mode take up to 1 hour to propagate
- Environment variables defined in `.env` at project root
