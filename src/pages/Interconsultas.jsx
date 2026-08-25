import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

const COLOR_ESTADO = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
  revocada: 'bg-slate-200 text-slate-600',
}

export default function Interconsultas() {
  const { auth } = useAuth()
  const [interconsultas, setInterconsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)

  const cargar = () => {
    apiClient
      .get('/interconsultas/')
      .then((res) => setInterconsultas(res.data))
      .catch(() => setError('No se pudieron cargar las interconsultas.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const resolver = async (id, accion) => {
    setProcesando(id)
    try {
      await apiClient.post(`/interconsultas/${id}/${accion}/`)
      cargar()
    } catch {
      alert('No se pudo procesar.')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Interconsultas</h1>
          {interconsultas.length === 0 ? (
            <p className="text-slate-500">No hay interconsultas todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {interconsultas.map((ic) => {
                const esMiaLaSolicitud = String(ic.solicitante) === String(auth.profesional_id)
                return (
                  <li key={ic.id} className="py-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800">
                          {ic.solicitante_nombre} → {ic.paciente_nombre}
                        </p>
                        {ic.motivo && <p className="text-slate-600 mt-0.5">{ic.motivo}</p>}
                        {ic.invitado_por_nombre && (
                          <p className="text-xs text-slate-400 mt-0.5">Invitado por {ic.invitado_por_nombre}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${COLOR_ESTADO[ic.estado] || ''}`}>
                        {ic.estado}
                      </span>
                    </div>

                    {ic.estado === 'pendiente' && esMiaLaSolicitud && (
                      <div className="mt-2">
                        <button
                          onClick={() => resolver(ic.id, 'rechazar')}
                          disabled={procesando === ic.id}
                          className="text-slate-500 text-xs hover:underline disabled:opacity-50"
                        >
                          Cancelar mi solicitud
                        </button>
                      </div>
                    )}

                    {ic.estado === 'pendiente' && !esMiaLaSolicitud && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => resolver(ic.id, 'aprobar')}
                          disabled={procesando === ic.id}
                          className="bg-green-600 text-white text-xs rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => resolver(ic.id, 'rechazar')}
                          disabled={procesando === ic.id}
                          className="bg-slate-200 text-slate-700 text-xs rounded px-3 py-1.5 hover:bg-slate-300 disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {ic.estado === 'aprobada' && (
                      <div className="flex gap-2 mt-2">
                        <Link to={`/pacientes/${ic.paciente}`} className="text-blue-600 text-xs hover:underline">
                          Ver ficha del paciente
                        </Link>
                        <button
                          onClick={() => resolver(ic.id, 'revocar')}
                          disabled={procesando === ic.id}
                          className="text-red-600 text-xs hover:underline disabled:opacity-50"
                        >
                          Revocar acceso
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Layout>
  )
}