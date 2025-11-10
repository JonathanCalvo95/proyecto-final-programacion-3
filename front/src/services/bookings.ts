import api from './api'
import type { Booking } from '../types/booking.types'

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await api.get('/bookings/my')
  return data
}

export async function createBooking(spaceId: string, start: string, end: string): Promise<Booking> {
  const { data } = await api.post('/bookings', { spaceId, start, end })
  return data
}

export async function cancelBooking(id: string): Promise<Booking> {
  const { data } = await api.patch(`/bookings/${id}/cancel`)
  return data
}

export async function confirmBooking(id: string): Promise<Booking> {
  const { data } = await api.patch(`/bookings/${id}/confirm`)
  return data
}
