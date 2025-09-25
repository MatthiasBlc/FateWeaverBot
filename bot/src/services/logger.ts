import { createLogger, format, transports } from "winston";

const isProd = process.env.NODE_ENV === "production";

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  format: isProd
    ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    : format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : "";
          const base = `${timestamp} [${level}] ${message}`;
          return stack
            ? `${base}\n${stack}${metaString}`
            : `${base}${metaString}`;
        })
      ),
  transports: [new transports.Console()],
});

export { logger };
