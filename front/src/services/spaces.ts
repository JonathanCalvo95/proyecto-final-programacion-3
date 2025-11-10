import api from './api'
import type { Space } from '../types/space.types'

function normalize(raw: any): Space {
  return {
    _id: raw._id,
    name: raw.name,
    type: raw.type,
    capacity: raw.capacity,
    hourlyRate: raw.hourlyRate,
  }
}

export async function getSpaces(): Promise<Space[]> {
  return await api.get('/spaces')
}

export async function createSpace(input: {
  name: string
  type: string
  capacity: number
  hourlyRate: number
}): Promise<Space> {
  const payload = { ...input, name: input.name }
  const { data } = await api.post('/spaces', payload).catch(async () => await api.post('/api/spaces', payload))
  return normalize(data)
}

export async function updateSpace(
  id: string,
  input: Partial<{
    name: string
    type: string
    capacity: number
    hourlyRate: number
  }>
): Promise<Space> {
  const payload: any = { ...input }
  if (payload.name) payload.name = payload.name
  const { data } = await api
    .put(`/spaces/${id}`, payload)
    .catch(async () => await api.put(`/api/spaces/${id}`, payload))
  return normalize(data)
}

export async function deleteSpace(id: string): Promise<void> {
  await api.delete(`/spaces/${id}`).catch(async () => await api.delete(`/api/spaces/${id}`))
}
