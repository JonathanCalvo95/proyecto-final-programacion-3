import type { PaymentStatus } from './enums'

export interface Payment {
  _id: string
  reservation: string
  amount: number
  currency: string
  status: PaymentStatus
  createdAt?: string
  updatedAt?: string
}
