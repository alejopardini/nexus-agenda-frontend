import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
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

export default function Pacientes() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
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

  const totalPaginas = Math.max(1, Math.ceil(pacientesFiltrados.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * TAMANO_PAGINA
  const pacientesPagina = pacientesFiltrados.slice(inicio, inicio + TAMANO_PAGINA)

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <Layout titulo="Pacientes">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-sans font-semibold text-[32px] text-heading">Pacientes</h1>
          <p className="font-sans text-[16px] text-texto-secundario mt-1">
            Gestioná la información y el seguimiento de tus pacientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              className="w-64 h-10 pl-9 pr-3 rounded-lg border border-input-border text-[14px] outline-none focus:border-2 focus:border-input-focus"
            />
          </div>
          {(auth.rol !== 'profesional' || auth.puede_crear_pacientes === true) && (
            <Boton to="/pacientes/nuevo" variante="primary" className="whitespace-nowrap">
              + Nuevo paciente
            </Boton>
          )}
        </div>
      </div>

      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md">
          {pacientes.length === 0 ? (
            <p className="text-slate-500 p-6">No hay pacientes cargados todavía.</p>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-slate-500 p-6">Ningún paciente coincide con "{busqueda}".</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-[#E2E4E8]">
                      <th className="py-3 px-6 font-medium">Paciente</th>
                      <th className="py-3 px-6 font-medium">DNI</th>
                      <th className="py-3 px-6 font-medium">Teléfono</th>
                      <th className="py-3 px-6 font-medium">Último turno</th>
                      <th className="py-3 px-6 font-medium">Próximo turno</th>
                      <th className="py-3 px-6 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesPagina.map((p) => (
                      <tr key={p.id} className="border-b border-[#E2E4E8] last:border-b-0 hover:bg-slate-50">
                        <td className="py-3 px-6">
                          <button
                            onClick={() => setPacienteAbiertoId(p.id)}
                            className="text-blue-600 hover:underline"
                          >
                            {p.nombre} {p.apellido}
                          </button>
                        </td>
                        <td className="py-3 px-6">{p.dni || '—'}</td>
                        <td className="py-3 px-6">{p.celular || '—'}</td>
                        <td className="py-3 px-6">{formatearTurno(p.ultimo_turno)}</td>
                        <td className="py-3 px-6">{formatearTurno(p.proximo_turno)}</td>
                        <td className="py-3 px-6">
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

              <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-[#E2E4E8] text-[14px] text-texto-secundario">
                <span>
                  Mostrando {inicio + 1}-{Math.min(inicio + TAMANO_PAGINA, pacientesFiltrados.length)} de {pacientesFiltrados.length} pacientes
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

      {pacienteAbiertoId && (
        <FichaPacienteModal
          pacienteId={pacienteAbiertoId}
          onClose={() => setPacienteAbiertoId(null)}
        />
      )}
    </Layout>
  )
}
