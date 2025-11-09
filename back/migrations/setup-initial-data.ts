import { seedAdminIfEmpty } from "./seed-users";
import { seedSpacesIfEmpty } from "./seed-spaces";
import { seedBookingsIfEmpty } from "./seed-bookings";

export async function ensureInitialData() {
  const usersCreated = await seedAdminIfEmpty();
  const spacesCreated = await seedSpacesIfEmpty();
  const bookingsCreated = await seedBookingsIfEmpty();

  return { usersCreated, spacesCreated, bookingsCreated };
}

if (typeof require !== "undefined" && require.main === module) {
  ensureInitialData()
    .then((r) => {
      console.log("Initial data migration result:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("Migration error:", e);
      process.exit(1);
    });
}
