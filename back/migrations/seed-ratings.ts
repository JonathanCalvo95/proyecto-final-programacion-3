import { Types } from "mongoose";
import User from "../src/schemas/user";
import Space from "../src/schemas/space";
import Rating from "../src/schemas/rating";
import { USER_ROLE } from "../src/enums/role";

const samples = [
  "Muy buen espacio",
  "Cómodo y limpio",
  "Silencioso y agradable",
  "Buena iluminación",
  "Recomendado",
];

export async function seedRatingsIfEmpty() {
  const count = await Rating.countDocuments();
  if (count > 0) return 0;

  const users = await User.find({ role: USER_ROLE.CLIENT }).limit(10);
  const spaces = await Space.find({ active: true }).limit(10);
  if (users.length === 0 || spaces.length === 0) return 0;

  const payload: any[] = [];
  users.forEach((u, i) => {
    spaces.forEach((s, j) => {
      if ((i + j) % 3 === 0) {
        const score = ((i + j) % 5) + 1;
        const comment = samples[(i + j) % samples.length];
        payload.push({ user: u._id as Types.ObjectId, space: s._id as Types.ObjectId, score, comment });
      }
    });
  });

  if (payload.length === 0) return 0;
  await Rating.insertMany(payload);
  return payload.length;
}
