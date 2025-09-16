import { Client, GatewayIntentBits } from "discord.js";
import http from "http";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("Pong 🏓 !");
  }
});

// Minimal HTTP server for healthcheck
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const HEALTH_PORT = process.env.HEALTH_PORT || 3001;
server.listen(HEALTH_PORT, () => {
  console.log(`🩺 Health server listening on :${HEALTH_PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
