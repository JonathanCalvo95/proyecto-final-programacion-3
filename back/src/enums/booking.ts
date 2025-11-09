export const BOOKING_STATUSES = ["pending", "confirmed", "canceled"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELED: "canceled",
} as const;
