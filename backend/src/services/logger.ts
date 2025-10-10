import { createLogger, format, transports, Logger } from "winston";

const isProd = process.env.NODE_ENV === "production";
const isLocal = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "local";

const logger: Logger = createLogger({
  level: isLocal ? "debug" : "info",
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
        format.printf((info) => {
          const { level, message, timestamp, stack, ...meta } = info as any;
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
