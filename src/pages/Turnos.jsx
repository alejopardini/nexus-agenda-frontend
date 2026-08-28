import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'

const COLOR_ESTADO = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-green-100 text-green-800',
}

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  const cargarTurnos = () => {
    apiClient
      .get('/turnos/')
      .then((res) => setTurnos(res.data.filter((t) => t.estado !== 'cancelado')))
      .catch(() => setError('No se pudieron cargar los turnos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarTurnos()
  }, [])

  const confirmarTurno = async (id) => {
    try {
      await apiClient.post(`/turnos/${id}/confirmar/`)
      cargarTurnos()
    } catch {
      alert('No se pudo confirmar el turno.')
    }
  }

  const cancelarTurno = async (id) => {
    if (!confirm('¿Cancelar este turno?')) return
    try {
      await apiClient.post(`/turnos/${id}/cancelar/`)
      cargarTurnos()
    } catch {
      alert('No se pudo cancelar el turno.')
    }
  }

  const termino = busqueda.trim().toLowerCase()
  const turnosFiltrados = termino
    ? turnos.filter((t) => t.paciente_nombre.toLowerCase().includes(termino))
    : turnos

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Turnos</h1>
            <input
              type="text"
              placeholder="Buscar por apellido del paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
            <Link to="/turnos" className="text-sm text-blue-600 hover:underline whitespace-nowrap">
              Ver calendario
            </Link>
            <Link to="/turnos/cancelados" className="text-sm text-slate-500 hover:underline whitespace-nowrap">
              Ver cancelados
            </Link>
          </div>

          {turnos.length === 0 ? (
            <p className="text-slate-500">No hay turnos activos.</p>
          ) : turnosFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún turno coincide con "{busqueda}".</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Hora</th>
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Profesional</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((t) => {
                  const vencidoSinCompletar = t.fecha < hoy && t.consulta_pendiente_id
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-100 ${vencidoSinCompletar ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2">{t.fecha}</td>
                      <td className="py-2">{t.hora}</td>
                      <td className="py-2">{t.paciente_nombre}</td>
                      <td className="py-2">{t.profesional_nombre}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${COLOR_ESTADO[t.estado] || ''}`}>
                          {t.estado}
                        </span>
                        {t.consulta_pendiente_id && (
                          <Link
                            to={`/consultas/${t.consulta_pendiente_id}`}
                            className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2 align-middle"
                            title={vencidoSinCompletar ? 'Turno vencido sin completar la consulta' : 'Completar consulta pendiente'}
                          />
                        )}
                      </td>
                      <td className="py-2 space-x-2">
                        {t.estado === 'pendiente' && (
                          <button
                            onClick={() => confirmarTurno(t.id)}
                            className="text-green-600 text-xs hover:underline"
                          >
                            Confirmar
                          </button>
                        )}
                        <button
                          onClick={() => cancelarTurno(t.id)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  )
}