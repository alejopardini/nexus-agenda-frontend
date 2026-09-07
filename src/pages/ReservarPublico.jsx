import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import apiClient from '../api/client'
import { diaSemanaBackend, duracionAMinutos, fechaToStr, hmAMinutos, minutosAHM } from '../utils/fechas'

const CUALQUIERA = 'cualquiera'
const DURACION_PUBLICA_MINUTOS = 60
const MARGEN_MINUTOS_MINIMO = 30

function calcularHorariosLibres({ filas, excepciones, cierres, turnosOcupados, fecha, hoy }) {
  const fechaStr = fechaToStr(fecha)
  const esHoy = fechaToStr(fecha) === fechaToStr(hoy)
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes()
  const resultado = []

  filas.forEach((fila) => {
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(fila.profesional) && String(ex.sucursal) === String(fila.sucursal) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return

    const tieneCierre = cierres.some((c) => String(c.sucursal) === String(fila.sucursal) && c.fecha === fechaStr)
    if (tieneCierre) return

    const inicioMin = hmAMinutos(fila.hora_inicio.slice(0, 5))
    const finMin = hmAMinutos(fila.hora_fin.slice(0, 5))

    for (let m = inicioMin; m + DURACION_PUBLICA_MINUTOS <= finMin; m += 15) {
      const slotInicio = m
      const slotFin = m + DURACION_PUBLICA_MINUTOS
      if (esHoy && slotInicio < minutosAhora + MARGEN_MINUTOS_MINIMO) continue

      const ocupado = turnosOcupados.some((t) => {
        if (String(t.profesional) !== String(fila.profesional) || t.fecha !== fechaStr) return false
        const tInicio = hmAMinutos(t.hora.slice(0, 5))
        const tFin = tInicio + duracionAMinutos(t.duracion)
        return slotInicio < tFin && tInicio < slotFin
      })
      if (!ocupado) {
        resultado.push({ hora: minutosAHM(m), sucursal: fila.sucursal })
      }
    }
  })

  return resultado
}

export default function ReservarPublico() {
  const { organizacionId } = useParams()

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [profesionales, setProfesionales] = useState([])
  const [datosDisponibilidad, setDatosDisponibilidad] = useState(null)

  const [paso, setPaso] = useState('dni')

  const [dni, setDni] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [errorDni, setErrorDni] = useState('')

  const [paciente, setPaciente] = useState(null)

  const [altaForm, setAltaForm] = useState({ nombre: '', apellido: '', celular: '', email: '' })
  const [guardandoAlta, setGuardandoAlta] = useState(false)
  const [errorAlta, setErrorAlta] = useState('')

  const [profesionalId, setProfesionalId] = useState('')

  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null)

  const [guardandoTurno, setGuardandoTurno] = useState(false)
  const [errorConfirmar, setErrorConfirmar] = useState('')
  const [turnoConfirmado, setTurnoConfirmado] = useState(null)

  const cargarDisponibilidad = () => {
    return apiClient
      .get(`/publico/${organizacionId}/disponibilidad/`)
      .then((res) => setDatosDisponibilidad(res.data))
  }

  useEffect(() => {
    Promise.all([
      apiClient.get(`/publico/${organizacionId}/profesionales/`).then((res) => setProfesionales(res.data)),
      cargarDisponibilidad(),
    ])
      .catch(() => setErrorCarga('No se pudo cargar la información de reserva. Verificá el link e intentá de nuevo.'))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacionId])

  const handleBuscarDni = async (e) => {
    e.preventDefault()
    setErrorDni('')
    setBuscando(true)
    try {
      const res = await apiClient.post(`/publico/${organizacionId}/buscar-paciente/`, { dni })
      if (res.data.existe) {
        setPaciente({ id: res.data.paciente_id, nombre: res.data.nombre })
        setPaso('profesional')
      } else {
        setAltaForm({ nombre: '', apellido: '', celular: '', email: '' })
        setPaso('alta')
      }
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo buscar el DNI. Probá de nuevo.'
      setErrorDni(mensaje)
    } finally {
      setBuscando(false)
    }
  }

  const handleChangeAlta = (e) => setAltaForm({ ...altaForm, [e.target.name]: e.target.value })

  const handleSubmitAlta = async (e) => {
    e.preventDefault()
    setErrorAlta('')
    setGuardandoAlta(true)
    try {
      const res = await apiClient.post(`/publico/${organizacionId}/pacientes/`, {
        nombre: altaForm.nombre,
        apellido: altaForm.apellido,
        dni,
        celular: altaForm.celular,
        email: altaForm.email,
      })
      setPaciente({ id: res.data.id, nombre: `${res.data.nombre} ${res.data.apellido}` })
      setPaso('profesional')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo registrar el paciente. Probá de nuevo.'
      setErrorAlta(mensaje)
    } finally {
      setGuardandoAlta(false)
    }
  }

  const handleConfirmar = async () => {
    setErrorConfirmar('')
    setGuardandoTurno(true)
    try {
      const payload = {
        paciente_id: paciente.id,
        sucursal_id: horarioSeleccionado.sucursal,
        fecha: fechaToStr(fechaSeleccionada),
        hora: horarioSeleccionado.hora,
      }
      if (profesionalId !== CUALQUIERA) {
        payload.profesional_id = profesionalId
      }
      const res = await apiClient.post(`/publico/${organizacionId}/turnos/`, payload)
      setTurnoConfirmado(res.data)
      setPaso('exito')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo reservar el turno. Probá de nuevo.'
      setErrorConfirmar(mensaje)
      // el horario pudo haberse ocupado entre que se calculó y este intento: refrescamos antes de volver a elegir
      cargarDisponibilidad().catch(() => {})
    } finally {
      setGuardandoTurno(false)
    }
  }

  const volverAHorario = () => {
    setErrorConfirmar('')
    setHorarioSeleccionado(null)
    setPaso('horario')
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Cargando...</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-600 max-w-sm text-center">{errorCarga}</p>
      </div>
    )
  }

  const hoy = new Date()
  const profesionalSeleccionado = profesionales.find((p) => String(p.id) === String(profesionalId))

  const filasDelSeleccionado = datosDisponibilidad.disponibilidad.filter(
    (d) => profesionalId === CUALQUIERA || String(d.profesional) === String(profesionalId)
  )
  const diasPermitidos = new Set(filasDelSeleccionado.map((d) => d.dia_semana))

  const filterDate = (fecha) => {
    if (fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return false
    return diasPermitidos.has(diaSemanaBackend(fecha))
  }

  let horariosDisponibles = []
  if (fechaSeleccionada) {
    const diaSemana = diaSemanaBackend(fechaSeleccionada)
    const filasDelDia = filasDelSeleccionado.filter((d) => d.dia_semana === diaSemana)
    const brutos = calcularHorariosLibres({
      filas: filasDelDia,
      excepciones: datosDisponibilidad.excepciones,
      cierres: datosDisponibilidad.cierres,
      turnosOcupados: datosDisponibilidad.turnos_ocupados,
      fecha: fechaSeleccionada,
      hoy,
    })
    const porHora = new Map()
    brutos.forEach((s) => {
      if (!porHora.has(s.hora)) porHora.set(s.hora, s)
    })
    horariosDisponibles = [...porHora.values()].sort((a, b) => a.hora.localeCompare(b.hora))
  }

  const elegirProfesional = (id) => {
    setProfesionalId(id)
    setFechaSeleccionada(null)
    setHorarioSeleccionado(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-6 text-slate-800">Reservar turno</h1>

        {paso === 'dni' && (
          <form onSubmit={handleBuscarDni}>
            <label className="block text-sm text-slate-600 mb-1">Tu DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              required
            />
            {errorDni && <p className="text-red-600 text-sm mb-4">{errorDni}</p>}
            <button
              type="submit"
              disabled={buscando}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        )}

        {paso === 'alta' && (
          <form onSubmit={handleSubmitAlta}>
            <p className="text-sm text-slate-500 mb-4">No encontramos tu DNI. Completá tus datos para registrarte.</p>

            {errorAlta && <p className="text-red-600 text-sm mb-4">{errorAlta}</p>}

            <label className="block text-sm text-slate-600 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={altaForm.nombre}
              onChange={handleChangeAlta}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              required
            />

            <label className="block text-sm text-slate-600 mb-1">Apellido</label>
            <input
              type="text"
              name="apellido"
              value={altaForm.apellido}
              onChange={handleChangeAlta}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              required
            />

            <label className="block text-sm text-slate-600 mb-1">DNI</label>
            <input
              type="text"
              value={dni}
              readOnly
              className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded px-3 py-2 mb-4"
            />

            <label className="block text-sm text-slate-600 mb-1">Celular</label>
            <input
              type="text"
              name="celular"
              value={altaForm.celular}
              onChange={handleChangeAlta}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              required
            />

            <label className="block text-sm text-slate-600 mb-1">Email (opcional)</label>
            <input
              type="email"
              name="email"
              value={altaForm.email}
              onChange={handleChangeAlta}
              className="w-full border border-slate-300 rounded px-3 py-2 mb-6"
            />

            <button
              type="submit"
              disabled={guardandoAlta}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {guardandoAlta ? 'Registrando...' : 'Registrarme y continuar'}
            </button>
            <button
              type="button"
              onClick={() => setPaso('dni')}
              className="w-full text-sm text-slate-500 hover:text-blue-600 mt-3"
            >
              ← Volver
            </button>
          </form>
        )}

        {paso === 'profesional' && (
          <div>
            <p className="text-sm text-slate-600 mb-4">¡Hola, {paciente?.nombre}!</p>
            <label className="block text-sm text-slate-600 mb-2">¿Con quién preferís atenderte?</label>
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="profesional"
                  checked={profesionalId === CUALQUIERA}
                  onChange={() => elegirProfesional(CUALQUIERA)}
                />
                Cualquiera disponible
              </label>
              {profesionales.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="profesional"
                    checked={String(profesionalId) === String(p.id)}
                    onChange={() => elegirProfesional(p.id)}
                  />
                  {p.nombre} {p.apellido}
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={!profesionalId}
              onClick={() => setPaso('horario')}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {paso === 'horario' && (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              {profesionalId === CUALQUIERA ? 'Cualquiera disponible' : `${profesionalSeleccionado?.nombre} ${profesionalSeleccionado?.apellido}`}
            </p>

            <label className="block text-sm text-slate-600 mb-1">Fecha</label>
            <DatePicker
              selected={fechaSeleccionada}
              onChange={(fecha) => {
                setFechaSeleccionada(fecha)
                setHorarioSeleccionado(null)
              }}
              filterDate={filterDate}
              minDate={hoy}
              placeholderText="Elegí una fecha"
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              dateFormat="dd/MM/yyyy"
            />

            {fechaSeleccionada && (
              <>
                <label className="block text-sm text-slate-600 mb-1">Horario</label>
                {horariosDisponibles.length === 0 ? (
                  <p className="text-red-600 text-xs mb-4">No hay horarios libres ese día. Probá otra fecha.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {horariosDisponibles.map((h) => (
                      <button
                        key={h.hora}
                        type="button"
                        onClick={() => setHorarioSeleccionado(h)}
                        className={`text-sm rounded px-2 py-1.5 border ${
                          horarioSeleccionado?.hora === h.hora
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 text-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {h.hora}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              disabled={!horarioSeleccionado}
              onClick={() => setPaso('confirmar')}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={() => setPaso('profesional')}
              className="w-full text-sm text-slate-500 hover:text-blue-600 mt-3"
            >
              ← Volver
            </button>
          </div>
        )}

        {paso === 'confirmar' && (
          <div>
            <p className="text-sm text-slate-600 mb-1">Revisá los datos de tu turno:</p>
            <ul className="text-sm text-slate-700 mb-4 space-y-1">
              <li><strong>Paciente:</strong> {paciente?.nombre}</li>
              <li>
                <strong>Profesional:</strong>{' '}
                {profesionalId === CUALQUIERA ? 'Cualquiera disponible' : `${profesionalSeleccionado?.nombre} ${profesionalSeleccionado?.apellido}`}
              </li>
              <li><strong>Fecha:</strong> {fechaSeleccionada?.toLocaleDateString('es-AR')}</li>
              <li><strong>Hora:</strong> {horarioSeleccionado?.hora}</li>
            </ul>

            {errorConfirmar && <p className="text-red-600 text-sm mb-4">{errorConfirmar}</p>}

            <button
              type="button"
              disabled={guardandoTurno}
              onClick={handleConfirmar}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {guardandoTurno ? 'Reservando...' : 'Confirmar reserva'}
            </button>
            <button
              type="button"
              onClick={volverAHorario}
              className="w-full text-sm text-slate-500 hover:text-blue-600 mt-3"
            >
              ← Elegir otro horario
            </button>
          </div>
        )}

        {paso === 'exito' && (
          <div>
            <p className="text-green-700 text-sm mb-2">✓ ¡Listo!</p>
            <p className="text-slate-700 text-sm">
              Tu turno quedó reservado para el <strong>{fechaSeleccionada?.toLocaleDateString('es-AR')}</strong> a las{' '}
              <strong>{turnoConfirmado?.hora?.slice(0, 5) || horarioSeleccionado?.hora}</strong>.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              El consultorio va a confirmarlo a la brevedad — todavía está pendiente de confirmación, no es definitivo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
