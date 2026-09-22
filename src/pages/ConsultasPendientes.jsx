import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import Boton from '../components/Boton'
import { formatearFecha, formatearHora } from '../utils/fechas'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  const cargarDatos = () => {
    apiClient
      .get('/turnos/?vencidos_sin_completar=1')
      .then((res) => setTurnos(res.data))
      .catch(() => setError('No se pudo cargar el listado de consultas pendientes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return (
    <Layout titulo="Consultas pendientes">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
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
                    return (
                      <tr key={t.id} className="border-b border-slate-100 bg-red-50">
                        <td className="py-2">
                          <button
                            onClick={() => setPacienteAbiertoId(t.paciente)}
                            className="text-texto hover:text-btn-primary transition-colors"
                          >
                            {t.paciente_nombre}
                          </button>
                        </td>
                        <td className="py-2">{t.profesional_nombre}</td>
                        <td className="py-2">
                          {formatearFecha(t.fecha)} {formatearHora(t.hora)}
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
                          <Boton to={`/consultas/${t.consulta_pendiente_id}`} variante="primary" tamaño="sm">
                            Completar consulta
                          </Boton>
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
    </Layout>
  )
}
