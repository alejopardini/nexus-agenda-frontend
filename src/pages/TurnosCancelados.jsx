import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { formatearFecha, formatearHora } from '../utils/fechas'

export default function TurnosCancelados() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .get('/turnos/')
      .then((res) => setTurnos(res.data.filter((t) => t.estado === 'cancelado')))
      .catch(() => setError('No se pudieron cargar los turnos cancelados.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout titulo="Turnos cancelados">
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {turnos.length === 0 ? (
            <p className="text-slate-500">No hay turnos cancelados registrados.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Hora</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Profesional</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-2">{formatearFecha(t.fecha)}</td>
                    <td className="py-2">{formatearHora(t.hora)}</td>
                    <td className="py-2">{t.cliente_nombre}</td>
                    <td className="py-2">{t.profesional_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}