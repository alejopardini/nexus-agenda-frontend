import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'

export default function DetallePaciente() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiClient.get(`/pacientes/${id}/`),
      apiClient.get('/consultas/'),
    ])
      .then(([pacienteRes, consultasRes]) => {
        setPaciente(pacienteRes.data)
        setConsultas(consultasRes.data.filter((c) => String(c.paciente) === id))
      })
      .catch(() => setError('No se pudo cargar el paciente.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error || !paciente) {
    return (
      <Layout>
        <p className="text-red-600">{error || 'Paciente no encontrado.'}</p>
      </Layout>
    )
  }

  const tieneClinico = 'historia_clinica' in paciente

  return (
    <Layout>
      <div className="space-y-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-slate-800">
              {paciente.nombre} {paciente.apellido}
            </h1>
            <Link
              to={`/pacientes/${id}/editar`}
              className="text-sm text-blue-600 hover:underline"
            >
              Editar
            </Link>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{paciente.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Celular</dt>
              <dd className="text-slate-800">{paciente.celular || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha de nacimiento</dt>
              <dd className="text-slate-800">{paciente.fecha_nacimiento || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Última consulta</dt>
              <dd className="text-slate-800">{paciente.ultima_consulta || '—'}</dd>
            </div>
          </dl>

          {tieneClinico && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-600 mb-1">Historia clínica</h2>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {paciente.historia_clinica || 'Sin datos cargados.'}
              </p>
              {paciente.discapacidad && (
                <p className="text-sm text-slate-800 mt-2">
                  <span className="font-medium">Discapacidad:</span> {paciente.discapacidad_detalle || 'Sí'}
                </p>
              )}
            </div>
          )}
        </div>

        {tieneClinico && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-800">Consultas</h2>
              <Link
                to={`/consultas/nueva?paciente=${id}`}
                className="text-sm bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
              >
                + Nueva consulta
              </Link>
            </div>
            {consultas.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay consultas cargadas para este paciente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {consultas.map((c) => (
                  <li key={c.id} className="py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-800">{c.fecha}</span>
                      <span className="text-slate-500">{c.profesional_nombre}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{c.motivo}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}