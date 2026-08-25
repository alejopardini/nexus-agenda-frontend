import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Invitaciones() {
  const [invitaciones, setInvitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)
  const { auth, actualizarSesion, logout } = useAuth()
  const navigate = useNavigate()

  const cargar = () => {
    apiClient
      .get('/mis-invitaciones/')
      .then((res) => setInvitaciones(res.data))
      .catch(() => setError('No se pudieron cargar las invitaciones.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const responder = async (id, accion) => {
    setProcesando(id)
    try {
      const res = await apiClient.post(`/invitaciones/${id}/${accion}/`)
      if (accion === 'aceptar') {
        actualizarSesion(res.data)
        navigate('/')
      } else {
        cargar()
      }
    } catch {
      alert('No se pudo procesar la invitación.')
    } finally {
      setProcesando(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-xl font-bold text-slate-800">Mis invitaciones</h1>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Salir</button>
          </div>
          <p className="text-sm text-slate-500">
            {auth?.username} — todavía no pertenecés a ninguna organización. Cuando una clínica te invite, va a aparecer acá.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {loading && <p className="text-slate-500">Cargando...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && invitaciones.length === 0 && (
            <p className="text-slate-500 text-sm">No tenés invitaciones pendientes por ahora.</p>
          )}
          {!loading && !error && invitaciones.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {invitaciones.map((inv) => (
                <li key={inv.id} className="py-3">
                  <p className="text-sm font-medium text-slate-800">{inv.organizacion_nombre}</p>
                  <p className="text-xs text-slate-500 mb-2">Rol: {inv.rol}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => responder(inv.id, 'aceptar')}
                      disabled={procesando === inv.id}
                      className="bg-green-600 text-white text-xs rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => responder(inv.id, 'rechazar')}
                      disabled={procesando === inv.id}
                      className="bg-slate-200 text-slate-700 text-xs rounded px-3 py-1.5 hover:bg-slate-300 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}