import type { SpaceType } from './enums'

export interface Space {
  _id: string
  name: string
  type: SpaceType
  capacity: number
  hourlyRate: number
  active?: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}
