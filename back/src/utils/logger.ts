import fs from "node:fs";
import path from "node:path";

const baseDir = path.resolve(__dirname, "../../logs");
const defaultFile = path.join(baseDir, "error.log");

function ensureDir() {
  try {
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  } catch (e) {
    console.error("No se pudo crear el directorio de logs", e);
  }
}

export const logError = (err: unknown) => {
  ensureDir();
  const target = process.env.LOG_PATH ? path.resolve(process.env.LOG_PATH) : defaultFile;
  const line = `${new Date().toISOString()} ${String((err as any)?.stack || err)}\n`;
  try {
    fs.appendFileSync(target, line);
  } catch (e) {
    console.error("Fallo al escribir el log", e);
  }
  console.error("Error registrado:", err);
};
