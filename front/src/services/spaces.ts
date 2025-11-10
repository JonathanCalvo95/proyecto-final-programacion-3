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
  hourlyRate: number
  active?: boolean
}) {
  const res = await api.post<Space>('/spaces', payload)
  return res.data
}

export async function updateSpace(
  id: string,
  payload: Partial<{ name: string; type: SpaceType; capacity: number; hourlyRate: number; active: boolean }>
) {
  const res = await api.put<Space>(`/spaces/${id}`, payload)
  return res.data
}

export async function deleteSpace(id: string) {
  const res = await api.delete<{ ok: boolean }>(`/spaces/${id}`)
  return res.data
}
