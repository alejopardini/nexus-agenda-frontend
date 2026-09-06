import { createContext, useContext, useState } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  })

  const guardarSesion = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('auth', JSON.stringify(data))
    setAuth(data)
  }

  const login = async (username, password) => {
    const response = await apiClient.post('/login/', { username, password })
    guardarSesion(response.data)
    return response.data
  }

  const register = async (payload) => {
    const response = await apiClient.post('/register/', payload)
    guardarSesion(response.data)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    setAuth(null)
  }

  const actualizarAuth = (campos) => {
    setAuth((prev) => {
      const actualizado = { ...prev, ...campos }
      localStorage.setItem('auth', JSON.stringify(actualizado))
      return actualizado
    })
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, actualizarAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}