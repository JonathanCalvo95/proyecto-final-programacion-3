import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import type { User } from '../types'

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  function pickUser(payload: any): User {
    return (payload?.user ?? payload) as User
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await api.get('/auth/me') // cookie httpOnly
        if (!mounted) return
        setUser(pickUser(me))
      } catch {
        if (!mounted) return
        setUser(null)
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function login(email: string, password: string) {
    // el server setea cookies y devuelve { user } o user
    const res = await api.post('/auth/login', { email, password })
    setUser(pickUser(res))
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post('/auth/register', { name, email, password })
    setUser(pickUser(res))
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  return <Context.Provider value={{ user, loading, login, register, logout }}>{children}</Context.Provider>
}

export function useAuth() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
