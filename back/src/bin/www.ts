import { env } from "../config/env";
import app from "../app";
import { connectDB } from "../config/db";
import { ensureInitialData } from "../../migrations/setup-initial-data";
import { seedBookingsIfEmpty } from "../../migrations/seed-bookings";

const port = env.port;

(async () => {
  try {
    await connectDB();
    console.log("Conectado a MongoDB");

    await ensureInitialData();

    // Seed de reservas (requiere usuario 'client' preexistente)
    try {
      const created = await seedBookingsIfEmpty();
      if (created > 0) {
        console.log(`Reservas iniciales creadas: ${created}`);
      }
    } catch (e: any) {
      console.warn("Seed de reservas omitido:", e?.message || e);
    }

    const server = app.listen(port, () => console.log(`API on :${port}`));

    ["SIGINT", "SIGTERM"].forEach((sig) =>
      process.on(sig, () => {
        console.log(`Received ${sig}. Shutting down...`);
        server.close(() => process.exit(0));
      })
    );
  } catch (err) {
    console.error("Error al iniciar el servidor:", err);
    process.exit(1);
  }
})();
