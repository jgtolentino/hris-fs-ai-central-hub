import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'employee' | 'manager' | 'admin'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Implement login logic
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        
        if (response.ok) {
          const { user, token } = await response.json()
          set({ user, token, isAuthenticated: true })
        } else {
          throw new Error('Login failed')
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      setUser: (user, token) => {
        set({ user, token, isAuthenticated: true })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
