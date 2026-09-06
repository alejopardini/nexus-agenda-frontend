import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-6 text-slate-800">Iniciar sesión</h1>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <label className="block text-sm text-slate-600 mb-1">Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
          required
        />

        <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-6"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700"
        >
          Entrar
        </button>

        <p className="text-sm text-slate-500 mt-4 text-center">
          <Link to="/olvide-password" className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
        </p>

        <p className="text-sm text-slate-500 mt-2 text-center">
          ¿Sos dueño/a de una clínica? <Link to="/registro" className="text-blue-600 hover:underline">Creá tu cuenta</Link>
        </p>
      </form>
    </div>
  )
}