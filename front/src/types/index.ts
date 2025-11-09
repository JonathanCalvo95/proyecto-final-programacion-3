export const USER_ROLES = ['admin', 'client'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const SPACE_TYPES = ['meeting_room', 'desk', 'private_office'] as const
export type SpaceType = (typeof SPACE_TYPES)[number]

export const BOOKING_STATUSES = ['pendiente', 'confirmada', 'cancelada'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Space {
  _id: string
  title: string
  description?: string
  type: SpaceType
  capacity: number
  hourlyRate: number
  amenities: string[]
}

export interface Booking {
  _id: string
  space: Space | string
  start: string
  end: string
  status: BookingStatus
}
