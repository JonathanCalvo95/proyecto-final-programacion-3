import api from './api'
import type { Rating, RatingSummary } from '../types/rating.types'

export async function saveRating(payload: { spaceId: string; score: number; comment?: string }): Promise<Rating> {
  return api.post('/ratings', payload)
}

export async function getRatingsSummary(): Promise<RatingSummary[]> {
  return await api.get('/ratings/summary')
}

export async function getRatings(): Promise<Rating[]> {
  return api.get('/ratings')
}
