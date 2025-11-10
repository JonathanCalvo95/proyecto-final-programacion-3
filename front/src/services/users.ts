import api from './api'
import type { User } from '../types/user.types'

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get('/users').catch(async () => await api.get('/api/users'))
  return data
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/users/${id}`).catch(async () => await api.get(`/api/users/${id}`))
  return data
}
