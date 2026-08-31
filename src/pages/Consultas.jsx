import { useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import { useAuth } from '../context/AuthContext'

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

  const pacientes = useMemo(() => {
    const mapa = new Map()
    consultas.forEach((c) => {
      const existente = mapa.get(c.paciente)
      if (existente) {
        existente.profesionales.add(c.profesional_nombre)
      } else {
        mapa.set(c.paciente, {
          id: c.paciente,
          nombre: c.paciente_nombre,
          profesionales: new Set([c.profesional_nombre]),
        })
      }
    })
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [consultas])

  const termino = busqueda.trim().toLowerCase()
  const pacientesFiltrados = termino
    ? pacientes.filter((p) => p.nombre.toLowerCase().includes(termino))
    : pacientes

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

          {pacientes.length === 0 ? (
            <p className="text-slate-500">No hay consultas todavía.</p>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún paciente coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Paciente</th>
                    {auth.rol === 'dueño' && <th className="py-2">Profesional/es</th>}
                  </tr>
                </thead>
                <tbody>
                  {pacientesFiltrados.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <button
                          onClick={() => setPacienteAbiertoId(p.id)}
                          className="text-blue-600 hover:underline"
                        >
                          {p.nombre}
                        </button>
                      </td>
                      {auth.rol === 'dueño' && (
                        <td className="py-2">{Array.from(p.profesionales).join(', ')}</td>
                      )}
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
