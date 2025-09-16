export const config = {
  prefix: process.env.BOT_PREFIX || "!",
  healthPort: Number(process.env.HEALTH_PORT || 3001),
  apiUrl: process.env.API_URL || "http://backenddev:3000",
};
