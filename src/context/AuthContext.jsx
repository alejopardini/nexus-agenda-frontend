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

  const registerProfesional = async (payload) => {
    const response = await apiClient.post('/register-profesional/', payload)
    guardarSesion(response.data)
    return response.data
  }

  const actualizarSesion = (data) => {
    guardarSesion(data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, registerProfesional, actualizarSesion, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}