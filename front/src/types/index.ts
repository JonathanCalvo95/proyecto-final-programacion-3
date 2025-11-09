export const USER_ROLES = ['admin', 'client'] as const
export type UserRole = (typeof USER_ROLES)[number]
export const USER_ROLE = { ADMIN: 'admin', CLIENT: 'client' } as const

export const SPACE_TYPES = ['meeting_room', 'desk', 'private_office'] as const
export type SpaceType = (typeof SPACE_TYPES)[number]
export const SPACE_TYPE = {
  MEETING_ROOM: 'meeting_room',
  DESK: 'desk',
  PRIVATE_OFFICE: 'private_office',
} as const

export const BOOKING_STATUSES = ['pending', 'confirmed', 'canceled'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
} as const

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
