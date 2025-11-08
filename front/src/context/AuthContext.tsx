import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import type { User } from '../types'

type AuthCtx = {
  user?: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>()

  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
  }, [])

  async function login(email: string, password: string) {
    const r = await api.post('/auth/login', { email, password })
    setUser(r.data)
  }
  async function register(name: string, email: string, password: string) {
    await api.post('/auth/register', { name, email, password })
    await login(email, password)
  }
  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }
  return <Context.Provider value={{ user, login, register, logout }}>{children}</Context.Provider>
}

export function useAuth() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
