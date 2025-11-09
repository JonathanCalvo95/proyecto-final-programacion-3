import fs from "node:fs";

export const logError = (err: unknown) => {
  const line = `${new Date().toISOString()} ${String(
    (err as any)?.stack || err
  )}\n`;
  fs.appendFileSync(process.env.LOG_PATH || "./errors.log", line);
  console.error("Error registrado:", err);
};
