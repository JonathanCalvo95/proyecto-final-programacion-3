import { Types } from "mongoose";
import User from "../src/schemas/user";
import Space from "../src/schemas/space";
import Booking from "../src/schemas/booking";
import { USER_ROLE } from "../src/enums/role";
import { BOOKING_STATUS } from "../src/enums/booking";

export async function seedBookingsIfEmpty(): Promise<number> {
  const existing = await Booking.countDocuments();
  if (existing > 0) return 0;

  const clients = await User.find({ role: USER_ROLE.CLIENT }).sort({
    email: 1,
  });
  if (clients.length === 0) return 0;

  const spaces = await Space.find();
  if (spaces.length === 0) return 0;

  const buildDate = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const baseSlots = [
    { d: 1, h1: 9, h2: 11, status: BOOKING_STATUS.CONFIRMED },
    { d: 2, h1: 14, h2: 16, status: BOOKING_STATUS.CANCELED },
    { d: 3, h1: 10, h2: 13, status: BOOKING_STATUS.PENDING },
  ] as const;

  const payload: {
    user: Types.ObjectId;
    space: Types.ObjectId;
    start: Date;
    end: Date;
    status: string;
    amount: number;
  }[] = [];

  clients.forEach((client, clientIdx) => {
    spaces.forEach((sp) => {
      baseSlots.forEach(({ d, h1, h2, status }) => {
        const daysOffset = d + clientIdx;
        const start = buildDate(daysOffset, h1);
        const end = buildDate(daysOffset, h2);
        const hours = (end.getTime() - start.getTime()) / 3600000;
        payload.push({
          user: client._id as Types.ObjectId,
          space: sp._id as Types.ObjectId,
          start,
          end,
          status,
          amount: Math.round((sp.hourlyRate || 0) * hours * 100) / 100,
        });
      });
    });
  });

  await Booking.insertMany(payload);
  return payload.length;
}
