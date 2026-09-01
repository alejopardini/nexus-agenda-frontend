import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import FichaCamillaModal from '../components/FichaCamillaModal'
import ColumnaVertebralMini from '../components/ColumnaVertebralMini'
import BuscadorPaciente from '../components/BuscadorPaciente'
import NuevoPacienteModal from '../components/NuevoPacienteModal'
import { useAuth } from '../context/AuthContext'
import PanelFranjasHorarias from '../components/PanelFranjasHorarias'

function calcularEnCamillaPorProfesional(turnosConfirmadosHoy) {
  const porProfesional = {}
  turnosConfirmadosHoy.forEach((t) => {
    if (!porProfesional[t.profesional]) porProfesional[t.profesional] = []
    porProfesional[t.profesional].push(t)
  })
  const resultado = {}
  Object.entries(porProfesional).forEach(([profId, lista]) => {
    const pendientes = lista.filter((t) => t.consulta_pendiente_id)
    const ordenados = [...pendientes].sort((a, b) => a.hora.localeCompare(b.hora))
    const llamados = ordenados.filter((t) => t.hora_llamado)
    const enCamilla = llamados.length > 0
      ? llamados.reduce((mas, actual) => (new Date(actual.hora_llamado) > new Date(mas.hora_llamado) ? actual : mas))
      : null
    resultado[profId] = {
      enCamilla,
      proximos: ordenados.filter((t) => t.id !== enCamilla?.id),
    }
  })
  return resultado
}

export default function Camillas() {
  const { auth } = useAuth()
  const [turnosHoy, setTurnosHoy] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [excepciones, setExcepciones] = useState([])
  const [cierres, setCierres] = useState([])
  const [consultas, setConsultas] = useState([])
  const [ajustesPorConsultaId, setAjustesPorConsultaId] = useState({})
  const [pacientes, setPacientes] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)
  const [consultaCamillaAbiertaId, setConsultaCamillaAbiertaId] = useState(null)
  const [walkInProfesionalId, setWalkInProfesionalId] = useState(null)
  const [walkInPaciente, setWalkInPaciente] = useState('')
  const [walkInSucursal, setWalkInSucursal] = useState('')
  const [walkInError, setWalkInError] = useState('')
  const [walkInGuardando, setWalkInGuardando] = useState(false)
  const [walkInPlanDisponible, setWalkInPlanDisponible] = useState(null)
  const [walkInPrecio, setWalkInPrecio] = useState('')
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  const cargarDatos = () => {
    return Promise.all([
      apiClient.get('/turnos/'),
      apiClient.get('/profesionales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/excepciones/'),
      apiClient.get('/cierres/'),
      apiClient.get('/consultas/'),
      apiClient.get('/pacientes/'),
      apiClient.get('/sucursales/'),
    ])
      .then(([turnosRes, profesionalesRes, disponibilidadRes, excepcionesRes, cierresRes, consultasRes, pacientesRes, sucursalesRes]) => {
        setTurnosHoy(turnosRes.data.filter((t) => t.fecha === hoy && t.estado !== 'cancelado'))
        setProfesionales(profesionalesRes.data)
        setDisponibilidad(disponibilidadRes.data)
        setExcepciones(excepcionesRes.data)
        setCierres(cierresRes.data)
        setConsultas(consultasRes.data)
        setPacientes(pacientesRes.data)
        setSucursales(sucursalesRes.data)
      })
      .catch(() => setError('No se pudieron cargar los datos de camillas.'))
  }

  useEffect(() => {
    cargarDatos().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const llamar = async (turnoId) => {
    try {
      await apiClient.post(`/turnos/${turnoId}/llamar/`)
      cargarDatos()
    } catch {
      alert('No se pudo llamar al paciente.')
    }
  }

  const sacarDeCamilla = async (turnoId) => {
    try {
      await apiClient.post(`/turnos/${turnoId}/sacar_de_camilla/`)
      cargarDatos()
    } catch {
      alert('No se pudo sacar de camilla.')
    }
  }

  const abrirWalkIn = (profId) => {
    setWalkInProfesionalId(profId)
    setWalkInPaciente('')
    setWalkInSucursal(sucursales[0]?.id || '')
    setWalkInError('')
    setWalkInPlanDisponible(null)
    setWalkInPrecio('')
  }

  useEffect(() => {
    setWalkInPrecio('')
    if (!walkInPaciente) {
      setWalkInPlanDisponible(null)
      return
    }
    setWalkInPlanDisponible(null)
    apiClient
      .get(`/planes/?paciente=${walkInPaciente}`)
      .then((res) => {
        const tienePlan = res.data.some((p) => p.activo && p.sesiones_usadas < p.sesiones_totales)
        setWalkInPlanDisponible(tienePlan)
      })
      .catch(() => setWalkInPlanDisponible(false))
  }, [walkInPaciente])

  const confirmarWalkIn = async () => {
    if (!walkInPaciente) {
      setWalkInError('Elegí un paciente.')
      return
    }
    if (walkInPlanDisponible === false && !walkInPrecio) {
      setWalkInError('Ingresá el precio de este turno.')
      return
    }
    setWalkInGuardando(true)
    setWalkInError('')
    try {
      const payload = {
        paciente: walkInPaciente,
        profesional: walkInProfesionalId,
        sucursal: walkInSucursal,
      }
      if (walkInPlanDisponible === false) {
        payload.monto_cobrado = walkInPrecio
      }
      await apiClient.post('/turnos/walk_in/', payload)
      setWalkInProfesionalId(null)
      cargarDatos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo agregar el turno.'
      setWalkInError(mensaje)
    } finally {
      setWalkInGuardando(false)
    }
  }

  useEffect(() => {
    const turnosConfirmados = turnosHoy.filter((t) => t.estado === 'confirmado')
    const porProfesional = calcularEnCamillaPorProfesional(turnosConfirmados)
    const idsPacienteEnCamilla = new Set(
      Object.values(porProfesional).map((v) => v.enCamilla?.paciente).filter(Boolean)
    )

    const idsConsultaAPedir = []
    idsPacienteEnCamilla.forEach((pacId) => {
      const consultaReciente = consultas.find(
        (c) => String(c.paciente) === String(pacId) && c.estado === 'completada'
      )
      if (consultaReciente && !(consultaReciente.id in ajustesPorConsultaId)) {
        idsConsultaAPedir.push(consultaReciente.id)
      }
    })

    if (idsConsultaAPedir.length === 0) return

    Promise.all(
      idsConsultaAPedir.map((id) =>
        apiClient.get(`/consultas/${id}/ajustes_vertebrales/`).then((res) => [id, res.data]).catch(() => [id, []])
      )
    ).then((resultados) => {
      setAjustesPorConsultaId((prev) => {
        const nuevo = { ...prev }
        resultados.forEach(([id, data]) => { nuevo[id] = data })
        return nuevo
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnosHoy, consultas])

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    )
  }

  const profesionalesPorId = {}
  profesionales.forEach((p) => { profesionalesPorId[p.id] = p })

  const walkInPacienteSeleccionado = pacientes.find((p) => String(p.id) === String(walkInPaciente))

  const turnosConfirmadosHoy = turnosHoy.filter((t) => t.estado === 'confirmado')
  const enCamillaPorProfesional = calcularEnCamillaPorProfesional(turnosConfirmadosHoy)

  const idsAMostrar = auth.rol === 'profesional'
    ? (auth.profesional_id ? [auth.profesional_id] : [])
    : [...profesionales]
        .sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
        .map((p) => p.id)

  const tarjetas = idsAMostrar.map((profId) => {
    const { enCamilla, proximos } = enCamillaPorProfesional[profId] || { enCamilla: null, proximos: [] }

    let ultimoAjusteMapa = null
    let tieneConsultaCompletada = false
    if (enCamilla) {
      const consultaReciente = consultas.find(
        (c) => String(c.paciente) === String(enCamilla.paciente) && c.estado === 'completada'
      )
      tieneConsultaCompletada = Boolean(consultaReciente)
      const ajustesArray = consultaReciente ? ajustesPorConsultaId[consultaReciente.id] : null
      if (ajustesArray && ajustesArray.length > 0) {
        ultimoAjusteMapa = {}
        ajustesArray.forEach((a) => { ultimoAjusteMapa[a.segmento] = a })
      }
    }

    return { profesionalId: profId, profesional: profesionalesPorId[profId], enCamilla, proximos, ultimoAjusteMapa, tieneConsultaCompletada }
  })

  const idsRelevantesPanel = auth.rol === 'profesional'
    ? (auth.profesional_id ? [auth.profesional_id] : [])
    : profesionales.map((p) => p.id)

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Camillas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div>
          {tarjetas.length === 0 ? (
            <p className="text-slate-500">No hay profesionales cargados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tarjetas.map((t) => (
                <div key={t.profesionalId} className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="font-bold text-slate-800 mb-3">
                    {t.profesional ? `${t.profesional.nombre} ${t.profesional.apellido}` : 'Profesional'}
                  </h2>
                  {auth.rol !== 'profesional' && (
                    <button
                      onClick={() => abrirWalkIn(t.profesionalId)}
                      className="text-xs text-blue-600 hover:underline mb-3 -mt-2 block"
                    >
                      + Agregar sin turno
                    </button>
                  )}

                  {t.enCamilla ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-600 font-semibold uppercase mb-1">En camilla ahora</p>
                        <p className="font-medium text-slate-800 text-sm">{t.enCamilla.paciente_nombre}</p>
                        <p className="text-xs text-slate-500 mb-2">{t.enCamilla.hora}</p>
                        <div className="space-x-2">
                          <button
                            onClick={() => setConsultaCamillaAbiertaId(t.enCamilla.consulta_pendiente_id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver ficha
                          </button>
                          <Link to={`/consultas/${t.enCamilla.consulta_pendiente_id}`} className="text-xs text-blue-600 hover:underline">
                            Ir a la consulta
                          </Link>
                          <button
                            onClick={() => sacarDeCamilla(t.enCamilla.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Sacar de camilla
                          </button>
                        </div>
                        {t.ultimoAjusteMapa && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <p className="text-[10px] text-blue-500 uppercase mb-1">Último ajuste</p>
                            <ColumnaVertebralMini ajustes={t.ultimoAjusteMapa} />
                          </div>
                        )}
                        {!t.ultimoAjusteMapa && !t.tieneConsultaCompletada && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <p className="text-[10px] text-slate-400 italic">Sin historial previo.</p>
                          </div>
                        )}
                      </div>
                      {[0, 1, 2].map((i) => {
                        const turno = t.proximos[i]
                        return turno ? (
                          <div key={turno.id} className="bg-slate-50 border border-slate-200 rounded p-3">
                            <p className="text-sm font-medium text-slate-700">{turno.paciente_nombre}</p>
                            <p className="text-xs text-slate-500 mb-1">{turno.hora}</p>
                            <div className="space-x-2">
                              <button
                                onClick={() => setPacienteAbiertoId(turno.paciente)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Ver ficha
                              </button>
                              <button
                                onClick={() => llamar(turno.id)}
                                className="text-xs text-green-600 hover:underline"
                              >
                                Llamar
                              </button>
                            </div>
                          </div>
                        ) : auth.rol !== 'profesional' ? (
                          <button
                            key={`vacio-${i}`}
                            onClick={() => abrirWalkIn(t.profesionalId)}
                            title="Agregar sin turno"
                            className="border border-dashed border-slate-200 rounded p-3 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 text-lg font-medium min-h-[76px] transition-colors"
                          >
                            +
                          </button>
                        ) : (
                          <div
                            key={`vacio-${i}`}
                            className="border border-dashed border-slate-200 rounded p-3 flex items-center justify-center text-slate-300 text-sm min-h-[76px]"
                          >
                            —
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Sin pacientes en camilla por ahora.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <PanelFranjasHorarias
          titulo="Próximos pacientes hoy"
          fecha={new Date()}
          idsRelevantes={idsRelevantesPanel}
          disponibilidad={disponibilidad}
          excepciones={excepciones}
          cierres={cierres}
          turnos={turnosHoy}
          mostrarProfesional={auth.rol !== 'profesional'}
        />
      </div>

      {pacienteAbiertoId && (
        <FichaPacienteModal pacienteId={pacienteAbiertoId} onClose={() => setPacienteAbiertoId(null)} />
      )}

      {consultaCamillaAbiertaId && (
        <FichaCamillaModal
          consultaId={consultaCamillaAbiertaId}
          onClose={() => setConsultaCamillaAbiertaId(null)}
        />
      )}

      {walkInProfesionalId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-bold text-slate-800 text-lg">Agregar sin turno</h2>
              <button onClick={() => setWalkInProfesionalId(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              {profesionalesPorId[walkInProfesionalId]
                ? `${profesionalesPorId[walkInProfesionalId].nombre} ${profesionalesPorId[walkInProfesionalId].apellido}`
                : ''}
            </p>

            {walkInError && <p className="text-red-600 text-sm mb-3">{walkInError}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Paciente</label>
                <BuscadorPaciente
                  pacientes={pacientes}
                  value={walkInPaciente}
                  onChange={setWalkInPaciente}
                  onNuevoPaciente={() => setModalNuevoPacienteAbierto(true)}
                />
                {walkInPlanDisponible === true && (
                  <p className="text-xs text-slate-500 mt-1">
                    Este turno va a descontar una sesión del plan activo de {walkInPacienteSeleccionado?.nombre} {walkInPacienteSeleccionado?.apellido}.
                  </p>
                )}
                {walkInPlanDisponible === false && (
                  <div className="mt-2">
                    <label className="block text-sm text-slate-600 mb-1">Precio de este turno</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={walkInPrecio}
                      onChange={(e) => setWalkInPrecio(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                )}
              </div>

              {sucursales.length > 1 && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
                  <select
                    value={walkInSucursal}
                    onChange={(e) => setWalkInSucursal(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={confirmarWalkIn}
                disabled={walkInGuardando}
                className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {walkInGuardando ? 'Agregando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNuevoPacienteAbierto && (
        <NuevoPacienteModal
          onClose={() => setModalNuevoPacienteAbierto(false)}
          onCreado={(p) => {
            setPacientes((prev) => [...prev, p])
            setWalkInPaciente(p.id)
          }}
        />
      )}
    </Layout>
  )
}
