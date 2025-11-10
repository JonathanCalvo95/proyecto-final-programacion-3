import type { BookingStatus } from './enums'
import type { Space } from './space.types'
import type { User } from './user.types'

export interface Booking {
  _id: string
  user: string | User
  space: string | Space
  start: string
  end: string
  amount: number
  status: BookingStatus
  createdAt?: string
  updatedAt?: string
}
