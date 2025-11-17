import type { SpaceType } from './enums'

export interface Space {
  _id: string
  name: string
  type: SpaceType
  capacity: number
  dailyRate: number
  content?: string
  characteristics?: string[]
  amenities?: string[]
  active?: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}
