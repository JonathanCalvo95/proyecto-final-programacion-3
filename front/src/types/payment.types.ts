export interface Payment {
  _id: string
  booking: string
  amount: number
  last4: string
  brand: string
  createdAt?: string
  updatedAt?: string
}
