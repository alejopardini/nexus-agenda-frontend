import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaClienteModal from '../components/FichaClienteModal'

export default function ClientesSinTurno() {
  const [dias, setDias] = useState(30)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clienteAbiertoId, setClienteAbiertoId] = useState(null)

  useEffect(() => {
    setLoading(true)
    apiClient
      .get(`/clientes/sin_turno_reciente/?dias=${dias}`)
      .then((res) => setClientes(res.data))
      .catch(() => setError('No se pudo cargar el reporte.'))
      .finally(() => setLoading(false))
  }, [dias])

  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (!a.ultima_fecha && !b.ultima_fecha) return 0
    if (!a.ultima_fecha) return -1
    if (!b.ultima_fecha) return 1
    return a.ultima_fecha < b.ultima_fecha ? -1 : 1
  })

  return (
    <Layout titulo="Clientes sin turno reciente">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-end items-center mb-4 gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
            Mostrar clientes sin turno hace más de:
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
          clientesOrdenados.length === 0 ? (
            <p className="text-slate-500">No hay clientes que cumplan este criterio.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Celular</th>
                  <th className="py-2">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <button onClick={() => setClienteAbiertoId(p.id)} className="text-texto hover:text-btn-primary transition-colors">
                        {p.nombre} {p.apellido}
                      </button>
                    </td>
                    <td className="py-2">{p.celular || '—'}</td>
                    <td className="py-2">{p.ultima_fecha || 'Nunca'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )
        )}
      </div>

      {clienteAbiertoId && (
        <FichaClienteModal clienteId={clienteAbiertoId} onClose={() => setClienteAbiertoId(null)} />
      )}
    </Layout>
  )
}
