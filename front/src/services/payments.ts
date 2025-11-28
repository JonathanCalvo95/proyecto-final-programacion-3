import api from './api'
import type { Payment } from '../types/payment.types'

export async function createPayment(payload: {
  bookingId: string
  cardNumber: string
  cardHolder: string
  expiry: string
  cvv: string
}): Promise<Payment> {
  return api.post('/payments', payload)
}

export async function getMyPayments(): Promise<Payment[]> {
  return api.get('/payments/my')
}

export async function getAllPayments(): Promise<Payment[]> {
  return api.get('/payments')
}
