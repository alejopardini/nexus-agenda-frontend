import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import AnotadorArchivo from './AnotadorArchivo'
import ColumnaVertebral from './ColumnaVertebral'

const TABS = [
  { key: 'datos', label: 'Datos' },
  { key: 'turnos', label: 'Turnos' },
  { key: 'planes', label: 'Planes' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'ultimo_ajuste', label: 'Último ajuste' },
  { key: 'historial_ajustes', label: 'Historial de ajustes' },
  { key: 'notas', label: 'Notas / Información' },
  { key: 'archivos', label: 'Archivos' },
]

const humanizar = (valor) => (valor ? valor.replace(/_/g, ' ') : '')

function resumenUltimaConsulta(consulta, etapaCuidado, frecuenciaSeguimiento) {
  const partes = []
  if (consulta.frecuencia_dolor || consulta.dolor_promedio != null) {
    const dolor = [
      consulta.frecuencia_dolor && humanizar(consulta.frecuencia_dolor),
      consulta.dolor_promedio != null && `promedio ${consulta.dolor_promedio}/10`,
    ].filter(Boolean).join(', ')
    partes.push(`Dolor: ${dolor}.`)
  }
  if (consulta.estado_condicion) {
    partes.push(`Estado: ${humanizar(consulta.estado_condicion)}.`)
  }
  if (etapaCuidado || frecuenciaSeguimiento) {
    partes.push(`Plan: ${[etapaCuidado, frecuenciaSeguimiento].filter(Boolean).join(' — ')}.`)
  }
  return partes.join(' ')
}

export default function FichaPacienteModal({ pacienteId, onClose }) {
  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('datos')

  const [consultas, setConsultas] = useState([])
  const [consultasError, setConsultasError] = useState(false)
  const [consultasCargadas, setConsultasCargadas] = useState(false)
  const [turnos, setTurnos] = useState([])
  const [etapaCuidado, setEtapaCuidado] = useState('')
  const [frecuenciaSeguimiento, setFrecuenciaSeguimiento] = useState('')

  const [ultimoAjuste, setUltimoAjuste] = useState(null)
  const [ultimoAjusteError, setUltimoAjusteError] = useState(false)
  const ultimoAjusteFetchIniciadoRef = useRef(false)
  const [historialAjustes, setHistorialAjustes] = useState(null)
  const [historialError, setHistorialError] = useState(false)
  const historialFetchIniciadoRef = useRef(false)

  const [planes, setPlanes] = useState([])
  const [planesError, setPlanesError] = useState(false)
  const [formPlan, setFormPlan] = useState({ sesiones_totales: '', precio: '', notas: '' })
  const [guardandoPlan, setGuardandoPlan] = useState(false)
  const [errorPlan, setErrorPlan] = useState('')
  const [editandoPlanId, setEditandoPlanId] = useState(null)
  const [editPlan, setEditPlan] = useState({ sesiones_totales: '', precio: '', notas: '' })
  const [guardandoEditPlan, setGuardandoEditPlan] = useState(false)
  const [mostrarPlanesArchivados, setMostrarPlanesArchivados] = useState(false)

  const [archivos, setArchivos] = useState([])
  const [archivosError, setArchivosError] = useState(false)
  const [archivoFile, setArchivoFile] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [archivoAAnotar, setArchivoAAnotar] = useState(null)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)
  const [editandoNombreId, setEditandoNombreId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [nombreInvalido, setNombreInvalido] = useState(false)
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const inputArchivoRef = useRef(null)

  const cargarArchivos = () => {
    apiClient
      .get('/archivos/')
      .then((res) => {
        setArchivos(res.data.filter((a) => String(a.paciente) === String(pacienteId)))
        setArchivosError(false)
      })
      .catch(() => setArchivosError(true))
  }

  const cargarPlanes = () => {
    apiClient
      .get(`/planes/?paciente=${pacienteId}`)
      .then((res) => {
        setPlanes(res.data)
        setPlanesError(false)
      })
      .catch(() => setPlanesError(true))
  }

  useEffect(() => {
    let activo = true

    apiClient
      .get(`/pacientes/${pacienteId}/`)
      .then((res) => { if (activo) setPaciente(res.data) })
      .catch(() => { if (activo) setError('No se pudo cargar el paciente.') })
      .finally(() => { if (activo) setLoading(false) })

    apiClient
      .get('/consultas/')
      .then((res) => {
        if (!activo) return
        setConsultas(res.data.filter((c) => String(c.paciente) === String(pacienteId)))
      })
      .catch(() => { if (activo) setConsultasError(true) })
      .finally(() => { if (activo) setConsultasCargadas(true) })

    apiClient
      .get('/turnos/')
      .then((res) => {
        if (!activo) return
        const propios = res.data.filter((t) => String(t.paciente) === String(pacienteId))
        propios.sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
        setTurnos(propios)
      })
      .catch(() => {})

    apiClient
      .get(`/pacientes/${pacienteId}/seguimiento_quiropractico/`)
      .then((res) => {
        if (!activo || !res.data) return
        setEtapaCuidado(res.data.etapa_cuidado || '')
        setFrecuenciaSeguimiento(res.data.frecuencia || '')
      })
      .catch(() => {})

    cargarArchivos()
    cargarPlanes()

    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  const hayConsultaCompletada = consultas.some((c) => c.estado === 'completada')

  useEffect(() => {
    if (tab !== 'ultimo_ajuste' || !consultasCargadas || consultasError) return
    if (ultimoAjusteFetchIniciadoRef.current) return
    const consultaReciente = consultas.find((c) => c.estado === 'completada')
    if (!consultaReciente) return
    ultimoAjusteFetchIniciadoRef.current = true
    apiClient
      .get(`/consultas/${consultaReciente.id}/ajustes_vertebrales/`)
      .then((res) => setUltimoAjuste({ consulta: consultaReciente, ajustes: res.data }))
      .catch(() => setUltimoAjusteError(true))
  }, [tab, consultasCargadas, consultasError, consultas])

  useEffect(() => {
    if (tab !== 'historial_ajustes' || !consultasCargadas || consultasError) return
    if (historialFetchIniciadoRef.current) return
    const completadas = consultas.filter((c) => c.estado === 'completada')
    if (completadas.length === 0) return
    historialFetchIniciadoRef.current = true
    // de más vieja a más nueva, para que la más reciente sea la que pisa direccion/bloqueada al mergear
    const completadasAscendente = [...completadas].reverse()
    Promise.all(
      completadasAscendente.map((c) =>
        apiClient.get(`/consultas/${c.id}/ajustes_vertebrales/`).then((res) => res.data).catch(() => [])
      )
    )
      .then((listas) => {
        const merged = {}
        listas.forEach((ajustes) => {
          ajustes.forEach((a) => {
            const previo = merged[a.segmento] || { ajustado: false, tipo_ajuste: [], tecnica: [], direccion: null, bloqueada: false }
            merged[a.segmento] = {
              ajustado: previo.ajustado || a.ajustado,
              tipo_ajuste: Array.from(new Set([...previo.tipo_ajuste, ...(a.tipo_ajuste || [])])),
              tecnica: Array.from(new Set([...previo.tecnica, ...(a.tecnica || [])])),
              direccion: a.direccion != null ? a.direccion : previo.direccion,
              bloqueada: a.bloqueada,
            }
          })
        })
        setHistorialAjustes(merged)
      })
      .catch(() => setHistorialError(true))
  }, [tab, consultasCargadas, consultasError, consultas])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!archivoFile) return
    setSubiendo(true)
    const formData = new FormData()
    formData.append('paciente', pacienteId)
    formData.append('archivo', archivoFile)
    formData.append('nombre', archivoFile.name)
    try {
      await apiClient.post('/archivos/', formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setArchivoFile(null)
      if (inputArchivoRef.current) inputArchivoRef.current.value = ''
      cargarArchivos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo subir el archivo.'
      alert(mensaje)
    } finally {
      setSubiendo(false)
    }
  }

  const archivarArchivo = async (archivoId) => {
    try {
      await apiClient.post(`/archivos/${archivoId}/archivar/`)
      cargarArchivos()
    } catch {
      alert('No se pudo archivar el archivo.')
    }
  }

  const desarchivarArchivo = async (archivoId) => {
    try {
      await apiClient.post(`/archivos/${archivoId}/desarchivar/`)
      cargarArchivos()
    } catch {
      alert('No se pudo restaurar el archivo.')
    }
  }

  const iniciarEdicionNombre = (archivo) => {
    setEditandoNombreId(archivo.id)
    setNombreEditado(archivo.nombre)
    setNombreInvalido(false)
  }

  const cancelarEdicionNombre = () => {
    setEditandoNombreId(null)
    setNombreInvalido(false)
  }

  const guardarNombreArchivo = async (archivoId) => {
    const valor = nombreEditado.trim()
    if (!valor) {
      setNombreInvalido(true)
      return
    }
    setGuardandoNombre(true)
    try {
      const formData = new FormData()
      formData.append('nombre', valor)
      await apiClient.patch(`/archivos/${archivoId}/`, formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setEditandoNombreId(null)
      cargarArchivos()
    } catch {
      alert('No se pudo renombrar el archivo.')
    } finally {
      setGuardandoNombre(false)
    }
  }

  const eliminarArchivo = async (archivoId) => {
    if (!confirm('¿Seguro que querés eliminar este archivo? Esta acción no se puede deshacer.')) return
    if (!confirm('Confirmá de nuevo: el archivo se va a eliminar definitivamente.')) return
    try {
      await apiClient.delete(`/archivos/${archivoId}/`)
      cargarArchivos()
    } catch {
      alert('No se pudo eliminar el archivo.')
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
        paciente: pacienteId,
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

  const tieneAcceso = paciente ? 'email' in paciente : false
  const profesionalACargo = consultas[0]?.profesional_nombre || null
  const ultimaConsultaCompletada = consultas.find((c) => c.estado === 'completada')
  const resumenUltima = ultimaConsultaCompletada
    ? resumenUltimaConsulta(ultimaConsultaCompletada, etapaCuidado, frecuenciaSeguimiento)
    : ''
  const pagosRealizados = turnos.filter((t) => t.pagado)
  const totalPagado = pagosRealizados.reduce((acc, t) => acc + (Number(t.monto_cobrado) || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start p-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">
              {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Ficha del paciente'}
            </h2>
            {tieneAcceso && (
              <Link
                to={`/pacientes/${pacienteId}/editar`}
                onClick={onClose}
                className="text-xs text-blue-600 hover:underline"
              >
                Editar ficha completa
              </Link>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        {loading && <p className="p-4 text-slate-500 text-sm">Cargando...</p>}
        {!loading && error && <p className="p-4 text-red-600 text-sm">{error}</p>}

        {!loading && !error && paciente && !tieneAcceso && (
          <p className="p-4 text-sm text-slate-400">No tenés acceso a los datos de este paciente.</p>
        )}

        {!loading && !error && paciente && tieneAcceso && (
          <>
            <div className="flex flex-wrap gap-1 px-4 pt-3 border-b border-slate-100">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`text-xs px-3 py-1.5 rounded-t ${
                    tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'datos' && (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">DNI</dt>
                      <dd className="text-slate-800">{paciente.dni || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Obra social</dt>
                      <dd className="text-slate-800">{paciente.obra_social || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Email</dt>
                      <dd className="text-slate-800">{paciente.email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Celular</dt>
                      <dd className="text-slate-800">{paciente.celular || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Fecha de nacimiento</dt>
                      <dd className="text-slate-800">{paciente.fecha_nacimiento || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Profesional a cargo</dt>
                      <dd className="text-slate-800">
                        {profesionalACargo || (consultasError ? 'No disponible' : '—')}
                      </dd>
                    </div>
                  </dl>

                  {ultimaConsultaCompletada && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Última consulta</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-2">
                        <div>
                          <dt className="text-slate-500">Fecha</dt>
                          <dd className="text-slate-800">{ultimaConsultaCompletada.fecha}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Motivo</dt>
                          <dd className="text-slate-800">{ultimaConsultaCompletada.motivo || '—'}</dd>
                        </div>
                      </dl>
                      {resumenUltima && <p className="text-slate-600 text-sm">{resumenUltima}</p>}
                      <div className="text-right mt-2">
                        <Link
                          to={`/consultas/${ultimaConsultaCompletada.id}`}
                          onClick={onClose}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver consulta completa →
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === 'turnos' && (
                turnos.length === 0 ? (
                  <p className="text-slate-500 text-sm">No hay turnos registrados.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {turnos.map((t) => (
                      <li key={t.id} className="py-2 text-sm flex justify-between">
                        <span className="text-slate-800">{t.fecha} {t.hora}</span>
                        <span className="text-slate-500">{t.profesional_nombre} — {t.estado}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {tab === 'planes' && (
                planesError ? (
                  <p className="text-slate-400 text-sm">No se pudieron cargar los planes.</p>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setMostrarPlanesArchivados(!mostrarPlanesArchivados)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {mostrarPlanesArchivados ? 'Ver planes activos' : 'Ver archivados'}
                    </button>

                    {!mostrarPlanesArchivados && (
                    <form onSubmit={handleSubmitPlan} className="flex flex-wrap gap-2 items-end bg-slate-50 rounded p-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Sesiones</label>
                        <input
                          type="number"
                          min="1"
                          value={formPlan.sesiones_totales}
                          onChange={(e) => setFormPlan({ ...formPlan, sesiones_totales: e.target.value })}
                          className="w-24 text-sm border border-slate-300 rounded px-2 py-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Precio</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPlan.precio}
                          onChange={(e) => setFormPlan({ ...formPlan, precio: e.target.value })}
                          className="w-28 text-sm border border-slate-300 rounded px-2 py-1.5"
                          required
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs text-slate-500 mb-1">Notas (opcional)</label>
                        <input
                          type="text"
                          value={formPlan.notas}
                          onChange={(e) => setFormPlan({ ...formPlan, notas: e.target.value })}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={guardandoPlan}
                        className="bg-blue-600 text-white text-sm rounded px-4 py-1.5 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {guardandoPlan ? 'Guardando...' : '+ Agregar plan'}
                      </button>
                      {errorPlan && <p className="text-red-600 text-xs w-full">{errorPlan}</p>}
                    </form>
                    )}

                    {planes.filter((p) => planCerrado(p) === mostrarPlanesArchivados).length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        {mostrarPlanesArchivados ? 'No hay planes archivados.' : 'No hay planes activos cargados todavía.'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {planes.filter((p) => planCerrado(p) === mostrarPlanesArchivados).map((p) => (
                          <li key={p.id} className={`py-2 text-sm ${p.activo ? '' : 'opacity-50'}`}>
                            {editandoPlanId === p.id ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 items-end">
                                  <div>
                                    <label className="block text-xs text-slate-500 mb-1">Sesiones</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={editPlan.sesiones_totales}
                                      onChange={(e) => setEditPlan({ ...editPlan, sesiones_totales: e.target.value })}
                                      className="w-24 text-sm border border-slate-300 rounded px-2 py-1.5"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-500 mb-1">Precio</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editPlan.precio}
                                      onChange={(e) => setEditPlan({ ...editPlan, precio: e.target.value })}
                                      className="w-28 text-sm border border-slate-300 rounded px-2 py-1.5"
                                      required
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs text-slate-500 mb-1">Notas</label>
                                    <input
                                      type="text"
                                      value={editPlan.notas}
                                      onChange={(e) => setEditPlan({ ...editPlan, notas: e.target.value })}
                                      className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                                    />
                                  </div>
                                </div>
                                <div className="space-x-3">
                                  <button
                                    onClick={() => guardarEdicionPlan(p.id)}
                                    disabled={guardandoEditPlan}
                                    className="text-green-600 text-xs hover:underline disabled:opacity-50"
                                  >
                                    Guardar
                                  </button>
                                  <button onClick={cancelarEdicionPlan} className="text-slate-500 text-xs hover:underline">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="font-medium text-slate-800">
                                    {p.sesiones_usadas} / {p.sesiones_totales} sesiones usadas
                                    {!p.activo && (
                                      <span className="ml-2 text-xs bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                                        Dado de baja
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-slate-500">{p.fecha_compra}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 mt-0.5">
                                  <span>{p.sesiones_restantes} restantes{p.notas ? ` — ${p.notas}` : ''}</span>
                                  <span>{p.precio ? `$${p.precio}` : '—'}</span>
                                </div>
                                {!mostrarPlanesArchivados && (
                                  <div className="mt-1 space-x-3">
                                    {!planCerrado(p) && (
                                      <button onClick={() => iniciarEdicionPlan(p)} className="text-blue-600 text-xs hover:underline">
                                        Editar
                                      </button>
                                    )}
                                    {p.activo && (
                                      <button onClick={() => darDeBajaPlan(p.id)} className="text-red-600 text-xs hover:underline">
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
                  <p className="text-slate-500 text-sm">Sin pagos registrados todavía.</p>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-3">
                      Total pagado: <span className="text-green-700">${totalPagado.toFixed(2)}</span>
                    </p>
                    <ul className="divide-y divide-slate-100">
                      {pagosRealizados.map((t) => (
                        <li key={t.id} className="py-2 text-sm flex justify-between">
                          <span className="text-slate-800">{t.fecha}</span>
                          <span className="text-slate-600">{t.plan ? 'Con plan' : 'Sin plan'}</span>
                          <span className="font-medium text-slate-800">${t.monto_cobrado}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              {tab === 'ultimo_ajuste' && (
                <div>
                  {!consultasCargadas && (
                    <p className="text-slate-500 text-sm">Cargando...</p>
                  )}
                  {consultasCargadas && consultasError && (
                    <p className="text-slate-400 text-sm">Este contenido es clínico y no está disponible para tu rol.</p>
                  )}
                  {consultasCargadas && !consultasError && !hayConsultaCompletada && (
                    <p className="text-slate-500 text-sm">Este paciente todavía no tiene consultas completadas.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && ultimoAjusteError && (
                    <p className="text-red-600 text-sm">No se pudo cargar el último ajuste.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && !ultimoAjusteError && !ultimoAjuste && (
                    <p className="text-slate-500 text-sm">Cargando...</p>
                  )}
                  {ultimoAjuste && (
                    ultimoAjuste.ajustes.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        La consulta del {ultimoAjuste.consulta.fecha} no tiene ajustes vertebrales cargados.
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">
                          Consulta del {ultimoAjuste.consulta.fecha} — {ultimoAjuste.consulta.profesional_nombre}
                        </p>
                        <ul className="divide-y divide-slate-100">
                          {ultimoAjuste.ajustes.map((a) => (
                            <li key={a.id} className="py-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-800">{a.segmento}</span>
                                <span className={a.bloqueada ? 'text-red-600' : 'text-slate-500'}>
                                  {a.bloqueada ? 'Bloqueada' : a.ajustado ? 'Ajustado' : 'Sin ajustar'}
                                </span>
                              </div>
                              {(a.tipo_ajuste?.length > 0 || a.tecnica?.length > 0 || a.direccion) && (
                                <p className="text-slate-600 text-xs mt-0.5">
                                  {[a.tipo_ajuste?.join(', '), a.tecnica?.join(', '), a.direccion]
                                    .filter(Boolean)
                                    .join(' — ')}
                                </p>
                              )}
                              {a.notas && <p className="text-slate-500 text-xs mt-0.5 italic">{a.notas}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              )}

              {tab === 'historial_ajustes' && (
                <div>
                  {!consultasCargadas && (
                    <p className="text-slate-500 text-sm">Cargando...</p>
                  )}
                  {consultasCargadas && consultasError && (
                    <p className="text-slate-400 text-sm">Este contenido es clínico y no está disponible para tu rol.</p>
                  )}
                  {consultasCargadas && !consultasError && !hayConsultaCompletada && (
                    <p className="text-slate-500 text-sm">Este paciente todavía no tiene consultas completadas.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && historialError && (
                    <p className="text-red-600 text-sm">No se pudo cargar el historial de ajustes.</p>
                  )}
                  {consultasCargadas && !consultasError && hayConsultaCompletada && !historialError && !historialAjustes && (
                    <p className="text-slate-500 text-sm">Cargando...</p>
                  )}
                  {historialAjustes && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        Segmentos ajustados alguna vez, acumulado de todas las consultas completadas.
                        La dirección y el estado de bloqueo reflejan la consulta más reciente.
                      </p>
                      <ColumnaVertebral ajustes={historialAjustes} segmentoActivo={null} onClickSegmento={() => {}} />
                    </div>
                  )}
                </div>
              )}

              {tab === 'notas' && (
                <div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {paciente.historia_clinica || 'Sin datos cargados.'}
                  </p>
                  {paciente.discapacidad && (
                    <p className="text-sm text-slate-800 mt-2">
                      <span className="font-medium">Discapacidad:</span> {paciente.discapacidad_detalle || 'Sí'}
                    </p>
                  )}
                </div>
              )}

              {tab === 'archivos' && (
                archivosError ? (
                  <p className="text-slate-400 text-sm">
                    Este contenido es clínico y no está disponible para tu rol.
                  </p>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <button
                        onClick={() => setMostrarArchivados(!mostrarArchivados)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {mostrarArchivados ? 'Ver archivos activos' : 'Ver archivados'}
                      </button>
                    </div>

                    {!mostrarArchivados && (
                      <form onSubmit={handleUpload} className="flex gap-2 mb-4">
                        <input
                          type="file"
                          ref={inputArchivoRef}
                          onChange={(e) => setArchivoFile(e.target.files[0])}
                          className="flex-1 text-sm border border-slate-300 rounded px-3 py-2"
                        />
                        <button
                          type="submit"
                          disabled={!archivoFile || subiendo}
                          className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {subiendo ? 'Subiendo...' : 'Subir'}
                        </button>
                      </form>
                    )}

                    {archivos.filter((a) => Boolean(a.archivado) === mostrarArchivados).length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        {mostrarArchivados ? 'No hay archivos archivados.' : 'No hay archivos subidos todavía.'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {archivos.filter((a) => Boolean(a.archivado) === mostrarArchivados).map((a) => {
                          const esImagen = /\.(png|jpe?g|gif|webp)$/i.test(a.archivo)
                          return (
                            <li key={a.id} className="py-2 text-sm flex justify-between items-center">
                              {editandoNombreId === a.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={nombreEditado}
                                    disabled={guardandoNombre}
                                    onChange={(e) => {
                                      setNombreEditado(e.target.value)
                                      setNombreInvalido(false)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') guardarNombreArchivo(a.id)
                                      if (e.key === 'Escape') cancelarEdicionNombre()
                                    }}
                                    className={`text-sm border rounded px-2 py-1 ${
                                      nombreInvalido ? 'border-red-500' : 'border-slate-300'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => guardarNombreArchivo(a.id)}
                                    disabled={guardandoNombre}
                                    className="text-green-600 hover:text-green-700 text-xs px-1 disabled:opacity-50"
                                    title="Guardar"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelarEdicionNombre}
                                    disabled={guardandoNombre}
                                    className="text-slate-400 hover:text-red-600 text-xs px-1 disabled:opacity-50"
                                    title="Cancelar"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <a href={a.archivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {a.nombre}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicionNombre(a)}
                                    className="text-slate-400 hover:text-blue-600 text-xs"
                                    title="Renombrar"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                {!mostrarArchivados && esImagen && (
                                  <button
                                    onClick={() => setArchivoAAnotar(a)}
                                    className="text-slate-500 text-xs hover:text-blue-600 hover:underline"
                                  >
                                    ✏️ Anotar
                                  </button>
                                )}
                                {!mostrarArchivados && (
                                  <button
                                    onClick={() => archivarArchivo(a.id)}
                                    className="text-slate-500 text-xs hover:text-amber-600 hover:underline"
                                  >
                                    Archivar
                                  </button>
                                )}
                                {mostrarArchivados && (
                                  <>
                                    <button
                                      onClick={() => desarchivarArchivo(a.id)}
                                      className="text-slate-500 text-xs hover:text-green-600 hover:underline"
                                    >
                                      Restaurar
                                    </button>
                                    <button
                                      onClick={() => eliminarArchivo(a.id)}
                                      className="text-slate-500 text-xs hover:text-red-600 hover:underline"
                                    >
                                      Eliminar
                                    </button>
                                  </>
                                )}
                                <span className="text-slate-400 text-xs">
                                  {new Date(a.fecha_subida).toLocaleDateString()}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {archivoAAnotar && (
        <AnotadorArchivo
          archivo={archivoAAnotar}
          pacienteId={pacienteId}
          onClose={() => setArchivoAAnotar(null)}
          onGuardado={cargarArchivos}
        />
      )}
    </div>
  )
}
