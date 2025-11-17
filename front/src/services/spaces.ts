import type { SpaceType } from '../types/enums'
import type { Space } from '../types/space.types'
import api from './api'

export async function getSpaces(): Promise<Space[]> {
  return api.get('/spaces')
}

export async function createSpace(payload: {
  name: string
  type: SpaceType
  capacity: number
  dailyRate: number
  content?: string
  characteristics?: string[]
  amenities?: string[]
  active?: boolean
}) {
  return api.post<Space>('/spaces', payload)
}

export async function updateSpace(
  id: string,
  payload: Partial<{
    name: string
    type: SpaceType
    capacity: number
    dailyRate: number
    content: string
    characteristics: string[]
    amenities: string[]
    active: boolean
  }>
) {
  return api.put<Space>(`/spaces/${id}`, payload)
}

export async function getSpacesAvailability(start: string, end: string): Promise<string[]> {
  const data = (await api.get('/spaces/availability', {
    params: { start: start.toString(), end: end.toString() },
  })) as { available: string[] }

  return data.available ?? []
}

export async function deleteSpace(id: string) {
  await api.delete<{ ok: boolean }>(`/spaces/${id}`)
}
