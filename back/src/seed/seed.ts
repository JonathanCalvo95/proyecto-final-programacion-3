import bcrypt from "bcrypt";
import { connectDB } from "../config/db";
import { UserModel } from "../schemas/user";
import { SpaceModel } from "../schemas/space";

async function run() {
  await connectDB();

  let admin = await UserModel.findOne({ email: "admin@cowork.com" });
  if (!admin) {
    const hash = await bcrypt.hash("Admin123!", 10);
    admin = await UserModel.create({
      email: "admin@cowork.com",
      password: hash,
      firstName: "Admin",
      lastName: "Root",
      role: undefined,
    });
    console.log("Admin created: admin@cowork.com / Admin123!");
  }

  const countSpaces = await SpaceModel.countDocuments();
  if (countSpaces === 0) {
    await SpaceModel.create([
      {
        title: "Sala Río",
        type: "meeting_room",
        capacity: 8,
        hourlyRate: 20,
        amenities: ["TV", "Whiteboard"],
        createdBy: admin._id,
      },
      {
        title: "Escritorio 12",
        type: "desk",
        capacity: 1,
        hourlyRate: 5,
        amenities: ["Power", "WiFi"],
        createdBy: admin._id,
      },
      {
        title: "Oficina Privada A",
        type: "private_office",
        capacity: 3,
        hourlyRate: 15,
        amenities: ["A/C", "TV"],
        createdBy: admin._id,
      },
    ]);
    console.log("Seeded spaces");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
