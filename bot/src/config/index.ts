export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || "development_token",
    clientId: process.env.DISCORD_CLIENT_ID || "development_client_id",
    guildId: process.env.DISCORD_GUILD_ID,
  },
  api: {
    baseUrl: process.env.API_URL || "http://localhost:3000",
  },
  bot: {},
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

export function validateConfig() {
  // In development, allow missing env vars for testing
  const isDevelopment =
    process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

  if (isDevelopment) {
    // Use console.warn here as logger may not be initialized yet during config load
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️  Running in development mode - some environment variables may be missing"
    );
    return;
  }

  const required = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
