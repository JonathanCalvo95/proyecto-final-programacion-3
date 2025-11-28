import { seedAdminIfEmpty } from "./seed-users";
import { seedSpacesIfEmpty } from "./seed-spaces";
import { seedBookingsIfEmpty } from "./seed-bookings";
import { seedRatingsIfEmpty } from "./seed-ratings";
import { seedPaymentsIfEmpty } from "./seed-payments";

export async function ensureInitialData() {
  const usersCreated = await seedAdminIfEmpty();
  const spacesCreated = await seedSpacesIfEmpty();
  const bookingsCreated = await seedBookingsIfEmpty();
  const ratingsCreated = await seedRatingsIfEmpty();
  const paymentsCreated = await seedPaymentsIfEmpty();

  return {
    usersCreated,
    spacesCreated,
    bookingsCreated,
    ratingsCreated,
    paymentsCreated,
  };
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
