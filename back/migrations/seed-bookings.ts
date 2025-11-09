import { Types } from "mongoose";
import User from "../src/schemas/user";
import { SpaceModel } from "../src/schemas/space";
import Booking from "../src/schemas/booking";
import { USER_ROLE } from "../src/enums/role";
import { BOOKING_STATUS } from "../src/enums/booking";

export async function seedBookingsIfEmpty(): Promise<number> {
  const existing = await Booking.countDocuments();
  if (existing > 0) return 0;

  const clientId = (await User.findOne({ role: USER_ROLE.CLIENT }))?.id;

  const spaces = await SpaceModel.find().limit(3);
  if (spaces.length === 0) return 0;

  const buildDate = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const payload: {
    user: Types.ObjectId;
    space: Types.ObjectId;
    start: Date;
    end: Date;
    status: string;
    amount: number;
  }[] = [];

  for (const sp of spaces) {
    payload.push({
      user: clientId,
      space: sp._id as Types.ObjectId,
      start: buildDate(1, 9),
      end: buildDate(1, 11),
      status: BOOKING_STATUS.CONFIRMED,
      amount: (sp.hourlyRate || 10) * 2,
    });
    payload.push({
      user: clientId,
      space: sp._id as Types.ObjectId,
      start: buildDate(2, 14),
      end: buildDate(2, 16),
      status: BOOKING_STATUS.CANCELED,
      amount: (sp.hourlyRate || 10) * 2,
    });
  }

  await Booking.insertMany(payload);
  console.log(`Reservas iniciales creadas: ${payload.length}`);
  return payload.length;
}
