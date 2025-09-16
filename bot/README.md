# FateWeaver Discord Bot

## Todo

Ecrire le système d'api pour récupérer les données de l'utilisateur et les envoyer au backend.
(voir front)

Test unitaires

gitignore unifié

deploy sur server prod

## Logs

```bash
CONTAINER_ID=$(docker ps -q --filter name=discord-botdev)

# Afficher les logs

docker exec $CONTAINER_ID cat /app/logs/bot.log
docker exec $CONTAINER_ID tail -f /app/logs/bot.log
```

## Use docker commands

docker compose up -d --build

docker compose down -v

## Overview

Node.js Discord bot using `discord.js` with a clean, extensible structure. Commands and events are auto-loaded from folders.

## Structure

bot/
index.js # Entrypoint: loads commands/events, health server
commands/ # Message-prefix commands (e.g., !ping)
ping.js
help.js
\_template.js # Command template (copy to create new commands)
events/ # Discord event handlers
ready.js
services/ # API/DB helpers
database.js
config/
config.js # Centralized config (prefix, healthPort, apiUrl)
utils/
logger.js # Simple logger

````

## Environment

Set in repo root `.env` (loaded by docker compose):

- `DISCORD_TOKEN` (required)
- `BOT_PREFIX` (default: `!`)
- `HEALTH_PORT` (default: `3001`)
- `API_URL` (default: `http://backenddev:3000`)

In Discord Developer Portal (Bot → Privileged Gateway Intents):

- Enable “Message Content Intent” (required for prefix commands).

## Run

- Docker: `docker compose up -d --build discord-botdev`
- Logs: `docker compose logs -f discord-botdev`

The bot exposes `GET /health` on `HEALTH_PORT` inside the container for Docker healthchecks.

## Adding a command

1. Copy `commands/_template.js` to `commands/<name>.js`.
2. Implement `name`, `description`, and `execute(client, message, args)`.
3. Use with `!<name>` (or your `BOT_PREFIX`).

Example: `commands/echo.js`

```js
export const command = {
  name: "echo",
  description: "Echo back your message",
  async execute(client, message, args) {
    await message.reply(args.join(" ") || "(no text)");
  },
};
export default command;
````

## Adding an event

Create `events/<event>.js` using the default export:

```js
export default {
  name: "messageDelete",
  once: false,
  execute(client, message) {
    // your logic
  },
};
```

## Notes

- Consider migrating to slash commands if you don’t want Message Content intent.
- Use `services/database.js` to call the backend (`API_URL`).
