import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import NuevoTurnoModal from '../components/NuevoTurnoModal'
import FichaPacienteModal from '../components/FichaPacienteModal'
import PanelFranjasHorarias from '../components/PanelFranjasHorarias'
import CalendarioSemanal from '../components/CalendarioSemanal'
import PopoverTurno from '../components/PopoverTurno'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import { useSucursalActiva } from '../context/SucursalActivaContext'
import { hmAMinutos, minutosAHM, duracionAMinutos, diaSemanaBackend, fechaToStr, inicioDeSemana } from '../utils/fechas'
import { estadoVisual } from '../utils/turnos'

registerLocale('es', es)

// Fondo de la celda ocupada: se mantiene como color solido de td (no Badge)
// a proposito, para que un turno de mas de 15 min siga viendose como un
// bloque de color continuo a lo largo de varias franjas apiladas. El Badge
// (mismo componente y tokens que CalendarioSemanal.jsx) va solo en la celda
// donde arranca el turno, con el mismo color de estado que el fondo de esa
// celda -> no genera costura visible contra el bloque de abajo.
const CLASE_FONDO_ESTADO = {
  pendiente: 'bg-turno-pendiente',
  confirmado: 'bg-turno-confirmado',
  cancelado: 'bg-turno-cancelado',
  'en-camilla': 'bg-turno-en-camilla',
}

function diaClassName(date) {
  const strDia = fechaToStr(date)
  const strHoy = fechaToStr(new Date())
  if (strDia === strHoy) return 'dia-hoy'
  if (strDia < strHoy) return 'dia-pasado'
  return undefined
}

function conMayusculaInicial(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Mismo algoritmo que usa la vista diaria para "turnos libres" (columnas por
// disponibilidad + franjas de 15 min), pero parametrizado por fecha para poder
// sumarlo sobre los 7 días de la semana en la tarjeta de resumen. No reemplaza
// ni toca el cálculo de la vista diaria (columnas/franjas más abajo en el
// componente) — es una función aparte, de solo lectura, para el agregado semanal.
function contarTurnosLibresEnFecha(fechaObjetivo, { profesionales, excepciones, disponibilidad, cierres, turnos }) {
  const fechaStr = fechaToStr(fechaObjetivo)
  const diaSemana = diaSemanaBackend(fechaObjetivo)

  const columnas = []
  profesionales.forEach((p) => {
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(p.id) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return
    const bloques = disponibilidad
      .filter((d) => String(d.profesional) === String(p.id) && d.dia_semana === diaSemana)
      .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
      .map((d) => ({
        inicio: hmAMinutos(d.hora_inicio.slice(0, 5)),
        fin: hmAMinutos(d.hora_fin.slice(0, 5)),
      }))
    if (bloques.length > 0) columnas.push({ profesionalId: p.id, bloques })
  })

  let minInicio = null
  let maxFin = null
  columnas.forEach(({ bloques }) => bloques.forEach((b) => {
    if (minInicio === null || b.inicio < minInicio) minInicio = b.inicio
    if (maxFin === null || b.fin > maxFin) maxFin = b.fin
  }))

  const franjas = []
  if (minInicio !== null && maxFin !== null) {
    for (let m = minInicio; m < maxFin; m += 15) franjas.push(m)
  }

  const turnosDelDia = turnos.filter((t) => t.fecha === fechaStr)
  const estaEnBloque = (bloques, minuto) => bloques.some((b) => minuto >= b.inicio && minuto < b.fin)
  const turnoQueOcupa = (profesionalId, minuto) => turnosDelDia.find((t) => {
    if (String(t.profesional) !== String(profesionalId)) return false
    const inicio = hmAMinutos(t.hora.slice(0, 5))
    const fin = inicio + duracionAMinutos(t.duracion)
    return minuto >= inicio && minuto < fin
  })

  let libres = 0
  columnas.forEach(({ profesionalId, bloques }) => {
    franjas.forEach((minuto) => {
      if (estaEnBloque(bloques, minuto) && !turnoQueOcupa(profesionalId, minuto)) libres += 1
    })
  })
  return libres
}

export default function CalendarioTurnos() {
  const { sucursalActivaId } = useSucursalActiva()
  const [profesionales, setProfesionales] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [turnos, setTurnos] = useState([])
  // Copia sin filtrar (incluye cancelados) para la vista semanal, que sí
  // distingue "cancelado" con su propio color. La vista diaria sigue usando
  // `turnos` (filtrado) tal como estaba — no se toca su comportamiento.
  const [turnosTodos, setTurnosTodos] = useState([])
  const [excepciones, setExcepciones] = useState([])
  const [cierres, setCierres] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fecha, setFecha] = useState(new Date())
  const [fechaLateral, setFechaLateral] = useState(new Date())
  const [celdaModal, setCeldaModal] = useState(null)
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)
  const [popoverTurno, setPopoverTurno] = useState(null)
  const [vista, setVista] = useState('semana') // 'dia' | 'semana'
  const [searchParams] = useSearchParams()
  const pacienteInicialId = searchParams.get('paciente')

  useEffect(() => {
    Promise.all([
      apiClient.get('/profesionales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/turnos/'),
      apiClient.get('/excepciones/'),
      apiClient.get('/cierres/'),
      apiClient.get('/sucursales/'),
    ])
      .then(([profesionalesRes, disponibilidadRes, turnosRes, excepcionesRes, cierresRes, sucursalesRes]) => {
        setProfesionales(profesionalesRes.data)
        setDisponibilidad(disponibilidadRes.data)
        setTurnos(turnosRes.data.filter((t) => t.estado !== 'cancelado'))
        setTurnosTodos(turnosRes.data)
        setExcepciones(excepcionesRes.data)
        setCierres(cierresRes.data)
        setSucursales(sucursalesRes.data)
      })
      .catch(() => setError('No se pudieron cargar los datos del calendario.'))
      .finally(() => setLoading(false))
  }, [])

  const recargarTurnos = () => {
    apiClient
      .get('/turnos/')
      .then((res) => {
        setTurnos(res.data.filter((t) => t.estado !== 'cancelado'))
        setTurnosTodos(res.data)
      })
      .catch(() => {})
  }

  const cambiarDia = (delta) => {
    const nueva = new Date(fecha)
    nueva.setDate(nueva.getDate() + delta * (vista === 'semana' ? 7 : 1))
    setFecha(nueva)
  }

  const irADiaDesdeSemana = (dia) => {
    setFecha(dia)
    setVista('dia')
  }

  if (loading) {
    return (
      <Layout titulo="Calendario de turnos" filtraPorSucursal>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout titulo="Calendario de turnos" filtraPorSucursal>
        <p className="text-red-600">{error}</p>
      </Layout>
    )
  }

  const fechaStr = fechaToStr(fecha)
  const diaSemana = diaSemanaBackend(fecha)
  const esHoy = fechaStr === fechaToStr(new Date())
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes()
  // mismo margen que usa NuevoTurno.jsx (MARGEN_MINUTOS_MINIMO) para no ofrecer franjas ya vencidas
  const MARGEN_MINUTOS_MINIMO = 30

  const sucursalesPorId = {}
  sucursales.forEach((s) => { sucursalesPorId[s.id] = s.nombre })

  // Filtro de sesión (sucursal activa, ver SucursalActivaContext): con
  // "todas" queda idéntico a como es hoy. `excepciones` queda sin filtrar a
  // propósito — una excepción bloquea el día entero para ese profesional
  // independientemente de la sucursal, mismo comportamiento que ya existía.
  const filtrarPorSucursal = (lista) =>
    sucursalActivaId ? lista.filter((x) => String(x.sucursal) === String(sucursalActivaId)) : lista

  const disponibilidadFiltrada = filtrarPorSucursal(disponibilidad)
  const cierresFiltrados = filtrarPorSucursal(cierres)
  const turnosFiltrados = filtrarPorSucursal(turnos)
  const turnosTodosFiltrados = filtrarPorSucursal(turnosTodos)

  const columnas = []
  profesionales.forEach((p) => {
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(p.id) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return

    const bloques = disponibilidadFiltrada
      .filter((d) => String(d.profesional) === String(p.id) && d.dia_semana === diaSemana)
      .filter((d) => !cierresFiltrados.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
      .map((d) => ({
        inicio: hmAMinutos(d.hora_inicio.slice(0, 5)),
        fin: hmAMinutos(d.hora_fin.slice(0, 5)),
        sucursal: d.sucursal,
      }))

    if (bloques.length === 0) return
    columnas.push({ profesional: p, bloques })
  })

  let minInicio = null
  let maxFin = null
  columnas.forEach(({ bloques }) => {
    bloques.forEach((b) => {
      if (minInicio === null || b.inicio < minInicio) minInicio = b.inicio
      if (maxFin === null || b.fin > maxFin) maxFin = b.fin
    })
  })

  const franjas = []
  if (minInicio !== null && maxFin !== null) {
    for (let m = minInicio; m < maxFin; m += 15) franjas.push(m)
  }

  const turnosDelDia = turnosFiltrados.filter((t) => t.fecha === fechaStr)

  const estaEnBloque = (bloques, minuto) => bloques.some((b) => minuto >= b.inicio && minuto < b.fin)

  const turnoQueOcupa = (profesionalId, minuto) => turnosDelDia.find((t) => {
    if (String(t.profesional) !== String(profesionalId)) return false
    const inicio = hmAMinutos(t.hora.slice(0, 5))
    const fin = inicio + duracionAMinutos(t.duracion)
    return minuto >= inicio && minuto < fin
  })

  const turnosHoy = turnosDelDia.length
  const atendidos = turnosDelDia.filter((t) => t.consulta_id && !t.consulta_pendiente_id).length

  let turnosLibres = 0
  columnas.forEach(({ profesional, bloques }) => {
    franjas.forEach((minuto) => {
      if (estaEnBloque(bloques, minuto) && !turnoQueOcupa(profesional.id, minuto)) turnosLibres += 1
    })
  })

  // Si un profesional atiende en más de una sucursal el mismo día, el label
  // fijo del header (que solo mostraba la del primer bloque) queda
  // engañoso para el resto de la columna. En ese caso el nombre de la
  // sucursal se muestra por bloque, en su primera fila LIBRE (sin turno) —
  // nunca en la fila donde ya arranca un turno, para no competir con su
  // badge por el mismo espacio. Si un bloque queda totalmente ocupado ese
  // día, sencillamente no llega a mostrar su etiqueta.
  columnas.forEach((columna) => {
    const sucursalesDistintas = new Set(columna.bloques.map((b) => b.sucursal))
    columna.mostrarSucursalPorBloque = sucursalesDistintas.size > 1
    columna.etiquetaSucursalPorMinuto = {}
    if (columna.mostrarSucursalPorBloque) {
      columna.bloques.forEach((b) => {
        const minutoLibre = franjas.find(
          (m) => m >= b.inicio && m < b.fin && !turnoQueOcupa(columna.profesional.id, m)
        )
        if (minutoLibre !== undefined) {
          columna.etiquetaSucursalPorMinuto[minutoLibre] = sucursalesPorId[b.sucursal]
        }
      })
    }
  })

  // Agregado semanal para las mismas 3 tarjetas, cuando el modo activo es
  // "semana". No reemplaza los cálculos de arriba (que siguen siendo los que
  // usa/necesita la vista diaria) — son cifras adicionales, solo para mostrar.
  const diasDeLaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioDeSemana(fecha))
    d.setDate(d.getDate() + i)
    return d
  })
  const diasSemanaStr = diasDeLaSemana.map(fechaToStr)
  const turnosDeLaSemana = turnosFiltrados.filter((t) => diasSemanaStr.includes(t.fecha))
  const turnosSemana = turnosDeLaSemana.length
  const atendidosSemana = turnosDeLaSemana.filter((t) => t.consulta_id && !t.consulta_pendiente_id).length
  const turnosLibresSemana = diasDeLaSemana.reduce(
    (total, dia) => total + contarTurnosLibresEnFecha(dia, {
      profesionales, excepciones, disponibilidad: disponibilidadFiltrada, cierres: cierresFiltrados, turnos: turnosFiltrados,
    }),
    0
  )

  // Acción compartida al clickear "Ver ficha completa" desde el popover: abre
  // la ficha del paciente. La dispara tanto la vista diaria como la semanal,
  // siempre a través del popover (ver más abajo) — ninguna de las dos abre
  // FichaPacienteModal directo al clickear un turno.
  const abrirFichaDesdeTurno = (turno) => setPacienteAbiertoId(turno.paciente)

  // Clickear un turno ya ocupado (vista diaria O semanal) no abre la ficha
  // directo — muestra un popover chico con referencia rápida + confirmar/
  // cancelar (mismo POST /turnos/{id}/confirmar|cancelar/ que ya usan
  // Turnos.jsx y Camillas.jsx). "Ver ficha completa" adentro del popover es
  // lo único que sigue yendo a FichaPacienteModal. Mismo estado/handlers
  // para las dos vistas — CalendarioSemanal solo manda un anchorRect más
  // chico (el del chip de turno, no el de toda la celda), el cálculo de
  // posición de PopoverTurno no distingue el tamaño del ancla.
  const confirmarTurnoDesdePopover = async () => {
    if (!popoverTurno) return
    try {
      await apiClient.post(`/turnos/${popoverTurno.turno.id}/confirmar/`)
      setPopoverTurno(null)
      recargarTurnos()
    } catch {
      alert('No se pudo confirmar el turno.')
    }
  }

  const cancelarTurnoDesdePopover = async () => {
    if (!popoverTurno) return
    if (!confirm('¿Cancelar este turno?')) return
    try {
      await apiClient.post(`/turnos/${popoverTurno.turno.id}/cancelar/`)
      setPopoverTurno(null)
      recargarTurnos()
    } catch {
      alert('No se pudo cancelar el turno.')
    }
  }

  const verFichaDesdePopover = () => {
    if (!popoverTurno) return
    abrirFichaDesdeTurno(popoverTurno.turno)
    setPopoverTurno(null)
  }

  const handleClickCelda = (profesionalId, disponible, turno, minuto, event) => {
    if (turno) {
      setPopoverTurno({ turno, anchorRect: event.currentTarget.getBoundingClientRect() })
      return
    }
    if (!disponible) return
    const columna = columnas.find((c) => String(c.profesional.id) === String(profesionalId))
    const bloque = columna?.bloques.find((b) => minuto >= b.inicio && minuto < b.fin)
    if (!columna || !bloque) return
    setCeldaModal({
      profesional: columna.profesional,
      sucursalId: bloque.sucursal,
      fecha: fechaStr,
      hora: minutosAHM(minuto),
    })
  }

  const handleClickLibrePanel = (profesionalId, sucursalId, minuto) => {
    const profesional = profesionales.find((p) => String(p.id) === String(profesionalId))
    if (!profesional) return
    setCeldaModal({
      profesional,
      sucursalId,
      fecha: fechaToStr(fechaLateral),
      hora: minutosAHM(minuto),
    })
  }

  return (
    <Layout
      titulo="Calendario de turnos"
      filtraPorSucursal
      controles={
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 rounded p-1">
            <button
              onClick={() => setVista('dia')}
              className={`text-sm px-3 py-1 rounded ${vista === 'dia' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Día
            </button>
            <button
              onClick={() => setVista('semana')}
              className={`text-sm px-3 py-1 rounded ${vista === 'semana' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Semana
            </button>
          </div>
          <Boton to="/turnos/lista" variante="ghost" tamaño="sm">Ver lista</Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => cambiarDia(-1)}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {vista === 'semana' ? '← Semana anterior' : '← Día anterior'}
          </button>
          <input
            type="date"
            value={fechaStr}
            onChange={(e) => setFecha(new Date(`${e.target.value}T00:00:00`))}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => cambiarDia(1)}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {vista === 'semana' ? 'Semana siguiente →' : 'Día siguiente →'}
          </button>
          {vista === 'semana' ? (
            <span className="text-sm text-slate-500">
              {conMayusculaInicial(
                `Semana del ${inicioDeSemana(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} al ${(() => {
                  const domingo = new Date(inicioDeSemana(fecha))
                  domingo.setDate(domingo.getDate() + 6)
                  return domingo.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
                })()}`
              )}
            </span>
          ) : (
            <span className="text-sm text-slate-500">
              {conMayusculaInicial(fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))}
            </span>
          )}

          {/* Contadores: un solo item de flex para el bloque de navegación de
              arriba, así en pantallas angostas los 3 bajan juntos a una
              segunda fila en vez de desparramarse uno por uno. */}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center min-w-[84px]">
              <p className="text-base font-bold text-slate-800 leading-tight">{vista === 'semana' ? turnosSemana : turnosHoy}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{vista === 'semana' ? 'Turnos esta semana' : 'Turnos hoy'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center min-w-[84px]">
              <p className="text-base font-bold text-slate-800 leading-tight">{vista === 'semana' ? atendidosSemana : atendidos}</p>
              <p className="text-[10px] text-slate-500 leading-tight">Atendidos</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center min-w-[84px]">
              <p className="text-base font-bold text-slate-800 leading-tight">{vista === 'semana' ? turnosLibresSemana : turnosLibres}</p>
              <p className="text-[10px] text-slate-500 leading-tight">Turnos libres</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
            {vista === 'semana' ? (
              <CalendarioSemanal
                fecha={fecha}
                turnos={turnosTodosFiltrados}
                onSeleccionarDia={irADiaDesdeSemana}
                onClickTurno={(turno, anchorRect) => setPopoverTurno({ turno, anchorRect })}
                onCrearTurno={setCeldaModal}
                profesionales={profesionales}
                disponibilidad={disponibilidadFiltrada}
                excepciones={excepciones}
                cierres={cierresFiltrados}
              />
            ) : columnas.length === 0 ? (
              <p className="text-slate-500 text-sm">Nadie atiende este día.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 text-left text-slate-500 border-b border-slate-200 pb-2">Hora</th>
                    {columnas.map(({ profesional, bloques, mostrarSucursalPorBloque }) => (
                      <th key={profesional.id} className="text-left text-slate-700 border-b border-slate-200 pb-2 px-2 min-w-[140px]">
                        <div>{profesional.nombre} {profesional.apellido}</div>
                        {!mostrarSucursalPorBloque && !sucursalActivaId && sucursalesPorId[bloques[0].sucursal] && (
                          <div className="text-[10px] font-normal text-slate-400">{sucursalesPorId[bloques[0].sucursal]}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {franjas.map((minuto) => (
                    <tr key={minuto}>
                      <td className="text-slate-500 py-1 pr-2 align-top border-b border-slate-50">{minutosAHM(minuto)}</td>
                      {columnas.map(({ profesional, bloques, mostrarSucursalPorBloque, etiquetaSucursalPorMinuto }) => {
                        const disponible = estaEnBloque(bloques, minuto)
                        const turno = turnoQueOcupa(profesional.id, minuto)
                        const ocupado = Boolean(turno)
                        const esInicioTurno = ocupado && hmAMinutos(turno.hora.slice(0, 5)) === minuto
                        const pasado = esHoy && minuto < ahoraMin + MARGEN_MINUTOS_MINIMO
                        const estado = ocupado ? estadoVisual(turno) : null
                        const clickeable = disponible && !ocupado && !pasado

                        let claseColor = 'bg-slate-50'
                        if (disponible && !ocupado) {
                          claseColor = pasado ? 'bg-slate-200' : 'bg-page'
                        }
                        if (ocupado) claseColor = CLASE_FONDO_ESTADO[estado]

                        // Badge (tamaño="xs") solo en la celda de inicio. La
                        // continuidad visual de un turno de mas de 15 min depende
                        // de que el color del Badge (token del estado) coincida
                        // exacto con el fondo del td de abajo (CLASE_FONDO_ESTADO,
                        // mismo estado) — al ser el mismo color, las puntas
                        // redondeadas del Badge quedan invisibles contra el padding
                        // del propio td y se lee como un solo bloque continuo. Si
                        // alguna vez se desalinean (un token cambia de un lado y no
                        // del otro, o el Badge suma borde/sombra propia), la costura
                        // entre la celda de inicio y las de continuacion se va a notar.
                        let contenido = null
                        if (esInicioTurno) {
                          const badge = (
                            <Badge estado={estado} tamaño="xs" className="w-full">
                              <span className="truncate min-w-0">{turno.paciente_nombre}</span>
                            </Badge>
                          )
                          contenido = turno.tipo_turno_texto ? (
                            <span className="group relative inline-flex w-full">
                              {badge}
                              <span className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 max-w-[180px] whitespace-normal text-center rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                                {turno.tipo_turno_texto}
                              </span>
                            </span>
                          ) : badge
                        } else if (mostrarSucursalPorBloque && etiquetaSucursalPorMinuto[minuto]) {
                          contenido = (
                            <span className="text-[10px] text-slate-400 italic">{etiquetaSucursalPorMinuto[minuto]}</span>
                          )
                        }

                        return (
                          <td
                            key={profesional.id}
                            onClick={(e) => handleClickCelda(profesional.id, disponible && !pasado, turno, minuto, e)}
                            className={`border-b border-slate-50 px-2 py-1 align-top ${claseColor} ${
                              clickeable ? 'cursor-pointer hover:brightness-95 transition-[filter]' : ''
                            }`}
                          >
                            {contenido}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4 h-fit minicalendario">
              <DatePicker
                inline
                locale="es"
                selected={fechaLateral}
                onChange={(nueva) => setFechaLateral(nueva)}
                dayClassName={diaClassName}
              />
            </div>

            <PanelFranjasHorarias
              titulo="Turnos del día"
              fecha={fechaLateral}
              idsRelevantes={profesionales.map((p) => p.id)}
              disponibilidad={disponibilidadFiltrada}
              excepciones={excepciones}
              cierres={cierresFiltrados}
              turnos={turnosFiltrados}
              mostrarProfesional
              profesionales={profesionales}
              onClickLibre={handleClickLibrePanel}
            />
          </div>
        </div>
      </div>

      {celdaModal && (
        <NuevoTurnoModal
          profesional={celdaModal.profesional}
          sucursalId={celdaModal.sucursalId}
          fecha={celdaModal.fecha}
          hora={celdaModal.hora}
          pacienteInicialId={pacienteInicialId}
          onClose={() => setCeldaModal(null)}
          onCreado={() => {
            setCeldaModal(null)
            recargarTurnos()
          }}
        />
      )}

      {pacienteAbiertoId && (
        <FichaPacienteModal
          pacienteId={pacienteAbiertoId}
          onClose={() => setPacienteAbiertoId(null)}
        />
      )}

      {popoverTurno && (
        <PopoverTurno
          turno={popoverTurno.turno}
          anchorRect={popoverTurno.anchorRect}
          onClose={() => setPopoverTurno(null)}
          onConfirmar={confirmarTurnoDesdePopover}
          onCancelar={cancelarTurnoDesdePopover}
          onVerFicha={verFichaDesdePopover}
        />
      )}
    </Layout>
  )
}
