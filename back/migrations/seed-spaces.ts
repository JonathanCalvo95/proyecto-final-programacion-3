import Space from "../src/schemas/space";
import User from "../src/schemas/user";
import { USER_ROLE } from "../src/enums/role";
import { SPACE_TYPE } from "../src/enums/space";

export async function seedSpacesIfEmpty() {
  const count = await Space.countDocuments();
  if (count > 0) return 0;

  const adminId = (await User.findOne({ role: USER_ROLE.ADMIN }))?.id;

  const spaces = [
    {
      name: "Sala 1",
      type: SPACE_TYPE.MEETING_ROOM,
      capacity: 8,
      hourlyRate: 20,
      createdBy: adminId,
    },
    {
      name: "Sala 2",
      type: SPACE_TYPE.MEETING_ROOM,
      capacity: 6,
      hourlyRate: 15,
      createdBy: adminId,
    },
    {
      name: "Escritorio 1",
      type: SPACE_TYPE.DESK,
      capacity: 4,
      hourlyRate: 5,
      createdBy: adminId,
    },
    {
      name: "Escritorio 2",
      type: SPACE_TYPE.DESK,
      capacity: 4,
      hourlyRate: 5,
      createdBy: adminId,
    },
    {
      name: "Oficina 1",
      type: SPACE_TYPE.PRIVATE_OFFICE,
      capacity: 6,
      hourlyRate: 10,
      createdBy: adminId,
    },
    {
      name: "Oficina 2",
      type: SPACE_TYPE.PRIVATE_OFFICE,
      capacity: 5,
      hourlyRate: 8,
      createdBy: adminId,
    },
  ];

  await Space.insertMany(spaces);
  console.log(`Espacios iniciales creados: ${spaces.length}`);
  return spaces.length;
}
