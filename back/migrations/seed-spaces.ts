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
      dailyRate: 480,
      content:
        "Sala luminosa con mesa grande, ideal para presentaciones y workshops.",
      characteristics: ["Luminosa", "Aislación acústica", 'TV 55"'],
      amenities: ["WiFi", "Proyector", "Pizarrón", "Café"],
      createdBy: adminId,
    },
    {
      name: "Sala 2",
      type: SPACE_TYPE.MEETING_ROOM,
      capacity: 6,
      dailyRate: 360,
      content: "Espacio cómodo para reuniones chicas o dailies.",
      characteristics: ["Ventilación natural", "Iluminación cálida"],
      amenities: ["WiFi", "Pizarrón"],
      createdBy: adminId,
    },
    {
      name: "Escritorio 1",
      type: SPACE_TYPE.DESK,
      capacity: 4,
      dailyRate: 120,
      content: "Isla de escritorios en zona silenciosa del cowork.",
      characteristics: ["Ergonómico", "Luz natural"],
      amenities: ["WiFi", "Café"],
      createdBy: adminId,
    },
    {
      name: "Escritorio 2",
      type: SPACE_TYPE.DESK,
      capacity: 4,
      dailyRate: 120,
      content: "Sector con muy buena iluminación y enchufes accesibles.",
      characteristics: ["Sillas ergonómicas", "Iluminación LED"],
      amenities: ["WiFi"],
      createdBy: adminId,
    },
    {
      name: "Oficina 1",
      type: SPACE_TYPE.PRIVATE_OFFICE,
      capacity: 6,
      dailyRate: 240,
      content: "Oficina privada ideal para equipos medianos, con guardado.",
      characteristics: ["Privacidad", "Armario", "Ventana"],
      amenities: ["WiFi", "Aire acondicionado"],
      createdBy: adminId,
    },
    {
      name: "Oficina 2",
      type: SPACE_TYPE.PRIVATE_OFFICE,
      capacity: 5,
      dailyRate: 192,
      content: "Oficina compacta con buena acústica.",
      characteristics: ["Acústica", "Iluminación regulable"],
      amenities: ["WiFi", "Calefacción"],
      createdBy: adminId,
    },
  ];

  await Space.insertMany(spaces);
  console.log(`Espacios iniciales creados: ${spaces.length}`);
  return spaces.length;
}
