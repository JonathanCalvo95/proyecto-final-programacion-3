import { Types } from "mongoose";
import Booking from "../src/schemas/booking";
import Payment from "../src/schemas/payment";
import { BOOKING_STATUS } from "../src/enums/booking";

const BRANDS = ["Visa", "Mastercard", "Amex"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSome(candidates: any[], ratio: number): any[] {
  if (!candidates.length) return [];
  const chosen: any[] = [];
  candidates.forEach((b) => {
    if (Math.random() < ratio) chosen.push(b);
  });
  if (chosen.length === 0) {
    chosen.push(candidates[0]);
  }
  return chosen;
}

export async function seedPaymentsIfEmpty(): Promise<number> {
  const existing = await Payment.countDocuments();
  if (existing > 0) return 0;

  // Traemos todas las reservas no canceladas
  const bookings = await Booking.find({
    status: { $ne: BOOKING_STATUS.CANCELED },
  }).select("_id user amount start end status");

  if (bookings.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Solo las pendientes de pago
  const pending = bookings.filter(
    (b: any) => b.status === BOOKING_STATUS.PENDING_PAYMENT
  );

  if (pending.length === 0) return 0;

  // Separar vencidas / futuras
  const expired: any[] = [];
  const future: any[] = [];

  pending.forEach((b: any) => {
    const end = new Date(b.end);
    if (end <= today) {
      expired.push(b);
    } else {
      future.push(b);
    }
  });

  const expiredToPay = pickSome(expired, 0.6);

  const futureToPay = pickSome(future, 0.4);

  const bookingsToPay = [...expiredToPay, ...futureToPay];

  if (bookingsToPay.length === 0) return 0;

  const payload: {
    user: Types.ObjectId;
    booking: Types.ObjectId;
    amount: number;
    last4: string;
    brand: string;
  }[] = [];

  bookingsToPay.forEach((b: any) => {
    const last4 = String(1000 + Math.floor(Math.random() * 9000));
    const brand = pick(BRANDS);

    payload.push({
      user: b.user as Types.ObjectId,
      booking: b._id as Types.ObjectId,
      amount: b.amount ?? 0,
      last4,
      brand,
    });
  });

  await Payment.insertMany(payload);

  // Marcar esas reservas como pagadas
  const ids = bookingsToPay.map((b: any) => b._id);
  await Booking.updateMany(
    { _id: { $in: ids } },
    { $set: { status: BOOKING_STATUS.PAID } }
  );

  return payload.length;
}

if (typeof require !== "undefined" && require.main === module) {
  seedPaymentsIfEmpty()
    .then((r) => {
      console.log("Seed payments migration result:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("Seed payments migration error:", e);
      process.exit(1);
    });
}
