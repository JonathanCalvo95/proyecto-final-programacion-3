import bcrypt from "bcrypt";
import { connectDB } from "../config/db";
import User from "../schemas/user"; // default export en schema
import Role from "../schemas/role"; // default export en schema
import { SpaceModel } from "../schemas/space"; // named export en schema
import { USER_ROLES } from "../enums/role";
import { SPACE_TYPES } from "../enums/space";

interface MigrationResult {
  rolesCreated: number;
  adminCreated: boolean;
  spacesCreated: number;
}

/** Crea datos iniciales solo si están ausentes. Llamar en bootstrap. */
export async function ensureInitialData(): Promise<MigrationResult> {
  await connectDB();

  // ----- Roles -----
  let rolesCreated = 0;
  const existingRoles = await Role.find({}, { name: 1, _id: 0 }).lean();
  const existing = new Set((existingRoles ?? []).map((r) => r.name));
  const missing = USER_ROLES.filter((r) => !existing.has(r));
  if (missing.length > 0) {
    await Role.insertMany(missing.map((name) => ({ name })));
    rolesCreated = missing.length;
  }

  // Garantizar rol admin (por si faltaba)
  const adminRole = await Role.findOneAndUpdate(
    { name: "admin" },
    { $setOnInsert: { name: "admin" } },
    { upsert: true, new: true }
  );

  // ----- Admin -----
  const adminEmail = process.env.ADMIN_EMAIL || "admin@cowork.com";
  const adminPass = process.env.ADMIN_PASSWORD || "Admin123!";
  let adminCreated = false;

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash(adminPass, 10);
    admin = await User.create({
      email: adminEmail,
      password: hash,
      firstName: "Admin",
      lastName: "Root",
      role: adminRole?._id, // si tu schema de User espera ObjectId de Role
      isActive: true,
    });
    adminCreated = true;
    // eslint-disable-next-line no-console
    console.log(`✅ Admin creado: ${adminEmail} / ${adminPass}`);
  }

  // ----- Spaces -----
  let spacesCreated = 0;
  const spacesCount = await SpaceModel.countDocuments();
  if (spacesCount === 0) {
    type SpaceSeed = {
      title: string;
      description: string;
      type: string;
      capacity: number;
      hourlyRate: number;
      amenities: string[];
      createdBy: any;
    };
    const samples: SpaceSeed[] = [
      {
        title: "Sala Río",
        description: "Sala de reunión con TV y pizarrón",
        type: "meeting_room",
        capacity: 8,
        hourlyRate: 20,
        amenities: ["TV", "Whiteboard", "WiFi"],
        createdBy: admin._id,
      },
      {
        title: "Escritorio 12",
        description: "Estación individual con energía y wifi",
        type: "desk",
        capacity: 1,
        hourlyRate: 5,
        amenities: ["Power", "WiFi"],
        createdBy: admin._id,
      },
      {
        title: "Oficina Privada A",
        description: "Oficina cerrada para equipos pequeños",
        type: "private_office",
        capacity: 3,
        hourlyRate: 15,
        amenities: ["A/C", "TV", "WiFi"],
        createdBy: admin._id,
      },
    ].filter((s) => SPACE_TYPES.includes(s.type as any));

    if (samples.length > 0) {
      await SpaceModel.insertMany(samples);
      spacesCreated = samples.length;
      // eslint-disable-next-line no-console
      console.log(`✅ Espacios iniciales creados: ${spacesCreated}`);
    }
  }

  return { rolesCreated, adminCreated, spacesCreated };
}

// Ejecución directa opcional: npx ts-node back/migrations/setup-initial-data.ts
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
