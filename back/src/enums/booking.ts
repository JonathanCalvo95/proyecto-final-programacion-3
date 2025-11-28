export const BOOKING_STATUSES = [
  "pending_payment",
  "paid",
  "canceled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  CANCELED: "canceled",
} as const satisfies Record<
  "PENDING_PAYMENT" | "PAID" | "CANCELED",
  BookingStatus
>;
