// src/types/prisma-session-store.d.ts
import type { PrismaClient } from "@prisma/client";
import { Store, SessionData as ExpressSessionData } from "express-session";

declare module "@quixo3/prisma-session-store" {
  // Utilisation du type SessionData de express-session
  export interface SessionData extends ExpressSessionData {
    // On peut ajouter des propriétés personnalisées ici si nécessaire
  }

  export interface PrismaSessionStoreOptions {
    checkPeriod?: number;
    dbRecordIdIsSessionId?: boolean;
    dbRecordIdFunction?: () => string | number;
  }

  type SessionDataCallback = (
    err: Error | null,
    session?: ExpressSessionData | null
  ) => void;

  type SessionListCallback = (
    err: Error | null,
    obj?: ExpressSessionData[] | { [sid: string]: ExpressSessionData } | null
  ) => void;

  type SessionLengthCallback = (err: Error | null, length?: number) => void;
  type SessionVoidCallback = (err?: Error | null) => void;

  class PrismaSessionStore extends Store {
    constructor(prisma: PrismaClient, options?: PrismaSessionStoreOptions);

    // Méthodes requises par l'interface Store
    get(sid: string, callback: SessionDataCallback): void;
    set(
      sid: string,
      session: ExpressSessionData,
      callback?: SessionVoidCallback
    ): void;
    destroy(sid: string, callback?: SessionVoidCallback): void;
    all(callback: SessionListCallback): void;
    length(callback: SessionLengthCallback): void;
    clear(callback?: SessionVoidCallback): void;
    touch(
      sid: string,
      session: ExpressSessionData,
      callback?: () => void
    ): void;
  }

  export = PrismaSessionStore;
}
