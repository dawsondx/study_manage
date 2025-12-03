import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { useResourceStore, useProgressStore, usePaymentStore } from '@/stores'

export interface UserInfo {
  id?: number
  email?: string
  phone?: string
  nick_name?: string
  avator?: string
}

interface AuthStore {
  token: string
  user: UserInfo | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: '',
      user: null,
      async login(email, password) {
        console.log('Attempting login for:', email)
        const token = await api.loginPasswd(email, password)
        console.log('Login successful, received token:', token ? '***' : 'empty')
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_email', email)
        set({ token })
        try {
          console.log('Fetching user info...')
          await get().fetchUser()
          console.log('User info fetched successfully')
          const r = useResourceStore.getState()
          const p = useProgressStore.getState()
          const pay = usePaymentStore.getState()
          await Promise.all([
            r.fetchAll(),
            p.fetchAll(),
            pay.fetchAll()
          ])
          console.log('All data fetched successfully')
        } catch (error) {
          console.log('Error fetching user data:', error)
          set({ user: { email } })
        }
      },
      logout() {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_email')
        set({ token: '', user: null })
        try {
          const r = useResourceStore.getState()
          const p = useProgressStore.getState()
          const pay = usePaymentStore.getState()
          r.clearAllData()
          p.clearAllData()
          pay.clearAllData()
        } catch {}
      },
      async fetchUser() {
        try {
          console.log('Fetching user info from API...')
          const data = await api.getUserInfo()
          console.log('User info received:', data)
          set({ user: data || null })
        } catch (error) {
          console.log('Error fetching user info:', error)
          const token = localStorage.getItem('auth_token')
          if (!token) {
            set({ user: null })
          } else {
            const email = localStorage.getItem('auth_email') || undefined
            if (email) {
              set({ user: { email } })
            }
          }
        }
      }
    }),
    { 
      name: 'auth-store'
    }
  )
)
