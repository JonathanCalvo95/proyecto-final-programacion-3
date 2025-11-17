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

  const buildDateOnly = (daysAhead: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysAhead);
    return d;
  };

  const baseSlots = [
    { d: 1, len: 1, status: BOOKING_STATUS.CONFIRMED },
    { d: 3, len: 2, status: BOOKING_STATUS.CANCELED },
    { d: 6, len: 3, status: BOOKING_STATUS.PENDING },
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
      baseSlots.forEach(({ d, len, status }) => {
        const daysOffset = d + clientIdx;
        const start = buildDateOnly(daysOffset);
        const end = new Date(start.getTime() + len * 86400000);
        const days = (end.getTime() - start.getTime()) / 86400000;
        payload.push({
          user: client._id as Types.ObjectId,
          space: sp._id as Types.ObjectId,
          start,
          end,
          status,
          amount: Math.round(((sp as any).dailyRate || 0) * days * 100) / 100,
        });
      });
    });
  });

  await Booking.insertMany(payload);
  return payload.length;
}
