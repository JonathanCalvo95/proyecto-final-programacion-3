/* =============================
   USER ROLES
============================= */
export const USER_ROLES = ['admin', 'client'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE = {
  ADMIN: 'admin',
  CLIENT: 'client',
} as const satisfies Record<string, UserRole>

/* =============================
   SPACE TYPES
============================= */
export const SPACE_TYPES = ['meeting_room', 'desk', 'private_office'] as const
export type SpaceType = (typeof SPACE_TYPES)[number]

export const SPACE_TYPE = {
  MEETING_ROOM: 'meeting_room',
  DESK: 'desk',
  PRIVATE_OFFICE: 'private_office',
} as const satisfies Record<string, SpaceType>

/* =============================
   BOOKING STATUS
============================= */
export const BOOKING_STATUSES = ['pending', 'confirmed', 'canceled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
} as const satisfies Record<string, BookingStatus>

/* =============================
   PAYMENT STATUS
============================= */
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
