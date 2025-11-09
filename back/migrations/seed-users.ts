import bcrypt from "bcrypt";
import User from "../src/schemas/user";
import { USER_ROLE } from "../src/enums/role";

export async function seedAdminIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return 0;

  const users = [
    {
      email: "admin@cowork.com",
      password: await bcrypt.hash("Admin123!", 10),
      firstName: "Admin",
      lastName: "Root",
      role: USER_ROLE.ADMIN,
      isActive: true,
    },
    {
      email: "client@cowork.com",
      password: await bcrypt.hash("Client123!", 10),
      firstName: "Client",
      lastName: "Root",
      role: USER_ROLE.CLIENT,
      isActive: true,
    },
  ];

  await User.insertMany(users);
  console.log(`Usuarios iniciales creados: ${users.length}`);
  return users.length;
}
