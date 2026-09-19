import { useEffect, useState } from 'react'
import { X, LogIn, LogOut, User, Search, Plus, Check } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import PanelCamillaCondensado from '../components/PanelCamillaCondensado'
import ColumnaVertebralMini from '../components/ColumnaVertebralMini'
import BuscadorPaciente from '../components/BuscadorPaciente'
import NuevoPacienteModal from '../components/NuevoPacienteModal'
import { useAuth } from '../context/AuthContext'
import { useSucursalActiva } from '../context/SucursalActivaContext'
import PanelFranjasHorarias from '../components/PanelFranjasHorarias'
import SelectorPlantillaPlan from '../components/SelectorPlantillaPlan'
import Badge from '../components/Badge'
import Card, { CardTextoSecundario } from '../components/Card'
import Modal from '../components/Modal'
import Boton from '../components/Boton'
import BotonIcono from '../components/BotonIcono'
import Tooltip from '../components/Tooltip'
import { fechaToStr, formatearHora } from '../utils/fechas'
import { buscarConsultaCompletadaPrevia } from '../utils/consultas'
import { useEsVerticalQuiro } from '../hooks/useVertical'

function calcularEnCamillaPorProfesional(turnosBase) {
  const porProfesional = {}
  turnosBase.forEach((t) => {
    if (!porProfesional[t.profesional]) porProfesional[t.profesional] = []
    porProfesional[t.profesional].push(t)
  })
  const resultado = {}
  Object.entries(porProfesional).forEach(([profId, lista]) => {
    // Pendientes (sin confirmar) siempre entran a la cola: todavía no generaron consulta.
    // Confirmados solo entran si su consulta sigue abierta (si ya se completó, ya fueron atendidos).
    const activos = lista.filter((t) => t.estado === 'pendiente' || t.consulta_pendiente_id)
    // Cualquier turno con hora_llamado sigue "en camilla" hasta que lo saquen a mano
    // o se complete la consulta (momento en que sale de "activos" más arriba).
    const llamados = activos
      .filter((t) => t.hora_llamado)
      .sort((a, b) => new Date(a.hora_llamado) - new Date(b.hora_llamado))
    const sinLlamar = activos
      .filter((t) => !t.hora_llamado)
      .sort((a, b) => a.hora.localeCompare(b.hora))
    resultado[profId] = { llamados, sinLlamar }
  })
  return resultado
}

export default function Camillas() {
  const { auth } = useAuth()
  const { sucursalActivaId } = useSucursalActiva()
  const esQuiro = useEsVerticalQuiro()
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
  const [panelCondensado, setPanelCondensado] = useState(null)
  const [walkInProfesionalId, setWalkInProfesionalId] = useState(null)
  const [walkInPaciente, setWalkInPaciente] = useState('')
  const [walkInSucursal, setWalkInSucursal] = useState('')
  const [walkInError, setWalkInError] = useState('')
  const [walkInGuardando, setWalkInGuardando] = useState(false)
  const [walkInPlanDisponible, setWalkInPlanDisponible] = useState(null)
  const [tiposTurno, setTiposTurno] = useState([])
  const [walkInTipoTurnoId, setWalkInTipoTurnoId] = useState('')
  const [walkInModo, setWalkInModo] = useState('individual')
  const [plantillasPlan, setPlantillasPlan] = useState([])
  const [nuevoPlanSesiones, setNuevoPlanSesiones] = useState('')
  const [nuevoPlanPrecio, setNuevoPlanPrecio] = useState('')
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)

  const hoy = fechaToStr(new Date())

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
      apiClient.get('/tipos-turno/'),
      apiClient.get('/plantillas-plan/'),
    ])
      .then(([turnosRes, profesionalesRes, disponibilidadRes, excepcionesRes, cierresRes, consultasRes, pacientesRes, sucursalesRes, tiposTurnoRes, plantillasRes]) => {
        setTurnosHoy(turnosRes.data.filter((t) => t.fecha === hoy && t.estado !== 'cancelado'))
        setProfesionales(profesionalesRes.data)
        setDisponibilidad(disponibilidadRes.data)
        setExcepciones(excepcionesRes.data)
        setCierres(cierresRes.data)
        setConsultas(consultasRes.data)
        setPacientes(pacientesRes.data)
        setSucursales(sucursalesRes.data)
        setTiposTurno(tiposTurnoRes.data.filter((t) => t.activo))
        setPlantillasPlan(plantillasRes.data.filter((pl) => pl.activo))
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

  const quitarTurno = async (turnoId) => {
    if (!confirm('¿Quitar este turno de Camillas? Se cancela y el casillero queda libre para otro paciente.')) return
    try {
      await apiClient.post(`/turnos/${turnoId}/cancelar/`)
      cargarDatos()
    } catch {
      alert('No se pudo quitar el turno.')
    }
  }

  const confirmarTurno = async (turnoId) => {
    try {
      await apiClient.post(`/turnos/${turnoId}/confirmar/`)
      cargarDatos()
    } catch {
      alert('No se pudo confirmar el turno.')
    }
  }

  const abrirWalkIn = (profId) => {
    setWalkInProfesionalId(profId)
    setWalkInPaciente('')
    setWalkInSucursal(sucursalActivaId || sucursales[0]?.id || '')
    setWalkInError('')
    setWalkInPlanDisponible(null)
    setWalkInTipoTurnoId(tiposTurno[0]?.id || '')
    setWalkInModo('individual')
    setNuevoPlanSesiones('')
    setNuevoPlanPrecio('')
  }

  useEffect(() => {
    if (!walkInPaciente) {
      setWalkInPlanDisponible(null)
      return
    }
    let cancelado = false
    setWalkInPlanDisponible(null)
    apiClient
      .get(`/planes/?paciente=${walkInPaciente}`)
      .then((res) => {
        if (cancelado) return
        const tienePlan = res.data.some((p) => p.activo && p.sesiones_usadas < p.sesiones_totales)
        setWalkInPlanDisponible(tienePlan)
      })
      .catch(() => {
        if (!cancelado) setWalkInPlanDisponible(false)
      })
    return () => {
      cancelado = true
    }
  }, [walkInPaciente])

  useEffect(() => {
    if (walkInPlanDisponible !== false) {
      setWalkInModo('individual')
      setNuevoPlanSesiones('')
      setNuevoPlanPrecio('')
    }
  }, [walkInPlanDisponible])

  const walkInTipo = tiposTurno.find((t) => String(t.id) === String(walkInTipoTurnoId))

  const confirmarWalkIn = async () => {
    if (!walkInPaciente) {
      setWalkInError('Elegí un paciente.')
      return
    }
    if (walkInModo === 'individual' && !walkInTipo) {
      setWalkInError('Elegí un tipo de turno.')
      return
    }
    if (walkInModo === 'plan_nuevo' && (!nuevoPlanSesiones || !nuevoPlanPrecio)) {
      setWalkInError('Completá las sesiones y el precio del plan nuevo.')
      return
    }
    setWalkInGuardando(true)
    setWalkInError('')
    try {
      if (walkInModo === 'plan_nuevo') {
        await apiClient.post('/planes/', {
          paciente: walkInPaciente,
          sesiones_totales: nuevoPlanSesiones,
          precio: nuevoPlanPrecio,
        })
      }
      const payload = {
        paciente: walkInPaciente,
        profesional: walkInProfesionalId,
        sucursal: walkInSucursal,
      }
      if (walkInModo === 'individual') {
        payload.tipo_turno_catalogo = walkInTipoTurnoId
        if (walkInPlanDisponible === false) {
          payload.monto_cobrado = walkInTipo.precio
        }
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
    const turnosActivosHoy = turnosHoy.filter((t) => t.estado === 'pendiente' || t.estado === 'confirmado')
    const porProfesional = calcularEnCamillaPorProfesional(turnosActivosHoy)
    const idsPacienteEnCamilla = new Set(
      Object.values(porProfesional).flatMap((v) => v.llamados.map((t) => t.paciente))
    )

    const idsConsultaAPedir = []
    idsPacienteEnCamilla.forEach((pacId) => {
      const consultaReciente = buscarConsultaCompletadaPrevia(consultas, pacId)
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
      <Layout titulo="Camillas" filtraPorSucursal>
        <p className="text-texto-secundario">Cargando...</p>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout titulo="Camillas" filtraPorSucursal>
        <p className="text-input-error">{error}</p>
      </Layout>
    )
  }

  const profesionalesPorId = {}
  profesionales.forEach((p) => { profesionalesPorId[p.id] = p })

  const sucursalesPorId = {}
  sucursales.forEach((s) => { sucursalesPorId[s.id] = s.nombre })

  const walkInPacienteSeleccionado = pacientes.find((p) => String(p.id) === String(walkInPaciente))

  // Filtro de sesión (sucursal activa, ver SucursalActivaContext): con
  // "todas" (sucursalActivaId null) queda idéntico a como es hoy.
  const filtrarPorSucursal = (lista) =>
    sucursalActivaId ? lista.filter((x) => String(x.sucursal) === String(sucursalActivaId)) : lista

  const turnosActivosHoy = filtrarPorSucursal(
    turnosHoy.filter((t) => t.estado === 'pendiente' || t.estado === 'confirmado')
  )
  const enCamillaPorProfesional = calcularEnCamillaPorProfesional(turnosActivosHoy)

  const idsAMostrar = auth.rol === 'profesional'
    ? (auth.profesional_id ? [auth.profesional_id] : [])
    : [...profesionales]
        .sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
        .map((p) => p.id)

  const tarjetas = idsAMostrar.map((profId) => {
    const { llamados, sinLlamar } = enCamillaPorProfesional[profId] || { llamados: [], sinLlamar: [] }

    const itemsLlamados = llamados.map((turno) => {
      const consultaReciente = buscarConsultaCompletadaPrevia(consultas, turno.paciente)
      const tieneConsultaCompletada = Boolean(consultaReciente)
      const ajustesArray = consultaReciente ? ajustesPorConsultaId[consultaReciente.id] : null
      let ultimoAjusteMapa = null
      if (ajustesArray && ajustesArray.length > 0) {
        ultimoAjusteMapa = {}
        ajustesArray.forEach((a) => { ultimoAjusteMapa[a.segmento] = a })
      }
      return { tipo: 'llamado', turno, ultimoAjusteMapa, tieneConsultaCompletada }
    })
    const itemsSinLlamar = sinLlamar.map((turno) => ({
      tipo: turno.estado,
      turno,
      tieneConsultaCompletada: Boolean(buscarConsultaCompletadaPrevia(consultas, turno.paciente)),
    }))

    // Azules primero, después relleno con lo que falte hasta completar los 4 casilleros.
    const items = [...itemsLlamados, ...itemsSinLlamar].slice(0, 4)

    // La sucursal de la tarjeta se toma del primer turno del día — en el caso
    // normal (un profesional atiende en una sola sucursal por día) es exacta;
    // no cubre el caso de un profesional con turnos en más de una sucursal el
    // mismo día, igual que el resto de las pantallas que ya usan este criterio.
    const sucursalId = items[0]?.turno.sucursal
    const sucursalNombre = sucursalId ? sucursalesPorId[sucursalId] : null

    return { profesionalId: profId, profesional: profesionalesPorId[profId], items, sucursalNombre }
  })

  const idsRelevantesPanel = auth.rol === 'profesional'
    ? (auth.profesional_id ? [auth.profesional_id] : [])
    : profesionales.map((p) => p.id)

  return (
    <Layout titulo="Camillas" filtraPorSucursal>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div>
          {tarjetas.length === 0 ? (
            <p className="text-texto-secundario">No hay profesionales cargados.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              {tarjetas.map((t) => (
                <Card
                  key={t.profesionalId}
                  titulo={
                    <>
                      {t.profesional ? `${t.profesional.nombre} ${t.profesional.apellido}` : 'Profesional'}
                      {sucursales.length > 1 && !sucursalActivaId && t.sucursalNombre && (
                        <span className="block text-[11px] font-normal text-slate-400">{t.sucursalNombre}</span>
                      )}
                    </>
                  }
                >
                  {auth.rol !== 'profesional' && (
                    <BotonIcono
                      icono={Plus}
                      texto="Agregar sin turno"
                      onClick={() => abrirWalkIn(t.profesionalId)}
                      className="self-start"
                    />
                  )}

                  {t.items.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((i) => {
                        const item = t.items[i]

                        if (!item) {
                          return auth.rol !== 'profesional' ? (
                            <Tooltip key={`vacio-${i}`} texto="Agregar sin turno" className="w-full">
                              <button
                                onClick={() => abrirWalkIn(t.profesionalId)}
                                className="w-full border border-dashed border-slate-200 rounded p-3 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 text-lg font-medium min-h-[76px] transition-colors"
                              >
                                +
                              </button>
                            </Tooltip>
                          ) : (
                            <div
                              key={`vacio-${i}`}
                              className="border border-dashed border-slate-200 rounded p-3 flex items-center justify-center text-slate-300 text-sm min-h-[76px]"
                            >
                              —
                            </div>
                          )
                        }

                        if (item.tipo === 'llamado') {
                          const turno = item.turno
                          return (
                            <div key={turno.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                              <Badge estado="en-camilla" className="mb-1">En camilla ahora</Badge>
                              <p className="font-medium text-slate-800 text-sm">{turno.paciente_nombre}</p>
                              <p className="text-xs text-slate-500 mb-2">{formatearHora(turno.hora)}</p>
                              <div className="flex gap-3">
                                <BotonIcono
                                  icono={User}
                                  texto="Ver ficha"
                                  onClick={() => setPacienteAbiertoId(turno.paciente)}
                                />
                                {item.tieneConsultaCompletada ? (
                                  <BotonIcono
                                    icono={Search}
                                    texto="Ir a la consulta"
                                    onClick={() => setPanelCondensado({
                                      pacienteId: turno.paciente,
                                      consultaId: turno.consulta_pendiente_id,
                                    })}
                                  />
                                ) : (
                                  <BotonIcono icono={Search} texto="Ir a la consulta" to={`/consultas/${turno.consulta_pendiente_id}`} />
                                )}
                                <BotonIcono
                                  icono={LogOut}
                                  texto="Vuelve a la cola de espera, sigue en la lista de hoy"
                                  color="destructive"
                                  onClick={() => sacarDeCamilla(turno.id)}
                                />
                                <BotonIcono
                                  icono={X}
                                  texto="Cancela el turno y libera este lugar para otro paciente"
                                  color="destructive"
                                  onClick={() => quitarTurno(turno.id)}
                                />
                              </div>
                              {esQuiro && item.ultimoAjusteMapa && (
                                <div className="mt-2 pt-2 border-t border-blue-100">
                                  <p className="text-[10px] text-blue-500 uppercase mb-1">Último ajuste</p>
                                  <ColumnaVertebralMini ajustes={item.ultimoAjusteMapa} />
                                </div>
                              )}
                              {!item.ultimoAjusteMapa && !item.tieneConsultaCompletada && (
                                <div className="mt-2 pt-2 border-t border-blue-100">
                                  <p className="text-[10px] text-slate-400 italic">Sin historial previo.</p>
                                </div>
                              )}
                            </div>
                          )
                        }

                        const turno = item.turno
                        return (
                          <div
                            key={turno.id}
                            className={
                              turno.estado === 'pendiente'
                                ? 'bg-amber-50 border border-amber-300 rounded p-3'
                                : 'bg-slate-50 border border-slate-200 rounded p-3'
                            }
                          >
                            {turno.estado === 'pendiente' && (
                              <Badge estado="pendiente" className="mb-1">Sin confirmar</Badge>
                            )}
                            <p className="text-sm font-medium text-slate-700">{turno.paciente_nombre}</p>
                            <p className="text-xs text-slate-500 mb-1">{formatearHora(turno.hora)}</p>
                            <div className="flex gap-3 items-center">
                              <BotonIcono
                                icono={User}
                                texto="Ver ficha"
                                onClick={() => setPacienteAbiertoId(turno.paciente)}
                              />
                              {turno.estado === 'pendiente' ? (
                                <BotonIcono
                                  icono={Check}
                                  texto="Confirmar"
                                  color="success"
                                  onClick={() => confirmarTurno(turno.id)}
                                />
                              ) : (
                                <>
                                  {item.tieneConsultaCompletada ? (
                                    <BotonIcono
                                      icono={Search}
                                      texto="Ir a la consulta"
                                      onClick={() => setPanelCondensado({
                                        pacienteId: turno.paciente,
                                        consultaId: turno.consulta_pendiente_id,
                                      })}
                                    />
                                  ) : (
                                    <BotonIcono icono={Search} texto="Ir a la consulta" to={`/consultas/${turno.consulta_pendiente_id}`} />
                                  )}
                                  <BotonIcono
                                    icono={LogIn}
                                    texto="Llamar"
                                    color="success"
                                    onClick={() => llamar(turno.id)}
                                  />
                                </>
                              )}
                              <BotonIcono
                                icono={X}
                                texto="Cancela el turno y libera este lugar para otro paciente"
                                color="destructive"
                                onClick={() => quitarTurno(turno.id)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <CardTextoSecundario>
                      {sucursalActivaId ? 'Sin turnos en esta sucursal hoy.' : 'Sin turnos para hoy.'}
                    </CardTextoSecundario>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <PanelFranjasHorarias
          titulo="Próximos pacientes hoy"
          fecha={new Date()}
          idsRelevantes={idsRelevantesPanel}
          disponibilidad={filtrarPorSucursal(disponibilidad)}
          excepciones={filtrarPorSucursal(excepciones)}
          cierres={filtrarPorSucursal(cierres)}
          turnos={filtrarPorSucursal(turnosHoy)}
          mostrarProfesional={auth.rol !== 'profesional'}
        />
      </div>

      {pacienteAbiertoId && (
        <FichaPacienteModal pacienteId={pacienteAbiertoId} onClose={() => setPacienteAbiertoId(null)} />
      )}

      {panelCondensado && (
        <PanelCamillaCondensado
          pacienteId={panelCondensado.pacienteId}
          consultaId={panelCondensado.consultaId}
          ladoIzquierdo
          onClose={() => {
            setPanelCondensado(null)
            cargarDatos()
          }}
        />
      )}

      {walkInProfesionalId && (
        <Modal
          titulo="Agregar sin turno"
          onClose={() => setWalkInProfesionalId(null)}
          acciones={
            <Boton variante="primary" onClick={confirmarWalkIn} disabled={walkInGuardando} className="w-full">
              {walkInGuardando ? 'Agregando...' : 'Confirmar'}
            </Boton>
          }
        >
          <p className="text-texto-secundario mb-3">
            {profesionalesPorId[walkInProfesionalId]
              ? `${profesionalesPorId[walkInProfesionalId].nombre} ${profesionalesPorId[walkInProfesionalId].apellido}`
              : ''}
          </p>

          {walkInError && <p className="text-input-error mb-3">{walkInError}</p>}

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
              {walkInPlanDisponible === false && walkInModo === 'individual' && walkInTipo && (
                <p className="text-xs text-slate-500 mt-1">Se va a cobrar ${walkInTipo.precio} por este turno.</p>
              )}
            </div>

            {walkInPlanDisponible === false && (
              <div className="flex gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="walkInModo"
                    checked={walkInModo === 'individual'}
                    onChange={() => setWalkInModo('individual')}
                  />
                  Turno individual
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="walkInModo"
                    checked={walkInModo === 'plan_nuevo'}
                    onChange={() => setWalkInModo('plan_nuevo')}
                  />
                  Iniciar plan nuevo
                </label>
              </div>
            )}

            {walkInModo === 'individual' ? (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tipo de turno</label>
                {tiposTurno.length === 0 ? (
                  <p className="text-red-600 text-xs">No hay tipos de turno configurados — cargalos en Valores turnos.</p>
                ) : (
                  <select
                    value={walkInTipoTurnoId}
                    onChange={(e) => setWalkInTipoTurnoId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    required
                  >
                    {tiposTurno.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} — {t.duracion_minutos} min
                        {walkInPlanDisponible !== true && ` — $${t.precio}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <SelectorPlantillaPlan
                  plantillas={plantillasPlan}
                  sesiones={nuevoPlanSesiones}
                  precio={nuevoPlanPrecio}
                  onChangeSesiones={setNuevoPlanSesiones}
                  onChangePrecio={setNuevoPlanPrecio}
                />
              </div>
            )}

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
          </div>
        </Modal>
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
