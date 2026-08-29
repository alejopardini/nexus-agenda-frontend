import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import { useAuth } from '../context/AuthContext'

const COLOR_ESTADO = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
}

const LABEL_ESTADO = {
  pendiente: 'Pendiente',
  completada: 'Completada',
}

const MOTIVO_MAX = 45

export default function Consultas() {
  const { auth } = useAuth()
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  useEffect(() => {
    apiClient
      .get('/consultas/')
      .then((res) => setConsultas(res.data))
      .catch(() => setError('No se pudieron cargar las consultas.'))
      .finally(() => setLoading(false))
  }, [])

  const termino = busqueda.trim().toLowerCase()
  const consultasFiltradas = termino
    ? consultas.filter((c) => c.paciente_nombre.toLowerCase().includes(termino))
    : consultas

  const truncarMotivo = (motivo) => {
    if (!motivo) return '—'
    return motivo.length > MOTIVO_MAX ? `${motivo.slice(0, MOTIVO_MAX)}…` : motivo
  }

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Consultas</h1>
            <input
              type="text"
              placeholder="Buscar por nombre del paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
          </div>

          {consultas.length === 0 ? (
            <p className="text-slate-500">No hay consultas todavía.</p>
          ) : consultasFiltradas.length === 0 ? (
            <p className="text-slate-500">Ninguna consulta coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Paciente</th>
                    {auth.rol === 'dueño' && <th className="py-2">Profesional</th>}
                    <th className="py-2">Motivo</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {consultasFiltradas.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="py-2">{c.fecha}</td>
                      <td className="py-2">
                        <button
                          onClick={() => setPacienteAbiertoId(c.paciente)}
                          className="text-blue-600 hover:underline"
                        >
                          {c.paciente_nombre}
                        </button>
                      </td>
                      {auth.rol === 'dueño' && <td className="py-2">{c.profesional_nombre}</td>}
                      <td className="py-2">{truncarMotivo(c.motivo)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${COLOR_ESTADO[c.estado] || ''}`}>
                          {LABEL_ESTADO[c.estado] || c.estado}
                        </span>
                      </td>
                      <td className="py-2">
                        <Link to={`/consultas/${c.id}`} className="text-blue-600 text-xs hover:underline">
                          Ver/Editar
                        </Link>
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
