import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import { useAuth } from '../context/AuthContext'
import AnotadorArchivo from '../components/AnotadorArchivo'
import Boton from '../components/Boton'

export default function DetallePaciente() {
  const { id } = useParams()
  const { auth } = useAuth()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [archivos, setArchivos] = useState([])
  const [seguimiento, setSeguimiento] = useState({ etapa_cuidado: '', frecuencia: '' })
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivoFile, setArchivoFile] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [guardandoSeguimiento, setGuardandoSeguimiento] = useState(false)
  const [archivoAAnotar, setArchivoAAnotar] = useState(null)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)
  const [editandoNombreId, setEditandoNombreId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [nombreInvalido, setNombreInvalido] = useState(false)
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [motivoSolicitud, setMotivoSolicitud] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  const [colegaAInvitar, setColegaAInvitar] = useState('')
  const [motivoInvitacion, setMotivoInvitacion] = useState('')
  const [invitando, setInvitando] = useState(false)
  const [invitacionEnviada, setInvitacionEnviada] = useState(false)

  const cargarArchivos = () => {
    apiClient
      .get('/archivos/')
      .then((res) => setArchivos(res.data.filter((a) => String(a.paciente) === id)))
      .catch(() => { })
  }

  useEffect(() => {
    Promise.all([
      apiClient.get(`/pacientes/${id}/`),
      apiClient.get(`/pacientes/${id}/seguimiento_quiropractico/`),
      apiClient.get('/profesionales/'),
    ])
      .then(([pacienteRes, seguimientoRes, profesionalesRes]) => {
        setPaciente(pacienteRes.data)
        if (seguimientoRes.data) {
          setSeguimiento({
            etapa_cuidado: seguimientoRes.data.etapa_cuidado || '',
            frecuencia: seguimientoRes.data.frecuencia || '',
          })
        }
        setProfesionales(profesionalesRes.data)
      })
      .catch(() => setError('No se pudo cargar el paciente.'))
      .finally(() => setLoading(false))

    apiClient
      .get('/consultas/')
      .then((res) => setConsultas(res.data.filter((c) => String(c.paciente) === id)))
      .catch(() => setConsultas([]))

    cargarArchivos()
  }, [id])

  const inputArchivoRef = useRef(null)
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!archivoFile) return
    setSubiendo(true)
    const formData = new FormData()
    formData.append('paciente', id)
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

  const guardarSeguimiento = async () => {
    setGuardandoSeguimiento(true)
    try {
      await apiClient.post(`/pacientes/${id}/seguimiento_quiropractico/`, seguimiento)
    } catch {
      alert('No se pudo guardar el seguimiento.')
    } finally {
      setGuardandoSeguimiento(false)
    }
  }

  const solicitarAcceso = async (e) => {
    e.preventDefault()
    setEnviandoSolicitud(true)
    try {
      await apiClient.post('/interconsultas/', { paciente: id, motivo: motivoSolicitud })
      setSolicitudEnviada(true)
    } catch {
      alert('No se pudo enviar la solicitud.')
    } finally {
      setEnviandoSolicitud(false)
    }
  }

  const invitarColega = async (e) => {
    e.preventDefault()
    if (!colegaAInvitar) return
    setInvitando(true)
    try {
      await apiClient.post('/interconsultas/invitar/', {
        paciente: id, colega: colegaAInvitar, motivo: motivoInvitacion,
      })
      setInvitacionEnviada(true)
      setColegaAInvitar('')
      setMotivoInvitacion('')
    } catch (err) {
      alert(err.response?.data?.detail || 'No se pudo invitar al colega.')
    } finally {
      setInvitando(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error || !paciente) {
    return (
      <Layout>
        <p className="text-red-600">{error || 'Paciente no encontrado.'}</p>
      </Layout>
    )
  }

  const tieneAcceso = 'email' in paciente
  const otrosProfesionales = profesionales.filter((p) => String(p.id) !== String(auth.profesional_id))

  return (
    <Layout>
      <div className="space-y-4 max-w-2xl">
        <BotonVolver to="/pacientes" />

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-slate-800">
              {paciente.nombre} {paciente.apellido}
            </h1>
            {tieneAcceso && (
              <Link to={`/pacientes/${id}/editar`} className="text-sm text-blue-600 hover:underline">
                Editar
              </Link>
            )}
          </div>

          {!tieneAcceso && auth.rol === 'profesional' && (
            <div className="mt-3">
              {solicitudEnviada ? (
                <p className="text-sm text-green-600">Solicitud enviada. Te van a avisar cuando la resuelvan.</p>
              ) : (
                <form onSubmit={solicitarAcceso} className="space-y-2">
                  <p className="text-sm text-slate-500">
                    No tenés acceso a los datos de este paciente.
                  </p>
                  <input
                    type="text"
                    placeholder="Motivo de la interconsulta (opcional)"
                    value={motivoSolicitud}
                    onChange={(e) => setMotivoSolicitud(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded px-3 py-2"
                  />
                  <Boton type="submit" variante="primary" disabled={enviandoSolicitud}>
                    {enviandoSolicitud ? 'Enviando...' : 'Solicitar acceso'}
                  </Boton>
                </form>
              )}
            </div>
          )}

          {!tieneAcceso && auth.rol !== 'profesional' && (
            <p className="text-sm text-slate-400 mt-2">No tenés acceso a los datos de este paciente.</p>
          )}

          {tieneAcceso && (
            <>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                  <dt className="text-slate-500">Última consulta</dt>
                  <dd className="text-slate-800">{paciente.ultima_consulta || '—'}</dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <h2 className="text-sm font-semibold text-slate-600 mb-1">Historia clínica</h2>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {paciente.historia_clinica || 'Sin datos cargados.'}
                </p>
                {paciente.discapacidad && (
                  <p className="text-sm text-slate-800 mt-2">
                    <span className="font-medium">Discapacidad:</span> {paciente.discapacidad_detalle || 'Sí'}
                  </p>
                )}
              </div>

              {auth.rol === 'profesional' && otrosProfesionales.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-600 mb-2">Invitar a un colega</h2>
                  {invitacionEnviada && (
                    <p className="text-sm text-green-600 mb-2">Invitación enviada y aprobada.</p>
                  )}
                  <form onSubmit={invitarColega} className="space-y-2">
                    <select
                      value={colegaAInvitar}
                      onChange={(e) => setColegaAInvitar(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2"
                      required
                    >
                      <option value="">Seleccioná un profesional</option>
                      {otrosProfesionales.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Motivo (opcional)"
                      value={motivoInvitacion}
                      onChange={(e) => setMotivoInvitacion(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2"
                    />
                    <button
                      type="submit"
                      disabled={invitando}
                      className="bg-slate-700 text-white text-sm rounded px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
                    >
                      {invitando ? 'Invitando...' : 'Invitar'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {tieneAcceso && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Seguimiento quiropráctico</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Etapa de cuidado</label>
                <select
                  value={seguimiento.etapa_cuidado}
                  onChange={(e) => setSeguimiento({ ...seguimiento, etapa_cuidado: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">Sin definir</option>
                  <option value="aguda">Aguda</option>
                  <option value="moderada">Moderada</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Frecuencia recomendada</label>
                <input
                  type="text"
                  placeholder="Ej: 1 vez por semana"
                  value={seguimiento.frecuencia}
                  onChange={(e) => setSeguimiento({ ...seguimiento, frecuencia: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <Boton variante="primary" onClick={guardarSeguimiento} disabled={guardandoSeguimiento}>
                {guardandoSeguimiento ? 'Guardando...' : 'Guardar'}
              </Boton>
            </div>
          </div>
        )}

        {tieneAcceso && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Consultas</h2>
            {consultas.length === 0 ? (
              auth.rol === 'secretaria' ? (
                <p className="text-slate-400 text-sm">No disponible para tu rol.</p>
              ) : (
                <p className="text-slate-500 text-sm">
                  No hay consultas todavía — se generan automáticamente al confirmar un turno.
                </p>
              )
            ) : (
              <ul className="divide-y divide-slate-100">
                {consultas.map((c) => (
                  <li key={c.id} className="py-2 text-sm">
                    <Link to={`/consultas/${c.id}`} className="block hover:text-blue-600">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">{c.fecha}</span>
                        <span className="text-slate-500">{c.profesional_nombre} — {c.estado}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{c.motivo || '(sin motivo cargado)'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tieneAcceso && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-800">Archivos adjuntos</h2>
              <button
                onClick={() => setMostrarArchivados(!mostrarArchivados)}
                className="text-sm text-blue-600 hover:underline"
              >
                {mostrarArchivados ? 'Ver archivos activos' : 'Ver archivados'}
              </button>
            </div>

            {!mostrarArchivados && (
              <form onSubmit={handleUpload} className="flex gap-2 mb-4">
                <label
                  htmlFor="archivo-input-detalle-paciente"
                  className="flex-1 text-sm border border-slate-300 rounded px-3 py-2 text-slate-600 truncate cursor-pointer hover:bg-slate-50"
                >
                  {archivoFile ? archivoFile.name : 'Elegir archivo...'}
                </label>
                <input
                  id="archivo-input-detalle-paciente"
                  type="file"
                  ref={inputArchivoRef}
                  onChange={(e) => setArchivoFile(e.target.files[0])}
                  className="sr-only"
                />
                <Boton type="submit" variante="primary" disabled={!archivoFile || subiendo}>
                  {subiendo ? 'Subiendo...' : 'Subir'}
                </Boton>
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
        )}
      </div>
      {archivoAAnotar && (
        <AnotadorArchivo
          archivo={archivoAAnotar}
          pacienteId={id}
          onClose={() => setArchivoAAnotar(null)}
          onGuardado={cargarArchivos}
        />
      )}
    </Layout>
  )
}