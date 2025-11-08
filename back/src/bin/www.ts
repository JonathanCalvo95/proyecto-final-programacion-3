import { env } from "../config/env";
import app from "../app";
import { connectDB } from "../config/db";
import { ensureInitialData } from "../migrations/setup-initial-data";

const port = env.port;

(async () => {
  try {
    await connectDB();
    console.log("✅ Conectado a MongoDB");

    // Ejecutar seed si no hay datos
    await ensureInitialData();

    const server = app.listen(port, () => console.log(`API on :${port}`));

    // Manejo de señales (como ya tenías)
    ["SIGINT", "SIGTERM"].forEach((sig) =>
      process.on(sig, () => {
        console.log(`Received ${sig}. Shutting down...`);
        server.close(() => process.exit(0));
      })
    );
  } catch (err) {
    console.error("❌ Error al iniciar el servidor:", err);
    process.exit(1);
  }
})();
