import api from './api'
import type { User } from '../types/user.types'

export async function login(email: string, password: string): Promise<void> {
  await api.post('/auth/login', { email, password })
}

export async function me(): Promise<User> {
  return await api.get('/auth/me')
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
