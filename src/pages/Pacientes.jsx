import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Pacientes() {
  const { auth } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    apiClient
      .get('/pacientes/')
      .then((res) => setPacientes(res.data))
      .catch(() => setError('No se pudieron cargar los pacientes.'))
      .finally(() => setLoading(false))
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
            {auth.rol !== 'profesional' && (
              <Link
                to="/pacientes/nuevo"
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 whitespace-nowrap"
              >
                + Nuevo paciente
              </Link>
            )}
          </div>

          {pacientes.length === 0 ? (
            <p className="text-slate-500">No hay pacientes cargados todavía.</p>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún paciente coincide con "{busqueda}".</p>
          ) : (
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
                      <Link to={`/pacientes/${p.id}`} className="text-blue-600 hover:underline">
                        {p.nombre} {p.apellido}
                      </Link>
                    </td>
                    <td className="py-2">{p.email || '—'}</td>
                    <td className="py-2">{p.celular || '—'}</td>
                    <td className="py-2">{p.ultima_consulta || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  )
}