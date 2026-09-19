import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import BotonIcono from '../components/BotonIcono'
import { claseBadge, BASE_PILL } from '../utils/badge'
import { formatearFecha } from '../utils/fechas'

const ESTADOS_EDITABLES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'ausente', label: 'Ausente' },
]

// Pago no es un estado de turno (--color-turno-*): reusa el verde de
// "confirmado" para "pagado" (mismo significado semántico, éxito) y un gris
// neutro genérico (texto-secundario/superficie-hover) para "pendiente de
// pago" — ninguno de los dos es un tono inventado, son tokens ya existentes.
const CLASE_PAGO = {
  si: 'bg-turno-confirmado text-turno-confirmado-text',
  no: 'bg-superficie-hover text-texto-secundario',
}

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

  const cambiarPago = async (t, valor) => {
    try {
      const res = await apiClient.patch(`/turnos/${t.id}/`, { pagado: valor === 'si' })
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
    <Layout titulo="Historial de turnos">
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-end items-center mb-4 gap-4">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Buscar por nombre del paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-64 h-10 pl-9 pr-3 rounded-lg border border-input-border text-[14px] outline-none focus:border-2 focus:border-input-focus"
              />
            </div>
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
                  <th className="py-2 px-4">Paciente</th>
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Profesional</th>
                  <th className="py-2 px-4">Estado</th>
                  <th className="py-2 px-4">Pagó</th>
                  <th className="py-2 px-4">Consulta</th>
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
                      <td className="py-2 px-4">
                        <button
                          onClick={() => setPacienteAbiertoId(t.paciente)}
                          className="text-texto hover:text-btn-primary transition-colors"
                        >
                          {t.paciente_nombre}
                        </button>
                      </td>
                      <td className="py-2 px-4">{formatearFecha(t.fecha)}</td>
                      <td className="py-2 px-4">
                        <Link
                          to={`/profesionales/${t.profesional}/editar`}
                          className="text-texto hover:text-btn-primary transition-colors"
                        >
                          {t.profesional_nombre}
                        </Link>
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={t.estado}
                          onChange={(e) => cambiarEstado(t, e.target.value)}
                          className={`${claseBadge(t.estado)} text-center border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-input-focus`}
                        >
                          {ESTADOS_EDITABLES.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={t.pagado ? 'si' : 'no'}
                            onChange={(e) => cambiarPago(t, e.target.value)}
                            className={`${BASE_PILL} ${CLASE_PAGO[t.pagado ? 'si' : 'no']} text-center border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-input-focus`}
                          >
                            <option value="si">Pagado</option>
                            <option value="no">Pendiente de pago</option>
                          </select>
                          {t.pagado && t.monto_cobrado && (
                            <span className="text-xs text-texto-secundario">${t.monto_cobrado}</span>
                          )}
                          {t.pagado && !t.monto_cobrado && t.monto_sugerido && (
                            <span className="text-xs text-texto-secundario">sugerido: ${t.monto_sugerido}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {t.consulta_id ? (
                            <BotonIcono icono={Eye} texto="Ver consulta" to={`/consultas/${t.consulta_id}`} />
                          ) : (
                            <span className="text-texto-secundario">—</span>
                          )}
                          {sinCompletar && (
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-red-500 align-middle"
                              title="Turno vencido sin completar la consulta"
                            />
                          )}
                        </div>
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
