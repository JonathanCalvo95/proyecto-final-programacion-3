import api from './api'
import type { User } from '../types/user.types'

export async function getUsers(): Promise<User[]> {
  return api.get('/user')
}

export async function getUser(id: string): Promise<User> {
  return api.get(`/user/${id}`)
}

export async function createUser(payload: {
  firstName: string
  email: string
  password: string
  role: string
}): Promise<User> {
  return api.post('/user', payload)
}

export async function updateUser(
  id: string,
  payload: Partial<{ firstName: string; lastName: string; password: string; role: string; isActive: boolean }>
): Promise<User> {
  return api.put(`/user/${id}`, payload)
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/user/${id}`)
}
