import { useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaClienteModal from '../components/FichaClienteModal'
import { useAuth } from '../context/AuthContext'

export default function Consultas() {
  const { auth } = useAuth()
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [clienteAbiertoId, setClienteAbiertoId] = useState(null)

  useEffect(() => {
    apiClient
      .get('/consultas/')
      .then((res) => setConsultas(res.data))
      .catch(() => setError('No se pudieron cargar las consultas.'))
      .finally(() => setLoading(false))
  }, [])

  const clientes = useMemo(() => {
    const mapa = new Map()
    consultas.forEach((c) => {
      const existente = mapa.get(c.cliente)
      if (existente) {
        existente.profesionales.add(c.profesional_nombre)
      } else {
        mapa.set(c.cliente, {
          id: c.cliente,
          nombre: c.cliente_nombre,
          profesionales: new Set([c.profesional_nombre]),
        })
      }
    })
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [consultas])

  const termino = busqueda.trim().toLowerCase()
  const clientesFiltrados = termino
    ? clientes.filter((p) => p.nombre.toLowerCase().includes(termino))
    : clientes

  return (
    <Layout titulo="Consultas">
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-end items-center mb-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre del cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
          </div>

          {clientes.length === 0 ? (
            <p className="text-slate-500">No hay consultas todavía.</p>
          ) : clientesFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún cliente coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Cliente</th>
                    {auth.rol === 'dueño' && <th className="py-2">Profesional/es</th>}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <button
                          onClick={() => setClienteAbiertoId(p.id)}
                          className="text-texto hover:text-btn-primary transition-colors"
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

      {clienteAbiertoId && (
        <FichaClienteModal
          clienteId={clienteAbiertoId}
          onClose={() => setClienteAbiertoId(null)}
        />
      )}
    </Layout>
  )
}
