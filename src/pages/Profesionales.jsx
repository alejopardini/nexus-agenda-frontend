import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Profesionales() {
  const { auth } = useAuth()
  const [profesionales, setProfesionales] = useState([])
  const [infoOrg, setInfoOrg] = useState(null)
  const [planSeleccionado, setPlanSeleccionado] = useState('')
  const [actualizandoPlan, setActualizandoPlan] = useState(false)
  const [errorPlan, setErrorPlan] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = () => {
    Promise.all([
      apiClient.get('/profesionales/'),
      apiClient.get('/organizacion/'),
    ])
      .then(([profesionalesRes, orgRes]) => {
        setProfesionales(profesionalesRes.data)
        setInfoOrg(orgRes.data)
        setPlanSeleccionado(orgRes.data.plan)
      })
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

  const actualizarPlan = async () => {
    setErrorPlan('')
    setActualizandoPlan(true)
    try {
      const res = await apiClient.patch('/organizacion/', { plan: planSeleccionado })
      setInfoOrg((prev) => ({ ...prev, ...res.data }))
    } catch (err) {
      setErrorPlan(err.response?.data?.detail || 'No se pudo actualizar el plan.')
    } finally {
      setActualizandoPlan(false)
    }
  }

  const enElLimite = infoOrg && infoOrg.cantidad_profesionales >= infoOrg.limite_profesionales
  const hayCambioPendiente = infoOrg && planSeleccionado !== infoOrg.plan

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-1">
              <h1 className="text-xl font-bold text-slate-800">Profesionales</h1>
              {auth.rol === 'dueño' && infoOrg && (
                !enElLimite ? (
                  <Link
                    to="/profesionales/nuevo"
                    className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
                  >
                    + Nuevo profesional
                  </Link>
                ) : (
                  <span className="text-sm text-red-600">Límite del plan alcanzado</span>
                )
              )}
            </div>

            {infoOrg && (
              <p className="text-xs text-slate-400 mb-4">
                {infoOrg.cantidad_profesionales} de {infoOrg.limite_profesionales} profesionales — {infoOrg.plan_display}
              </p>
            )}

            {profesionales.length === 0 ? (
              <p className="text-slate-500">No hay profesionales cargados todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Nombre</th>
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

          {auth.rol === 'dueño' && infoOrg && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Plan</h2>
              <p className="text-sm text-slate-500 mb-3">
                Elegí el plan según cuántos profesionales necesitás tener cargados.
              </p>

              {errorPlan && <p className="text-red-600 text-sm mb-3">{errorPlan}</p>}

              <div className="flex gap-2 items-center">
                <select
                  value={planSeleccionado}
                  onChange={(e) => setPlanSeleccionado(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  {infoOrg.planes_disponibles.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <button
                  onClick={actualizarPlan}
                  disabled={!hayCambioPendiente || actualizandoPlan}
                  className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {actualizandoPlan ? 'Actualizando...' : 'Actualizar plan'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}