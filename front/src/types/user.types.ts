import type { UserRole } from './enums'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}
