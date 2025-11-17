import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types/user.types'
import { login as authLogin, me as authMe, logout as authLogout } from '../services/auth'

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthCtx | undefined>(undefined)

function normalizeUser(raw: any): User | null {
  if (!raw) return null
  const r = raw?.user ?? raw
  const id = r?.id || r?._id
  if (!id) return null
  return {
    id: String(id),
    email: r.email || '',
    firstName: r.firstName ?? r.name ?? '',
    lastName: r.lastName || '',
    role: r.role,
    isActive: r.isActive ?? true,
  } as User
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sesión inicial
  useEffect(() => {
    let mounted = true
    const shouldSkip = () => {
      const path = window.location.pathname
      return /login/i.test(path)
    }
    if (shouldSkip()) {
      setLoading(false)
      return () => {
        mounted = false
      }
    }
    ; (async () => {
      try {
        const profile = await authMe()
        if (!mounted) return
        setUser(normalizeUser(profile))
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
    await authLogin(email, password)
    const profile = await authMe()
    setUser(normalizeUser(profile))
  }

  async function logout() {
    try {
      await authLogout()
    } finally {
      setUser(null)
    }
  }

  return <Context.Provider value={{ user, loading, login, logout }}>{children}</Context.Provider>
}

export function useAuth() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
