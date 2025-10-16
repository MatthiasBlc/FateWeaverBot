import { cleanEnv } from "envalid";
import { port, str } from "envalid/dist/validators";

export default cleanEnv(process.env, {
  DATABASE_URL: str(),
  PORT: port(),
  SESSION_SECRET: str(),
  CORS_ORIGIN: str(),
  DISCORD_TOKEN: str({ default: "" }), // Optional: Discord bot token for notifications
});