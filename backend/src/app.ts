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
import { requireAuth, requireAuthOrInternal } from "./middleware/auth";
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
import adminRoutes from "./routes/admin";

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

      // Skip 404 errors (bot scanners)
      if (res.statusCode === 404) return true;

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

// Routes publiques (authentification, inscription, etc.)
app.use("/api/users", userRoutes);

// Routes publiques pour le bot Discord (protection individuelle avec requireAuthOrInternal)
app.use("/api/guilds", guildRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/capabilities", capabilitiesRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/towns", townRoutes);
app.use("/api/resources", resourcesRoutes);

// Routes protégées - Nécessitent authentification utilisateur OU appel interne (bot Discord)
app.use("/api/characters", requireAuthOrInternal, characterRoutes);
app.use("/api/action-points", requireAuthOrInternal, actionPointRoutes);
app.use("/api/objects", requireAuthOrInternal, objectsRoutes);
app.use("/api/expeditions", requireAuthOrInternal, expeditionRoutes);
app.use("/api/chantiers", requireAuthOrInternal, chantierRoutes);
app.use("/api/projects", requireAuthOrInternal, projectsRoutes);
app.use("/api/seasons", requireAuthOrInternal, seasonsRoutes);
app.use("/api/jobs", requireAuthOrInternal, jobRoutes);

// Routes admin (double protection)
app.use("/api/admin/expeditions", requireAuth, expeditionAdminRoutes);
app.use("/api/admin", adminRoutes);

// Routes protégées
// app.use("/api/notes", requireAuth, notesRoutes);

// Health endpoint for container healthcheck (no logging)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req, _res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;

  // Check for Prisma errors first
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;

    // P2002: Unique constraint failed
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      statusCode = 400;
      errorMessage = `Un élément avec ce ${field === 'name' ? 'nom' : field} existe déjà.`;
    }
    // P2025: Record not found
    else if (prismaError.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Élément non trouvé.';
    }
    // P2003: Foreign key constraint failed
    else if (prismaError.code === 'P2003') {
      statusCode = 400;
      errorMessage = 'Référence invalide - assurez-vous que tous les IDs existent.';
    }
  }
  // Check for AppError (custom error classes)
  else if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
    statusCode = (error as any).statusCode;
    errorMessage = (error as any).message;
  } else if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  } else if (createHttpError.isHttpError(error)) {
    statusCode = error.status;
  }

  res.status(statusCode).json({ error: errorMessage });
});

export default app;
