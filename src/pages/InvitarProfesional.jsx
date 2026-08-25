import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function InvitarProfesional() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [guardando, setGuardando] = useState(false)

  if (auth.rol !== 'dueño') {
    return (
      <Layout>
        <p className="text-red-600">No tenés permiso para invitar profesionales.</p>
      </Layout>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setOk(false)
    setGuardando(true)
    try {
      await apiClient.post('/invitaciones/', { email, rol: 'profesional' })
      setOk(true)
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la invitación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Invitar profesional</h1>
        <p className="text-sm text-slate-500 mb-4">
          Buscamos por email — el profesional tiene que haberse registrado antes por su cuenta.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {ok && <p className="text-green-600 text-sm mb-4">Invitación enviada.</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email del profesional</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2" required
            />
          </div>
          <button
            type="submit" disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </form>

        <button onClick={() => navigate('/profesionales')} className="text-sm text-slate-500 hover:underline mt-4">
          ← Volver a la lista
        </button>
      </div>
    </Layout>
  )
}