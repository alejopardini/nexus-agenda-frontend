import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'

export default function Pacientes() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(() => location.state?.abrirPacienteId ?? null)

  useEffect(() => {
    apiClient
      .get('/pacientes/')
      .then((res) => setPacientes(res.data))
      .catch(() => setError('No se pudieron cargar los pacientes.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (location.state?.abrirPacienteId) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const termino = busqueda.trim().toLowerCase()
  const pacientesFiltrados = termino
    ? pacientes.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(termino))
    : pacientes

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Pacientes</h1>
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
            {(auth.rol !== 'profesional' || auth.puede_crear_pacientes === true) && (
              <Boton to="/pacientes/nuevo" variante="primary" className="whitespace-nowrap">
                + Nuevo paciente
              </Boton>
            )}
          </div>

          {pacientes.length === 0 ? (
            <p className="text-slate-500">No hay pacientes cargados todavía.</p>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún paciente coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Celular</th>
                  <th className="py-2">Última consulta</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2">
                      <button
                        onClick={() => setPacienteAbiertoId(p.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {p.nombre} {p.apellido}
                      </button>
                    </td>
                    <td className="py-2">{p.email || '—'}</td>
                    <td className="py-2">{p.celular || '—'}</td>
                    <td className="py-2">{p.ultima_consulta || '—'}</td>
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