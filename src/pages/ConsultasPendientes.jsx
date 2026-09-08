import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import PanelCamillaCondensado from '../components/PanelCamillaCondensado'
import { buscarConsultaCompletadaPrevia } from '../utils/consultas'

function diasVencido(fecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaTurno = new Date(`${fecha}T00:00:00`)
  const dias = Math.round((hoy.getTime() - fechaTurno.getTime()) / (1000 * 60 * 60 * 24))
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}

export default function ConsultasPendientes() {
  const [turnos, setTurnos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)
  const [panelCondensado, setPanelCondensado] = useState(null)

  const cargarDatos = () => {
    Promise.all([
      apiClient.get('/turnos/?vencidos_sin_completar=1'),
      apiClient.get('/consultas/'),
    ])
      .then(([turnosRes, consultasRes]) => {
        setTurnos(turnosRes.data)
        setConsultas(consultasRes.data)
      })
      .catch(() => setError('No se pudo cargar el listado de consultas pendientes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800">Consultas pendientes de completar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Turnos ya pasados cuya consulta nunca se completó. Ordenados por antigüedad: los más urgentes primero.
          </p>
        </div>

        {loading && <p className="text-slate-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          turnos.length === 0 ? (
            <p className="text-slate-500">No hay consultas pendientes vencidas. Todo al día.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Paciente</th>
                    <th className="py-2">Profesional</th>
                    <th className="py-2">Turno vencido</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t) => {
                    const tieneHistorial = Boolean(buscarConsultaCompletadaPrevia(consultas, t.paciente))
                    return (
                      <tr key={t.id} className="border-b border-slate-100 bg-red-50">
                        <td className="py-2">
                          <button
                            onClick={() => setPacienteAbiertoId(t.paciente)}
                            className="text-blue-600 hover:underline"
                          >
                            {t.paciente_nombre}
                          </button>
                        </td>
                        <td className="py-2">{t.profesional_nombre}</td>
                        <td className="py-2">
                          {t.fecha} {t.hora.slice(0, 5)}
                          <span className="block text-xs text-red-600">{diasVencido(t.fecha)}</span>
                        </td>
                        <td className="py-2">
                          {t.plan && (
                            <span className="inline-block text-xs bg-amber-50 border border-amber-300 text-amber-800 rounded px-2 py-0.5">
                              ⚠ Con plan — sesión sin descontar todavía
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {tieneHistorial ? (
                            <button
                              onClick={() => setPanelCondensado({
                                pacienteId: t.paciente,
                                consultaId: t.consulta_pendiente_id,
                              })}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Completar consulta
                            </button>
                          ) : (
                            <Link
                              to={`/consultas/${t.consulta_pendiente_id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Completar consulta
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {pacienteAbiertoId && (
        <FichaPacienteModal pacienteId={pacienteAbiertoId} onClose={() => setPacienteAbiertoId(null)} />
      )}

      {panelCondensado && (
        <PanelCamillaCondensado
          pacienteId={panelCondensado.pacienteId}
          consultaId={panelCondensado.consultaId}
          onClose={() => {
            setPanelCondensado(null)
            cargarDatos()
          }}
        />
      )}
    </Layout>
  )
}
