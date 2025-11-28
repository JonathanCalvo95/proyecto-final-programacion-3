import type { Space } from './space.types'
import type { User } from './user.types'
import type { BookingStatus } from './enums'

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
