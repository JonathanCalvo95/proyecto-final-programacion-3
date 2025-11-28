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
   AMENITIES
============================= */
export const AMENITIES = ['WiFi', 'Proyector', 'Pizarrón', 'Café', 'Aire acondicionado', 'Calefacción'] as const
export type Amenity = (typeof AMENITIES)[number]

/* =============================
   BOOKING STATUS
============================= */
export const BOOKING_STATUSES = ['pending', 'confirmed', 'canceled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
} as const satisfies Record<'PENDING' | 'CONFIRMED' | 'CANCELED', BookingStatus>

export const BOOKING_STATE_LABELS = ['Pendiente de pago', 'Pagada', 'Cancelada', 'Vencida'] as const

export type BookingStateLabel = (typeof BOOKING_STATE_LABELS)[number]

export const BOOKING_STATE_CHIP_COLOR: Record<BookingStateLabel, 'default' | 'success' | 'warning' | 'error' | 'info'> =
  {
    'Pendiente de pago': 'warning',
    Pagada: 'success',
    Cancelada: 'error',
    Vencida: 'default',
  }
