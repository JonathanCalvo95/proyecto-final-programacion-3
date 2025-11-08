export const RESERVATION_STATUSES = ['active', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
