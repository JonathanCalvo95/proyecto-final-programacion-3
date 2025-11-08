export const BOOKING_STATUSES = ['pendiente', 'confirmada', 'cancelada'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
