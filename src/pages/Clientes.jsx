import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaClienteModal from '../components/FichaClienteModal'
import NuevoClienteModal from '../components/NuevoClienteModal'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'
import Badge from '../components/Badge'
import { formatearFecha, formatearHora } from '../utils/fechas'

const TAMANO_PAGINA = 10

function formatearTurno(turno) {
  if (!turno) return '—'
  const hora = turno.hora ? formatearHora(turno.hora) : ''
  return hora ? `${formatearFecha(turno.fecha)} ${hora}` : formatearFecha(turno.fecha)
}

export default function Clientes() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [clienteAbiertoId, setClienteAbiertoId] = useState(() => location.state?.abrirClienteId ?? null)
  const [modalNuevoClienteAbierto, setModalNuevoClienteAbierto] = useState(false)

  useEffect(() => {
    apiClient
      .get('/clientes/')
      .then((res) => setClientes(res.data))
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (location.state?.abrirClienteId) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const termino = busqueda.trim().toLowerCase()
  const terminoDni = termino.replace(/[.\s]/g, '')
  const clientesFiltrados = termino
    ? clientes.filter((p) => {
        const coincideNombre = `${p.nombre} ${p.apellido}`.toLowerCase().includes(termino)
        const coincideDni = terminoDni && (p.dni || '').replace(/[.\s]/g, '').includes(terminoDni)
        return coincideNombre || coincideDni
      })
    : clientes

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * TAMANO_PAGINA
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + TAMANO_PAGINA)

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <Layout titulo="Clientes">
      <div className="flex items-center justify-end gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search
            size={16}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            className="w-64 h-10 pl-9 pr-3 rounded-lg border border-input-border text-[14px] outline-none focus:border-2 focus:border-input-focus"
          />
        </div>
        {(auth.rol !== 'profesional' || auth.puede_crear_clientes === true) && (
          <Boton
            type="button"
            onClick={() => setModalNuevoClienteAbierto(true)}
            variante="primary"
            className="whitespace-nowrap"
          >
            + Nuevo cliente
          </Boton>
        )}
      </div>

      {loading && <p className="text-texto-secundario">Cargando...</p>}
      {error && <p className="text-input-error">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md">
          {clientes.length === 0 ? (
            <p className="text-texto-secundario p-6">No hay clientes cargados todavía.</p>
          ) : clientesFiltrados.length === 0 ? (
            <p className="text-texto-secundario p-6">Ningún cliente coincide con "{busqueda}".</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-borde-suave">
                      <th className="py-3 px-4 font-medium">Cliente</th>
                      <th className="py-3 px-4 font-medium">DNI</th>
                      <th className="py-3 px-4 font-medium">Email</th>
                      <th className="py-3 px-4 font-medium">Teléfono</th>
                      <th className="py-3 px-4 font-medium">Fecha de nacimiento</th>
                      <th className="py-3 px-4 font-medium">Último turno</th>
                      <th className="py-3 px-4 font-medium">Próximo turno</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesPagina.map((p) => (
                      <tr key={p.id} className="border-b border-borde-suave last:border-b-0 hover:bg-superficie-hover">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setClienteAbiertoId(p.id)}
                            className="text-texto hover:text-btn-primary transition-colors"
                          >
                            {p.nombre} {p.apellido}
                          </button>
                        </td>
                        <td className="py-3 px-4">{p.dni || '—'}</td>
                        <td className="py-3 px-4 max-w-[160px] truncate" title={p.email || ''}>{p.email || '—'}</td>
                        <td className="py-3 px-4">{p.celular || '—'}</td>
                        <td className="py-3 px-4">{p.fecha_nacimiento ? formatearFecha(p.fecha_nacimiento) : '—'}</td>
                        <td className="py-3 px-4">{formatearTurno(p.ultimo_turno)}</td>
                        <td className="py-3 px-4">{formatearTurno(p.proximo_turno)}</td>
                        <td className="py-3 px-4">
                          {p.proximo_turno?.estado && ['pendiente', 'confirmado', 'cancelado'].includes(p.proximo_turno.estado) ? (
                            <Badge estado={p.proximo_turno.estado}>
                              {p.proximo_turno.estado === 'pendiente' && 'Sin confirmar'}
                              {p.proximo_turno.estado === 'confirmado' && 'Confirmado'}
                              {p.proximo_turno.estado === 'cancelado' && 'Cancelado'}
                            </Badge>
                          ) : (
                            <span className="text-texto-secundario">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-borde-suave text-[14px] text-texto-secundario">
                <span>
                  Mostrando {inicio + 1}-{Math.min(inicio + TAMANO_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="p-1.5 rounded-lg border border-input-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-superficie-hover"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} strokeWidth={2} />
                  </button>
                  <span>Página {paginaActual} de {totalPaginas}</span>
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1.5 rounded-lg border border-input-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-superficie-hover"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {clienteAbiertoId && (
        <FichaClienteModal
          clienteId={clienteAbiertoId}
          onClose={() => setClienteAbiertoId(null)}
        />
      )}

      {modalNuevoClienteAbierto && (
        <NuevoClienteModal
          onClose={() => setModalNuevoClienteAbierto(false)}
          onCreado={(p) => {
            setClientes((prev) => [...prev, p])
            setClienteAbiertoId(p.id)
          }}
        />
      )}
    </Layout>
  )
}
