import type { Space } from './space.types'
import type { User } from './user.types'

export interface Rating {
  _id: string
  user: string | User
  space: string | Space
  score: number
  comment?: string
  createdAt?: string
  updatedAt?: string
}

export interface RatingSummary {
  spaceId: string
  avg: number
  count: number
}
