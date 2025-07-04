"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { TokenStorage, UserStorage, clearAuthStorage } from "@/lib/storage"
import type { User } from "@/types/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (provider: string) => Promise<void>
  logout: () => void
  setAuthData: (token: string, user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = TokenStorage.get()
      const userData = UserStorage.get()
      
      if (token && userData) {
        setUser(userData)
      } else {
        clearAuthStorage()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      clearAuthStorage()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (provider: string) => {
    setIsLoading(true)
    try {
      // 카카오 로그인은 실제 API를 통해 처리됩니다
      console.log(`Logging in with ${provider}`)
      window.location.href = "/login"
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    clearAuthStorage()
    window.location.href = "/login"
  }

  const setAuthData = (token: string, userData: User) => {
    TokenStorage.set(token)
    UserStorage.set(userData)
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
