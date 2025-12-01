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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDaysAgo(maxDays: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today);
  const offset = randomInt(0, maxDays);
  d.setDate(d.getDate() - offset);
  return d;
}

export async function seedRatingsIfEmpty() {
  const count = await Rating.countDocuments();
  if (count > 0) return 0;

  const users = await User.find({ role: USER_ROLE.CLIENT }).limit(10);
  const spaces = await Space.find({ active: true }).limit(10);
  if (users.length === 0 || spaces.length === 0) return 0;

  const payload: {
    user: Types.ObjectId;
    space: Types.ObjectId;
    score: number;
    comment: string;
    createdAt: Date;
  }[] = [];

  users.forEach((u, i) => {
    spaces.forEach((s, j) => {
      if ((i + j) % 3 === 0) {
        const base = ((i + j) % 5) + 1;
        let score = base;
        if (score < 4 && Math.random() < 0.5) {
          score = score + 1;
        }

        const comment = samples[(i + j) % samples.length];

        payload.push({
          user: u._id as Types.ObjectId,
          space: s._id as Types.ObjectId,
          score,
          comment,
          createdAt: randomDaysAgo(30),
        });
      }
    });
  });

  if (payload.length === 0) return 0;

  await Rating.insertMany(payload);
  return payload.length;
}
