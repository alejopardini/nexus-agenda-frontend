import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import BuscadorPaciente from '../components/BuscadorPaciente'
import NuevoPacienteModal from '../components/NuevoPacienteModal'
import SelectorPlantillaPlan from '../components/SelectorPlantillaPlan'
import Boton from '../components/Boton'
import { useAuth } from '../context/AuthContext'
import { hmAMinutos, minutosAHM, duracionAMinutos, diaSemanaBackend, fechaToStr } from '../utils/fechas'

const MARGEN_MINUTOS_MINIMO = 30
const DURACION_PLAN_NUEVO_MINUTOS = 30

export default function NuevoTurno() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hoy = new Date()

  const [sucursales, setSucursales] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [todaDisponibilidad, setTodaDisponibilidad] = useState([])
  const [todosTurnos, setTodosTurnos] = useState([])
  const [todasExcepciones, setTodasExcepciones] = useState([])
  const [todosCierres, setTodosCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const fechaParam = searchParams.get('fecha')
    return fechaParam ? new Date(`${fechaParam}T00:00:00`) : null
  })

  const [tiposTurno, setTiposTurno] = useState([])
  const [form, setForm] = useState(() => ({
    sucursal: '',
    paciente: '',
    profesional: searchParams.get('profesional') || '',
    tipoTurnoId: '',
    hora: searchParams.get('hora') || '',
    descripcion: '',
    estado: 'pendiente',
  }))
  const [planDisponible, setPlanDisponible] = useState(null)
  const [modo, setModo] = useState('individual')
  const [plantillasPlan, setPlantillasPlan] = useState([])
  const [nuevoPlanSesiones, setNuevoPlanSesiones] = useState('')
  const [nuevoPlanPrecio, setNuevoPlanPrecio] = useState('')

  useEffect(() => {
    Promise.all([
      apiClient.get('/sucursales/'),
      apiClient.get('/pacientes/'),
      apiClient.get('/profesionales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/turnos/'),
      apiClient.get('/excepciones/'),
      apiClient.get('/cierres/'),
      apiClient.get('/tipos-turno/'),
      apiClient.get('/plantillas-plan/'),
    ])
      .then(([sucursalesRes, pacientesRes, profesionalesRes, disponibilidadRes, turnosRes, excepcionesRes, cierresRes, tiposTurnoRes, plantillasRes]) => {
        setSucursales(sucursalesRes.data)
        setPacientes(pacientesRes.data)
        setProfesionales(profesionalesRes.data)
        setTodaDisponibilidad(disponibilidadRes.data)
        setTodosTurnos(turnosRes.data.filter((t) => t.estado !== 'cancelado'))
        setTodasExcepciones(excepcionesRes.data)
        setTodosCierres(cierresRes.data)
        const activos = tiposTurnoRes.data.filter((t) => t.activo)
        setTiposTurno(activos)
        setPlantillasPlan(plantillasRes.data.filter((pl) => pl.activo))
        setForm((prev) => ({ ...prev, sucursal: sucursalesRes.data[0]?.id || '', tipoTurnoId: activos[0]?.id || '' }))
      })
      .catch(() => setError('No se pudieron cargar los datos del formulario.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.paciente) {
      setPlanDisponible(null)
      return
    }
    let cancelado = false
    setPlanDisponible(null)
    apiClient
      .get(`/planes/?paciente=${form.paciente}`)
      .then((res) => {
        if (cancelado) return
        const tienePlan = res.data.some((p) => p.activo && p.sesiones_usadas < p.sesiones_totales)
        setPlanDisponible(tienePlan)
      })
      .catch(() => {
        if (!cancelado) setPlanDisponible(false)
      })
    return () => {
      cancelado = true
    }
  }, [form.paciente])

  useEffect(() => {
    if (planDisponible !== false) {
      setModo('individual')
      setNuevoPlanSesiones('')
      setNuevoPlanPrecio('')
    }
  }, [planDisponible])

  if (auth.rol === 'profesional' && auth.puede_crear_turnos !== true) {
    return (
      <Layout>
        <BotonVolver to="/turnos/lista" className="mb-4" />
        <p className="text-red-600">No tenés permiso para agendar turnos. Pedile a la secretaría o al dueño que lo haga.</p>
      </Layout>
    )
  }

  const pacienteSeleccionado = pacientes.find((p) => String(p.id) === String(form.paciente))

  const idsConDisponibilidadEnSucursal = new Set(
    todaDisponibilidad.filter((d) => String(d.sucursal) === String(form.sucursal)).map((d) => String(d.profesional))
  )
  const profesionalesElegibles = profesionales.filter((p) => idsConDisponibilidadEnSucursal.has(String(p.id)))

  const disponibilidadDelProfesional = todaDisponibilidad.filter(
    (d) => String(d.profesional) === String(form.profesional) && String(d.sucursal) === String(form.sucursal)
  )
  const diasPermitidos = new Set(disponibilidadDelProfesional.map((d) => d.dia_semana))

  const excepcionesDelProfesional = todasExcepciones.filter(
    (ex) => String(ex.profesional) === String(form.profesional)
  )
  const fechasExcepcion = new Set(excepcionesDelProfesional.map((ex) => ex.fecha))

  const fechasCierre = new Set(
    todosCierres.filter((c) => String(c.sucursal) === String(form.sucursal)).map((c) => c.fecha)
  )

  const filterDate = (fecha) => {
    if (fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return false
    const fechaStr = fechaToStr(fecha)
    if (fechasCierre.has(fechaStr)) return false
    if (fechasExcepcion.has(fechaStr)) return false
    return diasPermitidos.has(diaSemanaBackend(fecha))
  }

  const tipo = tiposTurno.find((t) => String(t.id) === String(form.tipoTurnoId))
  const fechaStr = fechaSeleccionada ? fechaToStr(fechaSeleccionada) : null

  const turnosDelDia = fechaStr
    ? todosTurnos.filter(
        (t) => String(t.profesional) === String(form.profesional) && t.fecha === fechaStr
      )
    : []

  const disponibilidadDelDia = fechaSeleccionada
    ? disponibilidadDelProfesional.filter((d) => d.dia_semana === diaSemanaBackend(fechaSeleccionada))
    : []

  let horariosDisponibles = []
  const esHoy = fechaSeleccionada && fechaToStr(fechaSeleccionada) === fechaToStr(hoy)
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes()
  const duracionMinutos = modo === 'plan_nuevo' ? DURACION_PLAN_NUEVO_MINUTOS : tipo?.duracion_minutos
  if (duracionMinutos) {
    disponibilidadDelDia.forEach((d) => {
      const inicioMin = hmAMinutos(d.hora_inicio.slice(0, 5))
      const finMin = hmAMinutos(d.hora_fin.slice(0, 5))
      for (let m = inicioMin; m + duracionMinutos <= finMin; m += 15) {
        const slotInicio = m
        const slotFin = m + duracionMinutos
        if (esHoy && slotInicio < minutosAhora + MARGEN_MINUTOS_MINIMO) continue
        const ocupado = turnosDelDia.some((t) => {
          const tInicio = hmAMinutos(t.hora.slice(0, 5))
          const tFin = tInicio + duracionAMinutos(t.duracion)
          return slotInicio < tFin && tInicio < slotFin
        })
        if (!ocupado) {
          const hm = minutosAHM(m)
          if (!horariosDisponibles.includes(hm)) horariosDisponibles.push(hm)
        }
      }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'sucursal') {
      // La disponibilidad (días/horarios) es específica de cada sucursal, así
      // que fecha/hora siempre se reinician al cambiar. El profesional elegido
      // se conserva solo si también atiende en la sucursal nueva — si no, se
      // limpia para no dejar seleccionado a alguien que ya no aparece en la lista.
      const idsElegiblesEnNueva = new Set(
        todaDisponibilidad.filter((d) => String(d.sucursal) === String(value)).map((d) => String(d.profesional))
      )
      const profesionalSigueValido = idsElegiblesEnNueva.has(String(form.profesional))
      setForm({
        ...form,
        sucursal: value,
        profesional: profesionalSigueValido ? form.profesional : '',
        hora: '',
      })
      setFechaSeleccionada(null)
      return
    }
    if (name === 'profesional') {
      setForm({ ...form, profesional: value, hora: '' })
      setFechaSeleccionada(null)
      return
    }
    if (name === 'tipoTurnoId') {
      setForm({ ...form, tipoTurnoId: value, hora: '' })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fechaSeleccionada) {
      setError('Elegí una fecha.')
      return
    }
    if (!form.hora) {
      setError('Elegí un horario.')
      return
    }
    if (modo === 'individual' && !tipo) {
      setError('Elegí un tipo de turno.')
      return
    }
    if (modo === 'plan_nuevo' && (!nuevoPlanSesiones || !nuevoPlanPrecio)) {
      setError('Completá las sesiones y el precio del plan nuevo.')
      return
    }

    setGuardando(true)

    try {
      if (modo === 'plan_nuevo') {
        await apiClient.post('/planes/', {
          paciente: form.paciente,
          sesiones_totales: nuevoPlanSesiones,
          precio: nuevoPlanPrecio,
        })
      }

      const payload = {
        sucursal: form.sucursal,
        paciente: form.paciente,
        profesional: form.profesional,
        fecha: fechaStr,
        hora: form.hora,
        descripcion: form.descripcion,
        estado: form.estado,
        duracion:
          modo === 'plan_nuevo'
            ? `00:${String(DURACION_PLAN_NUEVO_MINUTOS).padStart(2, '0')}:00`
            : `${String(Math.floor(tipo.duracion_minutos / 60)).padStart(2, '0')}:${String(tipo.duracion_minutos % 60).padStart(2, '0')}:00`,
      }
      if (modo === 'individual') {
        payload.tipo_turno_catalogo = form.tipoTurnoId
        if (planDisponible === false) {
          payload.monto_cobrado = tipo.precio
        }
      }

      await apiClient.post('/turnos/', payload)
      navigate('/turnos')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.values(data).flat().join(' ')
        : 'No se pudo crear el turno.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to="/turnos/lista" className="mb-4" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Nuevo turno</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
              <select
                name="sucursal"
                value={form.sucursal}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Paciente</label>
              <BuscadorPaciente
                pacientes={pacientes}
                value={form.paciente}
                onChange={(id) => setForm({ ...form, paciente: id })}
                onNuevoPaciente={() => setModalNuevoPacienteAbierto(true)}
              />
              {planDisponible === true && (
                <p className="text-xs text-slate-500 mt-1">
                  Este turno va a descontar una sesión del plan activo de {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}.
                </p>
              )}
              {planDisponible === false && modo === 'individual' && tipo && (
                <p className="text-xs text-slate-500 mt-1">Se va a cobrar ${tipo.precio} por este turno.</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Profesional</label>
              <select
                name="profesional"
                value={form.profesional}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              >
                <option value="">Seleccione un profesional</option>
                {profesionalesElegibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
              {profesionales.length > profesionalesElegibles.length && (
                <p className="text-xs text-slate-400 mt-1">
                  Algunos profesionales no aparecen porque no atienden en esta sucursal.
                </p>
              )}
            </div>

            {planDisponible === false && (
              <div className="flex gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="modo"
                    checked={modo === 'individual'}
                    onChange={() => setModo('individual')}
                  />
                  Turno individual
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="modo"
                    checked={modo === 'plan_nuevo'}
                    onChange={() => setModo('plan_nuevo')}
                  />
                  Iniciar plan nuevo
                </label>
              </div>
            )}

            {modo === 'individual' ? (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tipo de turno</label>
                {tiposTurno.length === 0 ? (
                  <p className="text-red-600 text-xs">No hay tipos de turno configurados — cargalos en Valores turnos.</p>
                ) : (
                  <select
                    name="tipoTurnoId"
                    value={form.tipoTurnoId}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    required
                  >
                    {tiposTurno.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre} — {t.duracion_minutos} min — ${t.precio}</option>
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

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Fecha</label>
                <DatePicker
                  selected={fechaSeleccionada}
                  onChange={(fecha) => {
                    setFechaSeleccionada(fecha)
                    setForm({ ...form, hora: '' })
                  }}
                  filterDate={filterDate}
                  minDate={hoy}
                  disabled={!form.profesional}
                  placeholderText={form.profesional ? 'Elegí una fecha' : 'Elegí un profesional primero'}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Horario</label>
                <select
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  disabled={!fechaSeleccionada}
                  className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50"
                >
                  <option value="">Seleccione un horario</option>
                  {horariosDisponibles.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {fechaSeleccionada && horariosDisponibles.length === 0 && (
                  <p className="text-red-600 text-xs mt-1">No hay horarios libres ese día para este tipo de turno.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                rows={2}
              />
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Crear turno'}
            </Boton>
          </form>
        </div>
      </div>

      {modalNuevoPacienteAbierto && (
        <NuevoPacienteModal
          onClose={() => setModalNuevoPacienteAbierto(false)}
          onCreado={(p) => {
            setPacientes((prev) => [...prev, p])
            setForm((prev) => ({ ...prev, paciente: p.id }))
          }}
        />
      )}
    </Layout>
  )
}