import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


const env = process.env.NODE_ENV || "devs";

let logPath = "./logs";
let retentionDays = "30";

if (env === "staging") {
  logPath = process.env.STG_LOG_PATH || "./logs/staging";
  retentionDays = process.env.STG_LOG_RETENTION_DAYS || "30";
} else if (env === "devs") {
  logPath = process.env.DEV_LOG_PATH || "./logs/devs";
  retentionDays = process.env.DEV_LOG_RETENTION_DAYS || "30";
}

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createLogger = (logType: string) => {
  const dir = path.join(logPath, logType);
  ensureDir(dir);

  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new DailyRotateFile({
        dirname: dir,
        filename: `%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        zippedArchive: false,
        maxFiles: `${retentionDays}d`,
      }),
    ],
  });
};

export const accessLogger = createLogger("access");
export const responseLogger = createLogger("response");
export const errorLogger = createLogger("error");
export const webhookLogger = createLogger("webhook");
