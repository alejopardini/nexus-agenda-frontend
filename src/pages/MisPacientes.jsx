import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'

export default function MisPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .get('/mis-pacientes/')
      .then((res) => setPacientes(res.data))
      .catch(() => setError('No se pudieron cargar tus pacientes.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Mis pacientes</h1>
          <p className="text-sm text-slate-500 mb-4">
            Todos tus pacientes, de cualquier clínica u organización donde trabajes.
          </p>
          {pacientes.length === 0 ? (
            <p className="text-slate-500">Todavía no tenés pacientes propios.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Organización</th>
                  <th className="py-2">Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2">
                      <Link to={`/pacientes/${p.id}`} className="text-blue-600 hover:underline">
                        {p.nombre} {p.apellido}
                      </Link>
                    </td>
                    <td className="py-2">{p.organizacion_nombre}</td>
                    <td className="py-2">{p.sucursal_nombre}</td>
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