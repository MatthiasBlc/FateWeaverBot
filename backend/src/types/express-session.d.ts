import { Session, SessionData } from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "express" {
  interface Request {
    session: Session &
      Partial<SessionData> & {
        userId?: string;
      };
  }
}
