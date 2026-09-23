import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'
import apiClient from '../api/client'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import { diaSemanaBackend, duracionAMinutos, fechaToStr, formatearFecha, formatearHora, hmAMinutos, minutosAHM } from '../utils/fechas'

registerLocale('es', es)

const CUALQUIERA = 'cualquiera'
const DURACION_PUBLICA_MINUTOS = 60
const MARGEN_MINUTOS_MINIMO = 30

const INPUT_BASE =
  'w-full h-10 py-2.5 px-3 rounded-lg text-left font-sans font-normal text-[14px] leading-[17px] ' +
  'bg-white border border-input-border outline-none transition-colors ' +
  'focus:border-2 focus:border-input-focus'

const LABEL_BASE = 'block font-sans font-medium text-[12px] leading-[15px] text-input-label mb-2'

const VOLVER_LINK = 'w-full text-center font-sans font-medium text-[14px] text-primary hover:underline mt-3'

// Oscurece un color hex un porcentaje dado (0-1), para simular los estados
// hover/active de --color-btn-primary sin depender de que la organización
// cargue esos tonos aparte — mismo criterio que ya usan los tokens fijos del
// sistema (cada estado ~10-20% más oscuro que el anterior, ver index.css).
function oscurecerHex(hex, porcentaje) {
  const num = parseInt(hex.replace('#', ''), 16)
  const canal = (desplazamiento) => Math.max(0, Math.round(((num >> desplazamiento) & 0xff) * (1 - porcentaje)))
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

// Aplica la marca de la organización (color_primario/color_secundario) como
// variables CSS, sobreescribiendo acá — y solo acá, scopeado a esta pantalla
// vía el contenedor raíz — los tokens que ya consumen los componentes
// compartidos (Boton, CampoTexto) para que los botones principales,
// encabezados y acentos de ESTA pantalla salgan con el color de la
// organización sin tocar Boton.jsx/CampoTexto.jsx ni el resto de la app.
// Sin marca cargada (color_primario null), no se define nada acá y todo cae
// al default del sistema (navy/teal) vía la cascada normal de :root.
function estiloMarca(organizacion) {
  if (!organizacion?.color_primario) return undefined
  const estilo = {
    '--color-primary': organizacion.color_primario,
    '--color-btn-primary': organizacion.color_primario,
    '--color-btn-primary-hover': oscurecerHex(organizacion.color_primario, 0.15),
    '--color-btn-primary-active': oscurecerHex(organizacion.color_primario, 0.25),
    '--color-input-focus': organizacion.color_primario,
    '--color-heading': organizacion.color_primario,
  }
  if (organizacion.color_secundario) estilo['--color-secondary'] = organizacion.color_secundario
  return estilo
}

// Luminancia relativa aproximada (no es la fórmula WCAG completa, alcanza
// para decidir blanco/negro encima de un color de fondo).
function luminanciaRelativa(hex) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// Color de texto legible sobre el color_primario de la organización, para
// los elementos de esta pantalla que hoy tienen texto blanco fijo contra
// bg-btn-primary (los Boton variante="primary" y el horario seleccionado).
// Sin color_primario cargado, undefined — el texto blanco fijo de Boton.jsx
// queda como está, no se toca ese componente en general.
function textoSobreMarca(colorPrimario) {
  if (!colorPrimario) return undefined
  return luminanciaRelativa(colorPrimario) > 0.6 ? '#000000' : '#ffffff'
}

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
  const [organizacion, setOrganizacion] = useState(null)

  const [paso, setPaso] = useState('dni')

  const [dni, setDni] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [errorDni, setErrorDni] = useState('')

  const [cliente, setCliente] = useState(null)

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

    // Aparte del Promise.all de arriba: la marca es cosmética, no debe
    // impedir reservar un turno si este pedido falla (ej. slug inválido ya
    // reportado por el otro fetch, o un error puntual de este endpoint).
    apiClient
      .get(`/publico/${organizacionId}/info/`)
      .then((res) => setOrganizacion(res.data))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacionId])

  const handleBuscarDni = async (e) => {
    e.preventDefault()
    setErrorDni('')
    setBuscando(true)
    try {
      const res = await apiClient.post(`/publico/${organizacionId}/buscar-cliente/`, { dni })
      if (res.data.existe) {
        setCliente({ id: res.data.cliente_id, nombre: res.data.nombre })
      } else {
        // Cliente nuevo: el alta se pide más adelante, recién cuando se
        // eligió un horario y ya se sabe la sucursal (ver handleSubmitAlta).
        setAltaForm({ nombre: '', apellido: '', celular: '', email: '' })
      }
      setPaso('profesional')
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
      const res = await apiClient.post(`/publico/${organizacionId}/clientes/`, {
        nombre: altaForm.nombre,
        apellido: altaForm.apellido,
        dni,
        celular: altaForm.celular,
        email: altaForm.email,
        sucursal_id: horarioSeleccionado.sucursal,
      })
      setCliente({ id: res.data.id, nombre: `${res.data.nombre} ${res.data.apellido}` })
      setPaso('confirmar')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo registrar el cliente. Probá de nuevo.'
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
        cliente_id: cliente.id,
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
      <div className="min-h-screen flex items-center justify-center bg-page">
        <p className="font-sans text-[14px] text-texto-secundario">Cargando...</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <p className="font-sans text-[14px] text-input-error max-w-sm text-center">{errorCarga}</p>
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

  const colorTexto = textoSobreMarca(organizacion?.color_primario)
  const estiloTextoMarca = colorTexto ? { color: colorTexto } : undefined

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4" style={estiloMarca(organizacion)}>
      <div className="bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] p-8 w-full max-w-md flex flex-col gap-5">
        {organizacion?.logo && (
          <img src={organizacion.logo} alt={organizacion.nombre} className="h-16 mx-auto object-contain" />
        )}
        {organizacion?.nombre && (
          <p className="font-sans font-semibold text-[16px] text-heading text-center">{organizacion.nombre}</p>
        )}
        <h1 className="font-sans font-semibold text-[20px] text-heading text-center">Reservar turno</h1>

        {paso === 'dni' && (
          <form onSubmit={handleBuscarDni} className="flex flex-col gap-5">
            <CampoTexto
              label="Tu DNI"
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              error={errorDni}
              required
            />
            <Boton type="submit" variante="primary" disabled={buscando} className="w-full" style={estiloTextoMarca}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </Boton>
          </form>
        )}

        {paso === 'alta' && (
          <form onSubmit={handleSubmitAlta} className="flex flex-col gap-5">
            <p className="font-sans text-[14px] text-texto-secundario">
              No encontramos tu DNI. Completá tus datos para registrarte.
            </p>

            {errorAlta && <p className="font-sans text-[14px] text-input-error">{errorAlta}</p>}

            <CampoTexto
              label="Nombre"
              id="alta-nombre"
              name="nombre"
              value={altaForm.nombre}
              onChange={handleChangeAlta}
              required
            />
            <CampoTexto
              label="Apellido"
              id="alta-apellido"
              name="apellido"
              value={altaForm.apellido}
              onChange={handleChangeAlta}
              required
            />
            <CampoTexto label="DNI" id="alta-dni" value={dni} disabled />
            <CampoTexto
              label="Celular"
              id="alta-celular"
              name="celular"
              value={altaForm.celular}
              onChange={handleChangeAlta}
              required
            />
            <CampoTexto
              label="Email (opcional)"
              id="alta-email"
              name="email"
              type="email"
              value={altaForm.email}
              onChange={handleChangeAlta}
            />

            <Boton type="submit" variante="primary" disabled={guardandoAlta} className="w-full" style={estiloTextoMarca}>
              {guardandoAlta ? 'Registrando...' : 'Registrarme y continuar'}
            </Boton>
            <button type="button" onClick={() => setPaso('horario')} className={VOLVER_LINK}>
              ← Volver
            </button>
          </form>
        )}

        {paso === 'profesional' && (
          <div className="flex flex-col gap-5">
            {cliente && <p className="font-sans text-[14px] text-texto">¡Hola, {cliente.nombre}!</p>}
            <div>
              <label className={LABEL_BASE}>¿Con quién preferís atenderte?</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-sans text-[14px] text-texto">
                  <input
                    type="radio"
                    name="profesional"
                    checked={profesionalId === CUALQUIERA}
                    onChange={() => elegirProfesional(CUALQUIERA)}
                  />
                  Cualquiera disponible
                </label>
                {profesionales.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 font-sans text-[14px] text-texto">
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
            </div>
            <Boton
              type="button"
              variante="primary"
              disabled={!profesionalId}
              onClick={() => setPaso('horario')}
              className="w-full"
              style={estiloTextoMarca}
            >
              Continuar
            </Boton>
          </div>
        )}

        {paso === 'horario' && (
          <div className="flex flex-col gap-5">
            <p className="font-sans text-[14px] text-texto">
              {profesionalId === CUALQUIERA ? 'Cualquiera disponible' : `${profesionalSeleccionado?.nombre} ${profesionalSeleccionado?.apellido}`}
            </p>

            <div>
              <label className={LABEL_BASE}>Fecha</label>
              <DatePicker
                selected={fechaSeleccionada}
                onChange={(fecha) => {
                  setFechaSeleccionada(fecha)
                  setHorarioSeleccionado(null)
                }}
                filterDate={filterDate}
                minDate={hoy}
                placeholderText="Elegí una fecha"
                className={INPUT_BASE}
                dateFormat="dd/MM/yyyy"
                locale="es"
              />
            </div>

            {fechaSeleccionada && (
              <div>
                <label className={LABEL_BASE}>Horario</label>
                {horariosDisponibles.length === 0 ? (
                  <p className="font-sans text-[12px] text-input-error">No hay horarios libres ese día. Probá otra fecha.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {horariosDisponibles.map((h) => (
                      <button
                        key={h.hora}
                        type="button"
                        onClick={() => setHorarioSeleccionado(h)}
                        className={`font-sans text-[14px] rounded-lg px-2 py-1.5 border transition-colors ${
                          horarioSeleccionado?.hora === h.hora
                            ? 'bg-btn-primary text-white border-btn-primary'
                            : 'bg-white text-texto border-input-border hover:bg-btn-outline-hover'
                        }`}
                        style={horarioSeleccionado?.hora === h.hora ? estiloTextoMarca : undefined}
                      >
                        {h.hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Boton
              type="button"
              variante="primary"
              disabled={!horarioSeleccionado}
              onClick={() => setPaso(cliente ? 'confirmar' : 'alta')}
              className="w-full"
              style={estiloTextoMarca}
            >
              Continuar
            </Boton>
            <button type="button" onClick={() => setPaso('profesional')} className={VOLVER_LINK}>
              ← Volver
            </button>
          </div>
        )}

        {paso === 'confirmar' && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-sans text-[14px] text-texto mb-2">Revisá los datos de tu turno:</p>
              <ul className="font-sans text-[14px] text-texto space-y-1">
                <li><strong>Cliente:</strong> {cliente?.nombre}</li>
                <li>
                  <strong>Profesional:</strong>{' '}
                  {profesionalId === CUALQUIERA ? 'Cualquiera disponible' : `${profesionalSeleccionado?.nombre} ${profesionalSeleccionado?.apellido}`}
                </li>
                <li><strong>Fecha:</strong> {fechaSeleccionada && formatearFecha(fechaToStr(fechaSeleccionada))}</li>
                <li><strong>Hora:</strong> {horarioSeleccionado?.hora}</li>
              </ul>
            </div>

            {errorConfirmar && <p className="font-sans text-[14px] text-input-error">{errorConfirmar}</p>}

            <Boton type="button" variante="primary" disabled={guardandoTurno} onClick={handleConfirmar} className="w-full" style={estiloTextoMarca}>
              {guardandoTurno ? 'Reservando...' : 'Confirmar reserva'}
            </Boton>
            <button type="button" onClick={volverAHorario} className={VOLVER_LINK}>
              ← Elegir otro horario
            </button>
          </div>
        )}

        {paso === 'exito' && (
          <div className="flex flex-col gap-2">
            <p className="font-sans font-semibold text-[14px] text-turno-confirmado-text">✓ ¡Listo!</p>
            <p className="font-sans text-[14px] text-texto">
              Tu turno quedó reservado para el <strong>{fechaSeleccionada && formatearFecha(fechaToStr(fechaSeleccionada))}</strong> a las{' '}
              <strong>{formatearHora(turnoConfirmado?.hora) || horarioSeleccionado?.hora}</strong>.
            </p>
            <p className="font-sans text-[14px] text-texto-secundario">
              El consultorio va a confirmarlo a la brevedad — todavía está pendiente de confirmación, no es definitivo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
