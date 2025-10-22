import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import userRoutes from "./routes/users";
import guildRoutes from "./routes/guilds";
import characterRoutes from "./routes/characters";
import roleRoutes from "./routes/roles";
import actionPointRoutes from "./routes/action-point.routes";
import townRoutes from "./routes/towns";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import cors from "cors";
import session from "express-session";
import env from "./util/validateEnv";
// import { requireAuth } from "./middleware/auth";
import { prisma } from "./util/db";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { setupDailyPaJob } from "./cron/daily-pa.cron";
import { setupHungerIncreaseJob } from "./cron/hunger-increase.cron";
import { setupDailyPmJob } from "./cron/daily-pm.cron";
import { setupExpeditionJobs } from "./cron/expedition.cron";
import { setupSeasonChangeJob } from "./cron/season-change.cron";
import { setupDailyMessageJob } from "./cron/daily-message.cron";
import chantierRoutes from "./routes/chantier";
import expeditionRoutes from "./routes/expedition";
import expeditionAdminRoutes from "./routes/admin/expeditionAdmin";
import capabilitiesRoutes from "./routes/capabilities";
import seasonsRoutes from "./routes/seasons";
import objectsRoutes from "./routes/objects";
import projectsRoutes from "./routes/projects";
import resourcesRoutes from "./routes/resources";
import skillsRoutes from "./routes/skills";
import jobRoutes from "./routes/jobs";

const app = express();

// Démarrer les jobs CRON
console.log("🔧 Initializing CRON jobs...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

if (process.env.NODE_ENV !== "test") {
  console.log("✅ Starting CRON jobs (not in test mode)");

  try {
    setupDailyPaJob();
    console.log("✅ Daily PA job started");
  } catch (error) {
    console.error("❌ Failed to start Daily PA job:", error);
  }

  try {
    setupHungerIncreaseJob();
    console.log("✅ Hunger increase job started");
  } catch (error) {
    console.error("❌ Failed to start Hunger increase job:", error);
  }

  try {
    setupDailyPmJob();
    console.log("✅ Daily PM job started");
  } catch (error) {
    console.error("❌ Failed to start Daily PM job:", error);
  }

  try {
    setupExpeditionJobs();
    console.log("✅ Expedition jobs started");
  } catch (error) {
    console.error("❌ Failed to start Expedition jobs:", error);
  }

  try {
    setupSeasonChangeJob();
    console.log("✅ Season change job started");
  } catch (error) {
    console.error("❌ Failed to start Season change job:", error);
  }

  try {
    setupDailyMessageJob();
    console.log("✅ Daily message job started");
  } catch (error) {
    console.error("❌ Failed to start Daily message job:", error);
  }

  console.log("🎉 All CRON jobs initialized successfully");
} else {
  console.log("⏭️  Skipping CRON jobs (test mode)");
}

// Configuration du proxy trust
const isBehindProxy =
  process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production";
console.log(`Trust proxy settings: ${isBehindProxy ? "enabled" : "disabled"}`);

if (isBehindProxy) {
  // Faire confiance au premier proxy
  app.set("trust proxy", 1);
}

// cors needed for dev environment
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  })
);

// Morgan logger - compact format with filters
app.use(
  morgan(":method :url :status :response-time ms", {
    skip: (req, res) => {
      // Skip health checks
      if (req.url === "/health") return true;

      // Don't skip 404 for debugging chantiers issue
      // if (res.statusCode === 404) return true;

      return false;
    },
  })
);

app.use(express.json());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000,
    },
    rolling: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // Vérification des sessions expirées toutes les 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// Routes publiques
app.use("/api/users", userRoutes);
app.use("/api/guilds", guildRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/capabilities", capabilitiesRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/action-points", actionPointRoutes);
app.use("/api/towns", townRoutes);
app.use("/api/objects", objectsRoutes);
app.use("/api/expeditions", expeditionRoutes);
app.use("/api/chantiers", chantierRoutes);
app.use("/api/seasons", seasonsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/jobs", jobRoutes);

// Routes admin
app.use("/api/admin/expeditions", expeditionAdminRoutes);

// Routes protégées
// app.use("/api/notes", requireAuth, notesRoutes);

// Health endpoint for container healthcheck (no logging)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, _res, next) => {
  console.error(`🔴 404 NOT FOUND: ${req.method} ${req.originalUrl || req.url}`);
  console.error(`🔴 Query params:`, req.query);
  console.error(`🔴 Body:`, req.body);
  next(createHttpError(404, `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;

  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }

  if (createHttpError.isHttpError(error)) {
    statusCode = error.status;
  }

  res.status(statusCode).json({ error: errorMessage });
});

export default app;
