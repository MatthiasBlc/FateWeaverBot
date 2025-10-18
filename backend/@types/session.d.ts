import { Prisma } from "@prisma/client";

declare module "express-session" {
  interface SessionData {
    userId: Prisma.InputJsonValue; // or use string if you're storing string IDs
  }
}
