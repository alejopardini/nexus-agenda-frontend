import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'

const MENSAJE_GENERICO = 'Si el email existe, te enviamos un link para restablecer tu contraseña.'

export default function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await apiClient.post('/password-reset/', { email })
    } catch {
      // no distinguir el error del caso "email no existe": mismo mensaje siempre
    } finally {
      setEnviando(false)
      setEnviado(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-slate-800">Recuperar contraseña</h1>

        {enviado ? (
          <p className="text-sm text-slate-600">{MENSAJE_GENERICO}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-6"
              required
            />

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 mt-4 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
