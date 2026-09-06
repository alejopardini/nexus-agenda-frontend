import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/client'

export default function RestablecerPassword() {
  const { uidb64, token } = useParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    try {
      await apiClient.post('/password-reset-confirm/', {
        uidb64,
        token,
        new_password: newPassword,
      })
      setExito(true)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.values(data).flat().join(' ')
        : 'No se pudo restablecer la contraseña.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-slate-800">Elegir nueva contraseña</h1>

        {exito ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Tu contraseña se actualizó correctamente.</p>
            <Link
              to="/login"
              className="block w-full text-center bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700"
            >
              Ir a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            {error && (
              <div className="mb-4">
                <p className="text-red-600 text-sm">{error}</p>
                <Link to="/olvide-password" className="text-sm text-blue-600 hover:underline">
                  Pedir un link nuevo
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-slate-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
                required
              />

              <label className="block text-sm text-slate-600 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 mb-6"
                required
              />

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
