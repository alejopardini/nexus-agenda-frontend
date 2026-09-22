import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import { useAuth } from '../context/AuthContext'
import GestionArchivosPaciente from '../components/GestionArchivosPaciente'
import Boton from '../components/Boton'
import { formatearFecha } from '../utils/fechas'

export default function DetallePaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [motivoSolicitud, setMotivoSolicitud] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  const [colegaAInvitar, setColegaAInvitar] = useState('')
  const [motivoInvitacion, setMotivoInvitacion] = useState('')
  const [invitando, setInvitando] = useState(false)
  const [invitacionEnviada, setInvitacionEnviada] = useState(false)

  useEffect(() => {
    Promise.all([
      apiClient.get(`/pacientes/${id}/`),
      apiClient.get('/profesionales/'),
    ])
      .then(([pacienteRes, profesionalesRes]) => {
        setPaciente(pacienteRes.data)
        setProfesionales(profesionalesRes.data)
      })
      .catch(() => setError('No se pudo cargar el paciente.'))
      .finally(() => setLoading(false))

    apiClient
      .get('/consultas/')
      .then((res) => setConsultas(res.data.filter((c) => String(c.paciente) === id)))
      .catch(() => setConsultas([]))
  }, [id])

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
      <Layout titulo="Paciente">
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error || !paciente) {
    return (
      <Layout titulo="Paciente">
        <p className="text-red-600">{error || 'Paciente no encontrado.'}</p>
      </Layout>
    )
  }

  const tieneAcceso = 'email' in paciente
  const puedeAgendarTurno = auth.rol !== 'profesional' || auth.puede_crear_turnos === true
  const otrosProfesionales = profesionales.filter((p) => String(p.id) !== String(auth.profesional_id))

  return (
    <Layout titulo={`${paciente.nombre} ${paciente.apellido}`}>
      <div className="space-y-4 max-w-2xl">
        <BotonVolver to="/pacientes" className="mb-4" />

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-end items-start">
            {tieneAcceso && (
              <div className="flex flex-wrap gap-2">
                <Boton to={`/pacientes/${id}/editar`} variante="ghost" tamaño="sm">
                  Editar
                </Boton>
                {puedeAgendarTurno && (
                  <Boton variante="ghost" tamaño="sm" onClick={() => navigate(`/turnos?paciente=${id}`)}>
                    Agendar turno
                  </Boton>
                )}
              </div>
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
                        <span className="font-medium text-slate-800">{formatearFecha(c.fecha)}</span>
                        <span className="text-slate-500">{c.profesional_nombre} — {c.estado}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{c.titulo || '(sin título cargado)'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tieneAcceso && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Archivos adjuntos</h2>
            <GestionArchivosPaciente pacienteId={id} />
          </div>
        )}
      </div>
    </Layout>
  )
}