import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Pencil, Check, X } from 'lucide-react'
import apiClient from '../api/client'
import SelectorPlantillaPlan from './SelectorPlantillaPlan'
import GestionArchivosCliente from './GestionArchivosCliente'
import Modal from './Modal'
import Boton from './Boton'
import BotonIcono from './BotonIcono'
import { useAuth } from '../context/AuthContext'
import { formatearFecha, formatearHora } from '../utils/fechas'

const CAMPOS_EDITABLES = [
  ['dni', 'DNI', 'text'],
  ['obra_social', 'Obra social', 'text'],
  ['email', 'Email', 'email'],
  ['celular', 'Celular', 'text'],
  ['fecha_nacimiento', 'Fecha de nacimiento', 'date'],
]

const TABS = [
  { key: 'datos', label: 'Datos' },
  { key: 'turnos', label: 'Turnos' },
  { key: 'planes', label: 'Planes' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'ultima_consulta', label: 'Última consulta' },
  { key: 'historial_consultas', label: 'Historial de consultas' },
  { key: 'notas', label: 'Notas / Información' },
  { key: 'archivos', label: 'Archivos' },
]

function previewTexto(texto, max = 160) {
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto
}

export default function FichaClienteModal({ clienteId, onClose, ocultarEditar = false }) {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('historial_consultas')

  const [consultas, setConsultas] = useState([])
  const [consultasError, setConsultasError] = useState(false)
  const [consultasCargadas, setConsultasCargadas] = useState(false)
  const [turnos, setTurnos] = useState([])

  const [editandoCampo, setEditandoCampo] = useState(null)
  const [valorEditado, setValorEditado] = useState('')
  const [guardandoCampo, setGuardandoCampo] = useState(false)
  const [errorCampo, setErrorCampo] = useState('')

  const [profesionalesOrg, setProfesionalesOrg] = useState([])
  const [mostrarFormHistorica, setMostrarFormHistorica] = useState(false)
  const [formHistorica, setFormHistorica] = useState({ profesional: '', fecha: '', titulo: '', notas: '' })
  const [guardandoHistorica, setGuardandoHistorica] = useState(false)
  const [errorHistorica, setErrorHistorica] = useState('')

  const [planes, setPlanes] = useState([])
  const [planesError, setPlanesError] = useState(false)
  const [formPlan, setFormPlan] = useState({ sesiones_totales: '', precio: '', notas: '' })
  const [plantillasPlan, setPlantillasPlan] = useState([])
  const [guardandoPlan, setGuardandoPlan] = useState(false)
  const [errorPlan, setErrorPlan] = useState('')
  const [editandoPlanId, setEditandoPlanId] = useState(null)
  const [editPlan, setEditPlan] = useState({ sesiones_totales: '', precio: '', notas: '' })
  const [guardandoEditPlan, setGuardandoEditPlan] = useState(false)
  const [mostrarPlanesArchivados, setMostrarPlanesArchivados] = useState(false)

  const cargarPlanes = () => {
    apiClient
      .get(`/planes/?cliente=${clienteId}`)
      .then((res) => {
        setPlanes(res.data)
        setPlanesError(false)
      })
      .catch(() => setPlanesError(true))
  }

  const cargarConsultas = () => {
    apiClient
      .get('/consultas/')
      .then((res) => {
        setConsultas(res.data.filter((c) => String(c.cliente) === String(clienteId)))
        setConsultasError(false)
      })
      .catch(() => setConsultasError(true))
      .finally(() => setConsultasCargadas(true))
  }

  useEffect(() => {
    let activo = true

    apiClient
      .get(`/clientes/${clienteId}/`)
      .then((res) => { if (activo) setCliente(res.data) })
      .catch(() => { if (activo) setError('No se pudo cargar el cliente.') })
      .finally(() => { if (activo) setLoading(false) })

    cargarConsultas()

    if (auth.rol === 'dueño') {
      apiClient
        .get('/profesionales/')
        .then((res) => { if (activo) setProfesionalesOrg(res.data) })
        .catch(() => {})
    }

    apiClient
      .get('/turnos/')
      .then((res) => {
        if (!activo) return
        const propios = res.data.filter((t) => String(t.cliente) === String(clienteId))
        propios.sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
        setTurnos(propios)
      })
      .catch(() => {})

    cargarPlanes()

    apiClient
      .get('/plantillas-plan/')
      .then((res) => { if (activo) setPlantillasPlan(res.data.filter((pl) => pl.activo)) })
      .catch(() => {})

    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  const hayConsultaCompletada = consultas.some((c) => c.estado === 'completada')
  const consultasCompletadas = consultas.filter((c) => c.estado === 'completada')

  const iniciarEdicionCampo = (campo) => {
    setEditandoCampo(campo)
    setValorEditado(cliente[campo] || '')
    setErrorCampo('')
  }

  const cancelarEdicionCampo = () => {
    setEditandoCampo(null)
    setErrorCampo('')
  }

  const guardarCampo = async (campo) => {
    setGuardandoCampo(true)
    setErrorCampo('')
    try {
      const res = await apiClient.patch(`/clientes/${clienteId}/`, { [campo]: valorEditado })
      setCliente((prev) => ({ ...prev, [campo]: res.data[campo] }))
      setEditandoCampo(null)
    } catch (err) {
      const data = err.response?.data
      setErrorCampo(data ? Object.values(data).flat().join(' ') : 'No se pudo guardar.')
    } finally {
      setGuardandoCampo(false)
    }
  }

  const handleSubmitPlan = async (e) => {
    e.preventDefault()
    setErrorPlan('')
    if (!formPlan.sesiones_totales) return
    if (!formPlan.precio) {
      setErrorPlan('El precio es obligatorio.')
      return
    }
    setGuardandoPlan(true)
    try {
      await apiClient.post('/planes/', {
        cliente: clienteId,
        sesiones_totales: formPlan.sesiones_totales,
        precio: formPlan.precio,
        notas: formPlan.notas,
      })
      setFormPlan({ sesiones_totales: '', precio: '', notas: '' })
      cargarPlanes()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar el plan.'
      alert(mensaje)
    } finally {
      setGuardandoPlan(false)
    }
  }

  const toggleFormHistorica = () => {
    setErrorHistorica('')
    setMostrarFormHistorica((v) => !v)
  }

  const handleSubmitHistorica = async (e) => {
    e.preventDefault()
    setErrorHistorica('')
    if (auth.rol === 'dueño' && !formHistorica.profesional) {
      setErrorHistorica('Seleccioná el profesional que atendió la consulta.')
      return
    }
    if (!formHistorica.fecha) {
      setErrorHistorica('La fecha es obligatoria.')
      return
    }
    const hoy = new Date().toISOString().slice(0, 10)
    if (formHistorica.fecha > hoy) {
      setErrorHistorica('La fecha de una consulta histórica no puede ser futura.')
      return
    }
    setGuardandoHistorica(true)
    try {
      const payload = {
        fecha: formHistorica.fecha,
        titulo: formHistorica.titulo,
        notas: formHistorica.notas,
      }
      if (auth.rol === 'dueño') payload.profesional = formHistorica.profesional
      const res = await apiClient.post(`/clientes/${clienteId}/consulta-historica/`, payload)
      onClose()
      navigate(`/consultas/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data?.detail
        ? data.detail
        : data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar la consulta histórica.'
      setErrorHistorica(mensaje)
    } finally {
      setGuardandoHistorica(false)
    }
  }

  const iniciarEdicionPlan = (p) => {
    setEditandoPlanId(p.id)
    setEditPlan({ sesiones_totales: p.sesiones_totales, precio: p.precio, notas: p.notas })
  }

  const cancelarEdicionPlan = () => {
    setEditandoPlanId(null)
  }

  const guardarEdicionPlan = async (id) => {
    setGuardandoEditPlan(true)
    try {
      await apiClient.patch(`/planes/${id}/`, {
        sesiones_totales: editPlan.sesiones_totales,
        precio: editPlan.precio,
        notas: editPlan.notas,
      })
      setEditandoPlanId(null)
      cargarPlanes()
    } catch {
      alert('No se pudo guardar el plan.')
    } finally {
      setGuardandoEditPlan(false)
    }
  }

  const darDeBajaPlan = async (id) => {
    if (!confirm('¿Dar de baja este plan? Las sesiones no se pierden, pero deja de usarse automáticamente para nuevos turnos.')) return
    try {
      await apiClient.post(`/planes/${id}/dar_de_baja/`)
      cargarPlanes()
    } catch {
      alert('No se pudo dar de baja el plan.')
    }
  }

  const planCerrado = (p) => !p.activo || p.sesiones_usadas >= p.sesiones_totales

  const tieneAcceso = cliente ? 'email' in cliente : false
  const puedeAgendarTurno = auth.rol !== 'profesional' || auth.puede_crear_turnos === true
  const puedeCargarHistorica = auth.rol === 'dueño' || auth.rol === 'profesional'
  const profesionalACargo = consultas[0]?.profesional_nombre || null
  const ultimaConsultaCompletada = consultas.find((c) => c.estado === 'completada')
  const pagosRealizados = turnos.filter((t) => t.pagado)
  const totalPagado = pagosRealizados.reduce((acc, t) => acc + (Number(t.monto_cobrado) || 0), 0)

  const mostrarTabs = !loading && !error && cliente && tieneAcceso

  return (
    <Modal
      ancho="max-w-5xl"
      onClose={onClose}
      titulo={
        <>
          {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Ficha del cliente'}
          {tieneAcceso && (!ocultarEditar || puedeAgendarTurno) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {!ocultarEditar && (
                <Boton to={`/clientes/${clienteId}/editar`} variante="ghost" tamaño="sm" onClick={onClose}>
                  Editar ficha completa
                </Boton>
              )}
              {puedeAgendarTurno && (
                <Boton
                  variante="ghost"
                  tamaño="sm"
                  onClick={() => { onClose(); navigate(`/turnos?cliente=${clienteId}`) }}
                >
                  Agendar turno
                </Boton>
              )}
            </div>
          )}
        </>
      }
      debajoTitulo={
        mostrarTabs && (
          <div className="flex flex-wrap gap-1 border-b border-borde-suave pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-xs px-3 py-1.5 rounded-t ${
                  tab === t.key ? 'bg-btn-primary text-white' : 'text-texto-secundario hover:bg-superficie-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )
      }
    >
        {loading && <p className="text-texto-secundario text-sm">Cargando...</p>}
        {!loading && error && <p className="text-input-error text-sm">{error}</p>}

        {!loading && !error && cliente && !tieneAcceso && (
          <p className="text-sm text-texto-secundario">No tenés acceso a los datos de este cliente.</p>
        )}

        {mostrarTabs && (
          <>
            {tab === 'datos' && (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {CAMPOS_EDITABLES.map(([campo, label, tipo]) => (
                      <div key={campo}>
                        <dt className="text-texto-secundario">{label}</dt>
                        {editandoCampo === campo ? (
                          <div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type={tipo}
                                value={valorEditado}
                                onChange={(e) => setValorEditado(e.target.value)}
                                disabled={guardandoCampo}
                                autoFocus
                                className="w-full border border-input-border rounded px-2 py-1 text-sm focus:outline-none focus:border-input-focus"
                              />
                              <BotonIcono
                                icono={Check}
                                texto="Guardar"
                                color="success"
                                disabled={guardandoCampo}
                                onClick={() => guardarCampo(campo)}
                              />
                              <BotonIcono
                                icono={X}
                                texto="Cancelar"
                                color="neutral"
                                disabled={guardandoCampo}
                                onClick={cancelarEdicionCampo}
                              />
                            </div>
                            {errorCampo && <p className="text-input-error text-xs mt-1">{errorCampo}</p>}
                          </div>
                        ) : (
                          <dd className="text-texto flex items-center gap-1">
                            {cliente[campo] || '—'}
                            <BotonIcono icono={Pencil} texto={`Editar ${label}`} onClick={() => iniciarEdicionCampo(campo)} className="p-2 -m-2" />
                          </dd>
                        )}
                      </div>
                    ))}
                    <div>
                      <dt className="text-texto-secundario">Profesional a cargo</dt>
                      <dd className="text-texto">
                        {profesionalACargo || (consultasError ? 'No disponible' : '—')}
                      </dd>
                    </div>
                  </dl>

                  {ultimaConsultaCompletada && (
                    <div className="mt-4 pt-4 border-t border-borde-suave">
                      <h3 className="text-sm font-semibold text-heading mb-2">Última consulta</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-2">
                        <div>
                          <dt className="text-texto-secundario">Fecha</dt>
                          <dd className="text-texto">{formatearFecha(ultimaConsultaCompletada.fecha)}</dd>
                        </div>
                        <div>
                          <dt className="text-texto-secundario">Título</dt>
                          <dd className="text-texto">{ultimaConsultaCompletada.titulo || '—'}</dd>
                        </div>
                      </dl>
                      <div className="text-right mt-2">
                        <BotonIcono
                          icono={ArrowUpRight}
                          texto="Ver consulta completa"
                          to={`/consultas/${ultimaConsultaCompletada.id}`}
                          onClick={onClose}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === 'turnos' && (
                turnos.length === 0 ? (
                  <p className="text-texto-secundario text-sm">No hay turnos registrados.</p>
                ) : (
                  <ul className="divide-y divide-borde-suave">
                    {turnos.map((t) => (
                      <li key={t.id} className="py-2 text-sm flex justify-between">
                        <span className="text-texto">{formatearFecha(t.fecha)} {formatearHora(t.hora)}</span>
                        <span className="text-texto-secundario">{t.profesional_nombre} — {t.estado}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {tab === 'planes' && (
                planesError ? (
                  <p className="text-texto-secundario text-sm">No se pudieron cargar los planes.</p>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setMostrarPlanesArchivados(!mostrarPlanesArchivados)}
                      className="text-sm text-btn-primary hover:underline"
                    >
                      {mostrarPlanesArchivados ? 'Ver planes activos' : 'Ver archivados'}
                    </button>

                    {!mostrarPlanesArchivados && (
                    <form onSubmit={handleSubmitPlan} className="flex flex-wrap gap-2 items-end bg-superficie-hover rounded-lg p-3">
                      <SelectorPlantillaPlan
                        plantillas={plantillasPlan}
                        sesiones={formPlan.sesiones_totales}
                        precio={formPlan.precio}
                        onChangeSesiones={(v) => setFormPlan((prev) => ({ ...prev, sesiones_totales: v }))}
                        onChangePrecio={(v) => setFormPlan((prev) => ({ ...prev, precio: v }))}
                      />
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs text-input-label mb-1">Notas (opcional)</label>
                        <input
                          type="text"
                          value={formPlan.notas}
                          onChange={(e) => setFormPlan({ ...formPlan, notas: e.target.value })}
                          className="w-full text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                        />
                      </div>
                      <Boton type="submit" tamaño="sm" disabled={guardandoPlan}>
                        {guardandoPlan ? 'Guardando...' : '+ Agregar plan'}
                      </Boton>
                      {errorPlan && <p className="text-input-error text-xs w-full">{errorPlan}</p>}
                    </form>
                    )}

                    {planes.filter((p) => planCerrado(p) === mostrarPlanesArchivados).length === 0 ? (
                      <p className="text-texto-secundario text-sm">
                        {mostrarPlanesArchivados ? 'No hay planes archivados.' : 'No hay planes activos cargados todavía.'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-borde-suave">
                        {planes.filter((p) => planCerrado(p) === mostrarPlanesArchivados).map((p) => (
                          <li key={p.id} className={`py-2 text-sm ${p.activo ? '' : 'opacity-50'}`}>
                            {editandoPlanId === p.id ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 items-end">
                                  <div>
                                    <label className="block text-xs text-input-label mb-1">Sesiones</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={editPlan.sesiones_totales}
                                      onChange={(e) => setEditPlan({ ...editPlan, sesiones_totales: e.target.value })}
                                      className="w-24 text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-input-label mb-1">Precio</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editPlan.precio}
                                      onChange={(e) => setEditPlan({ ...editPlan, precio: e.target.value })}
                                      className="w-28 text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                                      required
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs text-input-label mb-1">Notas</label>
                                    <input
                                      type="text"
                                      value={editPlan.notas}
                                      onChange={(e) => setEditPlan({ ...editPlan, notas: e.target.value })}
                                      className="w-full text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                                    />
                                  </div>
                                </div>
                                <div className="space-x-3">
                                  <button
                                    onClick={() => guardarEdicionPlan(p.id)}
                                    disabled={guardandoEditPlan}
                                    className="text-btn-primary text-xs hover:underline disabled:opacity-50"
                                  >
                                    Guardar
                                  </button>
                                  <button onClick={cancelarEdicionPlan} className="text-texto-secundario text-xs hover:underline">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="font-medium text-texto">
                                    {p.sesiones_usadas} / {p.sesiones_totales} sesiones usadas
                                    {!p.activo && (
                                      <span className="ml-2 text-xs bg-superficie-hover text-texto-secundario rounded px-1.5 py-0.5">
                                        Dado de baja
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-texto-secundario">{p.fecha_compra}</span>
                                </div>
                                <div className="flex justify-between text-texto mt-0.5">
                                  <span>{p.sesiones_restantes} restantes{p.notas ? ` — ${p.notas}` : ''}</span>
                                  <span>{p.precio ? `$${p.precio}` : '—'}</span>
                                </div>
                                {!mostrarPlanesArchivados && (
                                  <div className="mt-1 space-x-3">
                                    {!planCerrado(p) && (
                                      <button onClick={() => iniciarEdicionPlan(p)} className="text-btn-primary text-xs hover:underline">
                                        Editar
                                      </button>
                                    )}
                                    {p.activo && (
                                      <button onClick={() => darDeBajaPlan(p.id)} className="text-btn-destructive text-xs hover:underline">
                                        Dar de baja
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              )}

              {tab === 'pagos' && (
                pagosRealizados.length === 0 ? (
                  <p className="text-texto-secundario text-sm">Sin pagos registrados todavía.</p>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-texto mb-3">
                      Total pagado: <span className="text-green-700">${totalPagado.toFixed(2)}</span>
                    </p>
                    <ul className="divide-y divide-borde-suave">
                      {pagosRealizados.map((t) => (
                        <li key={t.id} className="py-2 text-sm flex justify-between">
                          <span className="text-texto">{formatearFecha(t.fecha)}</span>
                          <span className="text-texto-secundario">{t.plan ? 'Con plan' : 'Sin plan'}</span>
                          <span className="font-medium text-texto">${t.monto_cobrado}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              {tab === 'ultima_consulta' && (
                <div>
                  {!consultasCargadas && (
                    <p className="text-texto-secundario text-sm">Cargando...</p>
                  )}
                  {consultasCargadas && consultasError && (
                    <p className="text-texto-secundario text-sm">Este contenido es clínico y no está disponible para tu rol.</p>
                  )}
                  {consultasCargadas && !consultasError && !hayConsultaCompletada && (
                    <p className="text-texto-secundario text-sm">Este cliente todavía no tiene consultas registradas.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && (
                    <Link
                      to={`/consultas/${consultasCompletadas[0].id}`}
                      onClick={onClose}
                      className="block hover:bg-superficie-hover rounded p-2 -m-2"
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-texto font-medium">{consultasCompletadas[0].titulo || 'Consulta sin título'}</span>
                        <span className="text-texto-secundario text-sm">
                          {formatearFecha(consultasCompletadas[0].fecha)} — {consultasCompletadas[0].profesional_nombre}
                        </span>
                      </div>
                      {consultasCompletadas[0].notas && (
                        <p className="text-texto-secundario text-sm mt-2">{previewTexto(consultasCompletadas[0].notas)}</p>
                      )}
                    </Link>
                  )}
                </div>
              )}

              {tab === 'historial_consultas' && (
                <div>
                  {!consultasCargadas && (
                    <p className="text-texto-secundario text-sm">Cargando...</p>
                  )}
                  {consultasCargadas && consultasError && (
                    <p className="text-texto-secundario text-sm">Este contenido es clínico y no está disponible para tu rol.</p>
                  )}
                  {consultasCargadas && !consultasError && !hayConsultaCompletada && (
                    <p className="text-texto-secundario text-sm">Este cliente todavía no tiene consultas registradas.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && (
                    <ul className="divide-y divide-borde-suave">
                      {consultasCompletadas.map((c) => (
                        <li key={c.id}>
                          <Link
                            to={`/consultas/${c.id}`}
                            onClick={onClose}
                            className="flex justify-between items-center py-2 text-sm hover:bg-superficie-hover rounded px-1 -mx-1"
                          >
                            <span className="text-texto font-medium">{c.titulo || 'Consulta sin título'}</span>
                            <span className="text-texto-secundario text-right">
                              {formatearFecha(c.fecha)} — {c.profesional_nombre}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {consultasCargadas && !consultasError && puedeCargarHistorica && (
                    <div className="mt-4 pt-4 border-t border-borde-suave">
                      <button onClick={toggleFormHistorica} className="text-sm text-btn-primary hover:underline">
                        {mostrarFormHistorica ? 'Cancelar' : '+ Cargar consulta histórica'}
                      </button>

                      {mostrarFormHistorica && (
                        <form onSubmit={handleSubmitHistorica} className="mt-3 space-y-3 bg-superficie-hover rounded-lg p-3">
                          {auth.rol === 'dueño' && (
                            <div>
                              <label className="block text-xs text-input-label mb-1">Profesional</label>
                              <select
                                value={formHistorica.profesional}
                                onChange={(e) => setFormHistorica({ ...formHistorica, profesional: e.target.value })}
                                className="w-full text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                                required
                              >
                                <option value="">Seleccione un profesional</option>
                                {profesionalesOrg.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs text-input-label mb-1">Fecha</label>
                            <input
                              type="date"
                              value={formHistorica.fecha}
                              max={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => setFormHistorica({ ...formHistorica, fecha: e.target.value })}
                              className="text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-input-label mb-1">Título</label>
                            <input
                              type="text"
                              value={formHistorica.titulo}
                              onChange={(e) => setFormHistorica({ ...formHistorica, titulo: e.target.value })}
                              className="w-full text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-input-label mb-1">Notas</label>
                            <textarea
                              value={formHistorica.notas}
                              onChange={(e) => setFormHistorica({ ...formHistorica, notas: e.target.value })}
                              className="w-full text-sm border border-input-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-input-focus"
                              rows={2}
                            />
                          </div>
                          {errorHistorica && <p className="text-input-error text-xs">{errorHistorica}</p>}
                          <div className="text-right">
                            <Boton type="submit" tamaño="sm" disabled={guardandoHistorica}>
                              {guardandoHistorica ? 'Guardando...' : 'Guardar consulta histórica'}
                            </Boton>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'notas' && (
                <div>
                  <p className="text-sm text-texto whitespace-pre-wrap">
                    {cliente.historia_clinica || 'Sin datos cargados.'}
                  </p>
                  {cliente.discapacidad && (
                    <p className="text-sm text-texto mt-2">
                      <span className="font-medium">Discapacidad:</span> {cliente.discapacidad_detalle || 'Sí'}
                    </p>
                  )}
                </div>
              )}

              {tab === 'archivos' && <GestionArchivosCliente clienteId={clienteId} />}
          </>
        )}
    </Modal>
  )
}
