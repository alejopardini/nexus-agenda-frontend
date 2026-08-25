import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Profesionales() {
  const { auth } = useAuth()
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = () => {
    apiClient
      .get('/profesionales/')
      .then((res) => setProfesionales(res.data))
      .catch(() => setError('No se pudieron cargar los profesionales.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const darDeBaja = async (id, nombre) => {
    if (!confirm(`¿Quitar a ${nombre} de la organización? Su historial se conserva.`)) return
    try {
      await apiClient.post(`/profesionales/${id}/dar_de_baja/`)
      cargar()
    } catch {
      alert('No se pudo dar de baja al profesional.')
    }
  }

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-slate-800">Profesionales</h1>
            {auth.rol === 'dueño' && (
              <Link
                to="/profesionales/nuevo"
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
              >
                + Nuevo profesional
              </Link>
            )}
          </div>
          {profesionales.length === 0 ? (
            <p className="text-slate-500">No hay profesionales cargados todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Especialidad</th>
                  {auth.rol === 'dueño' && <th className="py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {profesionales.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">
                      {auth.rol === 'dueño' ? (
                        <Link to={`/profesionales/${p.id}/editar`} className="text-blue-600 hover:underline">
                          {p.nombre} {p.apellido}
                        </Link>
                      ) : (
                        <span>{p.nombre} {p.apellido}</span>
                      )}
                    </td>
                    <td className="py-2">{p.especialidad}</td>
                    {auth.rol === 'dueño' && (
                      <td className="py-2">
                        <button
                          onClick={() => darDeBaja(p.id, `${p.nombre} ${p.apellido}`)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Dar de baja
                        </button>
                      </td>
                    )}
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