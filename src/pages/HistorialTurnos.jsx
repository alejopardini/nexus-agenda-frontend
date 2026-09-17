import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import { formatearFecha } from '../utils/fechas'

const ESTADOS_EDITABLES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'ausente', label: 'Ausente' },
]

function turnoYaOcurrio(turno) {
  return new Date(`${turno.fecha}T${turno.hora}`) < new Date()
}

export default function HistorialTurnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    apiClient
      .get('/turnos/')
      .then((res) =>
        setTurnos(res.data.filter((t) => t.estado !== 'cancelado' && t.fecha <= hoy))
      )
      .catch(() => setError('No se pudo cargar el historial de turnos.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePagado = async (t) => {
    try {
      const res = await apiClient.patch(`/turnos/${t.id}/`, { pagado: !t.pagado })
      setTurnos((prev) => prev.map((x) => (x.id === t.id ? res.data : x)))
    } catch {
      alert('No se pudo actualizar el estado de pago.')
    }
  }

  const cambiarEstado = async (t, nuevoEstado) => {
    try {
      const res = await apiClient.patch(`/turnos/${t.id}/`, { estado: nuevoEstado })
      setTurnos((prev) => prev.map((x) => (x.id === t.id ? res.data : x)))
    } catch {
      alert('No se pudo actualizar el estado del turno.')
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
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Historial de turnos</h1>
            <input
              type="text"
              placeholder="Buscar por nombre del paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-input-border rounded px-3 py-1.5 text-sm placeholder:text-input-placeholder focus:outline-none focus:border-input-focus"
            />
          </div>

          {turnos.length === 0 ? (
            <p className="text-slate-500">No hay turnos pasados registrados.</p>
          ) : turnosFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún turno coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Profesional</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Pagó</th>
                  <th className="py-2">Consulta</th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((t) => {
                  const sinCompletar = Boolean(t.consulta_pendiente_id) && turnoYaOcurrio(t)
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-100 ${sinCompletar ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2">
                        <button
                          onClick={() => setPacienteAbiertoId(t.paciente)}
                          className="text-blue-600 hover:underline"
                        >
                          {t.paciente_nombre}
                        </button>
                      </td>
                      <td className="py-2">{formatearFecha(t.fecha)}</td>
                      <td className="py-2">
                        <Link to={`/profesionales/${t.profesional}/editar`} className="text-blue-600 hover:underline">
                          {t.profesional_nombre}
                        </Link>
                      </td>
                      <td className="py-2">
                        <select
                          value={t.estado}
                          onChange={(e) => cambiarEstado(t, e.target.value)}
                          className="border border-input-border rounded px-2 py-1 text-xs focus:outline-none focus:border-input-focus"
                        >
                          {ESTADOS_EDITABLES.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={t.pagado}
                            onChange={() => togglePagado(t)}
                          />
                          <span>
                            {t.pagado ? 'Sí' : 'No'}
                            {t.pagado && t.monto_cobrado && ` ($${t.monto_cobrado})`}
                            {t.pagado && !t.monto_cobrado && t.monto_sugerido && ` (sugerido: $${t.monto_sugerido})`}
                          </span>
                        </label>
                      </td>
                      <td className="py-2">
                        {t.consulta_id ? (
                          <Link to={`/consultas/${t.consulta_id}`} className="text-blue-600 hover:underline">
                            Ver consulta
                          </Link>
                        ) : (
                          '—'
                        )}
                        {sinCompletar && (
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2 align-middle"
                            title="Turno vencido sin completar la consulta"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {pacienteAbiertoId && (
        <FichaPacienteModal
          pacienteId={pacienteAbiertoId}
          onClose={() => setPacienteAbiertoId(null)}
        />
      )}
    </Layout>
  )
}
