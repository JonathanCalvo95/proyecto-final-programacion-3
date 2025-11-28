import { Types } from "mongoose";
import Booking from "../src/schemas/booking";
import Payment from "../src/schemas/payment";
import { BOOKING_STATUS } from "../src/enums/booking";

const BRANDS = ["Visa", "Mastercard", "Amex"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedPaymentsIfEmpty(): Promise<number> {
  const existing = await Payment.countDocuments();
  if (existing > 0) return 0;

  const bookings = await Booking.find({
    status: { $ne: BOOKING_STATUS.CANCELED },
  }).select("_id user amount start end status");

  if (bookings.length === 0) return 0;

  // Nunca asignar pago a la reserva vencida ni a la pendiente de pago
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingsWithPayment = bookings.filter((b: any) => {
    // Trabajamos solo sobre reservas pending_payment
    if (b.status !== BOOKING_STATUS.PENDING_PAYMENT) return false;

    const start = new Date(b.start);
    const end = new Date(b.end);
    const isVencida = end <= today; // reserva ya terminó
    const isPendiente = start > today; // reserva futura

    // solo queremos reservas "en ventana" (ni vencidas ni futuras)
    return !isVencida && !isPendiente;
  });

  if (bookingsWithPayment.length === 0) return 0;

  const payload: {
    user: Types.ObjectId;
    booking: Types.ObjectId;
    amount: number;
    last4: string;
    brand: string;
  }[] = [];

  bookingsWithPayment.forEach((b: any) => {
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
  const ids = bookingsWithPayment.map((b: any) => b._id);
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
