export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const satisfies Record<
  "PENDING" | "PAID" | "FAILED" | "REFUNDED",
  PaymentStatus
>;
