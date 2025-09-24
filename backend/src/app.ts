import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import userRoutes from "./routes/users";
import serverRoutes from "./routes/servers";
import characterRoutes from "./routes/characters";
import roleRoutes from "./routes/roles";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import cors from "cors";
import session from "express-session";
import env from "./util/validateEnv";
// import { requireAuth } from "./middleware/auth";
import { prisma } from "./util/db";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

const app = express();

// Configuration du proxy trust
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

// cors needed for dev environment
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  })
);

app.use(morgan("dev"));

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
app.use("/api/servers", serverRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/roles", roleRoutes);

// Routes protégées
// app.use("/api/notes", requireAuth, notesRoutes);

// Health endpoint for container healthcheck
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
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
