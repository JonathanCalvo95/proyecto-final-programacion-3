import { SpaceModel } from "../src/schemas/space";
import User from "../src/schemas/user";
import { USER_ROLE } from "../src/enums/role";
import { SPACE_TYPE } from "../src/enums/space";

export async function seedSpacesIfEmpty() {
  const count = await SpaceModel.countDocuments();
  if (count > 0) return 0;

  const adminId = (await User.findOne({ role: USER_ROLE.ADMIN }))?.id;

  const spaces = [
    {
      name: "Sala Río",
      type: SPACE_TYPE.MEETING_ROOM,
      capacity: 8,
      hourlyRate: 20,
      createdBy: adminId,
    },
    {
      name: "Escritorio 12",
      type: SPACE_TYPE.DESK,
      capacity: 1,
      hourlyRate: 5,
      createdBy: adminId,
    },
  ];

  await SpaceModel.insertMany(spaces);
  console.log(`Espacios iniciales creados: ${spaces.length}`);
  return spaces.length;
}
