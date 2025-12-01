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

  const demoSpace = spaces[0];

  const freeSpace = spaces.length > 1 ? spaces[spaces.length - 1] : null;

  const buildDateOnly = (daysAhead: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysAhead);
    return d;
  };

  const baseSlots = [
    // Pasadas hasta 30 días atrás
    { d: -30, len: 1, isCanceled: false },
    { d: -25, len: 2, isCanceled: true },
    { d: -18, len: 1, isCanceled: false },
    { d: -12, len: 3, isCanceled: false },
    { d: -7, len: 2, isCanceled: true },
    { d: -3, len: 1, isCanceled: false },
    { d: -1, len: 1, isCanceled: false },
    // Hoy
    { d: 0, len: 1, isCanceled: false },
    // Futuras (para ocupar “normalmente” los espacios que NO sean el libre)
    { d: 1, len: 1, isCanceled: false },
    { d: 3, len: 2, isCanceled: true },
    { d: 6, len: 3, isCanceled: false },
    { d: 10, len: 2, isCanceled: false },
  ] as const;

  const payload: {
    user: Types.ObjectId;
    space: Types.ObjectId;
    start: Date;
    end: Date;
    amount: number;
    status: string;
  }[] = [];

  clients.forEach((client, clientIdx) => {
    // Para cada cliente, asegurar:
    // - una reserva pendiente de pago futura
    // - una reserva vencida
    // sobre el espacio demo (no el libre)
    if (demoSpace) {
      // Reserva pendiente de pago (futura, sin pago)
      const startPend = buildDateOnly(2 + clientIdx);
      const endPend = new Date(startPend.getTime() + 86400000);
      payload.push({
        user: client._id as Types.ObjectId,
        space: demoSpace._id as Types.ObjectId,
        start: startPend,
        end: endPend,
        status: BOOKING_STATUS.PENDING_PAYMENT,
        amount: Math.round(((demoSpace as any).dailyRate || 0) * 1 * 100) / 100,
      });

      // Reserva vencida (pasada, sin pago)
      const startVenc = buildDateOnly(-3 - clientIdx);
      const endVenc = new Date(startVenc.getTime() + 86400000);
      payload.push({
        user: client._id as Types.ObjectId,
        space: demoSpace._id as Types.ObjectId,
        start: startVenc,
        end: endVenc,
        status: BOOKING_STATUS.PENDING_PAYMENT,
        amount: Math.round(((demoSpace as any).dailyRate || 0) * 1 * 100) / 100,
      });
    }

    // Slots base para todas las spaces (desde -30 días hasta futuro)
    spaces.forEach((sp) => {
      const isFreeSpace = freeSpace && String(freeSpace._id) === String(sp._id);

      baseSlots.forEach(({ d, len, isCanceled }) => {
        const daysOffset = d + clientIdx;

        if (isFreeSpace && daysOffset >= 0) {
          return;
        }

        const start = buildDateOnly(daysOffset);
        const end = new Date(start.getTime() + len * 86400000);
        const days = (end.getTime() - start.getTime()) / 86400000;

        const status = isCanceled
          ? BOOKING_STATUS.CANCELED
          : BOOKING_STATUS.PENDING_PAYMENT;

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
