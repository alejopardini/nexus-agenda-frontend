import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'

export default function PacientesSinTurno() {
  const [dias, setDias] = useState(30)
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  useEffect(() => {
    setLoading(true)
    apiClient
      .get(`/pacientes/sin_turno_reciente/?dias=${dias}`)
      .then((res) => setPacientes(res.data))
      .catch(() => setError('No se pudo cargar el reporte.'))
      .finally(() => setLoading(false))
  }, [dias])

  const pacientesOrdenados = [...pacientes].sort((a, b) => {
    if (!a.ultima_fecha && !b.ultima_fecha) return 0
    if (!a.ultima_fecha) return -1
    if (!b.ultima_fecha) return 1
    return a.ultima_fecha < b.ultima_fecha ? -1 : 1
  })

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Pacientes sin turno reciente</h1>
          <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
            Mostrar pacientes sin turno hace más de:
            <input
              type="number"
              min={1}
              value={dias}
              onChange={(e) => setDias(Number(e.target.value) || 0)}
              className="w-20 border border-slate-300 rounded px-2 py-1"
            />
            días
          </label>
        </div>

        {loading && <p className="text-slate-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          pacientesOrdenados.length === 0 ? (
            <p className="text-slate-500">No hay pacientes que cumplan este criterio.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Celular</th>
                  <th className="py-2">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {pacientesOrdenados.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <button onClick={() => setPacienteAbiertoId(p.id)} className="text-blue-600 hover:underline">
                        {p.nombre} {p.apellido}
                      </button>
                    </td>
                    <td className="py-2">{p.celular || '—'}</td>
                    <td className="py-2">{p.ultima_fecha || 'Nunca'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {pacienteAbiertoId && (
        <FichaPacienteModal pacienteId={pacienteAbiertoId} onClose={() => setPacienteAbiertoId(null)} />
      )}
    </Layout>
  )
}
