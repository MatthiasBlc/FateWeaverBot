export interface BotConfig {
  prefix: string;
  healthPort: number;
  apiUrl: string;
}

console.log("[DEBUG] Loading configuration...");
console.log("[DEBUG] BOT_PREFIX:", process.env.BOT_PREFIX);
console.log("[DEBUG] HEALTH_PORT:", process.env.HEALTH_PORT);
console.log("[DEBUG] API_URL:", process.env.API_URL);

export const config: BotConfig = {
  prefix: process.env.BOT_PREFIX || "!",
  healthPort: Number(process.env.HEALTH_PORT || 3001),
  apiUrl: process.env.API_URL || "http://backenddev:3000",
};

console.log("[DEBUG] Final configuration:", JSON.stringify(config, null, 2));
