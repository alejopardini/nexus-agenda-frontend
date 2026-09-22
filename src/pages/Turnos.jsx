import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, UserX, X } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import BotonIcono from '../components/BotonIcono'
import Boton from '../components/Boton'
import { useSucursalActiva } from '../context/SucursalActivaContext'
import { formatearFecha, formatearHora } from '../utils/fechas'
import { claseBadge } from '../utils/badge'

function turnoYaOcurrio(turno) {
  return new Date(`${turno.fecha}T${turno.hora}`) < new Date()
}

export default function Turnos() {
  const { sucursales, sucursalActivaId } = useSucursalActiva()
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  const hoy = new Date().toISOString().split('T')[0]

  const cargarTurnos = () => {
    apiClient
      .get('/turnos/')
      .then((res) => {
        setTurnos(res.data.filter((t) => t.estado !== 'cancelado' && t.fecha >= hoy))
      })
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

  const marcarAusente = async (id) => {
    if (!confirm('¿Marcar este turno como ausente?')) return
    try {
      await apiClient.patch(`/turnos/${id}/`, { estado: 'ausente' })
      cargarTurnos()
    } catch {
      alert('No se pudo marcar el turno como ausente.')
    }
  }

  const sucursalesPorId = {}
  sucursales.forEach((s) => { sucursalesPorId[s.id] = s.nombre })

  // Filtro de sesión (sucursal activa, ver SucursalActivaContext): con
  // "todas" queda idéntico a como es hoy.
  const turnosBase = sucursalActivaId
    ? turnos.filter((t) => String(t.sucursal) === String(sucursalActivaId))
    : turnos

  const mostrarColumnaSucursal = sucursales.length > 1 && !sucursalActivaId

  const termino = busqueda.trim().toLowerCase()
  const turnosFiltrados = termino
    ? turnosBase.filter((t) => t.paciente_nombre.toLowerCase().includes(termino))
    : turnosBase

  return (
    <Layout titulo="Turnos" filtraPorSucursal>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar por apellido del paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
            <Boton to="/turnos" variante="ghost" tamaño="sm">Ver calendario</Boton>
            <Boton to="/turnos/cancelados" variante="ghost" tamaño="sm">Ver cancelados</Boton>
          </div>

          {turnos.length === 0 ? (
            <p className="text-slate-500">No hay turnos activos.</p>
          ) : turnosFiltrados.length === 0 ? (
            <p className="text-slate-500">
              {termino ? `Ningún turno coincide con "${busqueda}".` : 'No hay turnos activos en esta sucursal.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Hora</th>
                  <th className="py-2 px-4">Paciente</th>
                  <th className="py-2 px-4">Profesional</th>
                  {mostrarColumnaSucursal && <th className="py-2 px-4">Sucursal</th>}
                  <th className="py-2 px-4">Tipo</th>
                  <th className="py-2 px-4">Estado</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-2 px-4">{formatearFecha(t.fecha)}</td>
                    <td className="py-2 px-4">{formatearHora(t.hora)}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => setPacienteAbiertoId(t.paciente)}
                        className="text-texto hover:text-btn-primary transition-colors"
                      >
                        {t.paciente_nombre}
                      </button>
                    </td>
                    <td className="py-2 px-4">{t.profesional_nombre}</td>
                    {mostrarColumnaSucursal && (
                      <td className="py-2 px-4 text-slate-500">{sucursalesPorId[t.sucursal] || '—'}</td>
                    )}
                    <td className="py-2 px-4 text-slate-500">{t.tipo_turno_texto || '—'}</td>
                    <td className="py-2 px-4">
                      <span className={claseBadge(t.estado)}>{t.estado}</span>
                      {t.consulta_pendiente_id && (
                        <Link
                          to={`/consultas/${t.consulta_pendiente_id}`}
                          className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2 align-middle"
                          title="Completar consulta pendiente"
                        />
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-3 items-center">
                        {t.estado === 'pendiente' && (
                          <BotonIcono
                            icono={Check}
                            texto="Confirmar"
                            color="success"
                            onClick={() => confirmarTurno(t.id)}
                          />
                        )}
                        {t.estado === 'confirmado' && turnoYaOcurrio(t) && (
                          <BotonIcono
                            icono={UserX}
                            texto="Marcar ausente"
                            color="warning"
                            onClick={() => marcarAusente(t.id)}
                          />
                        )}
                        <BotonIcono
                          icono={X}
                          texto="Cancelar"
                          color="destructive"
                          onClick={() => cancelarTurno(t.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
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