import { useState } from 'react'
import { hmAMinutos, minutosAHM, duracionAMinutos, diaSemanaBackend, fechaToStr, inicioDeSemana } from '../utils/fechas'
import { abreviarPaciente, inicialesDe } from '../utils/nombres'
import { estadoVisual } from '../utils/turnos'
import Tooltip from './Tooltip'
import Badge from './Badge'
import PopoverElegirProfesional from './PopoverElegirProfesional'

// PRUEBA VISUAL (rama prueba-sidebar-visual): vista semanal nueva, complementaria
// a la vista diaria de CalendarioTurnos.jsx (que no se toca). Agrupa los turnos
// de todos los profesionales por día+hora — la distinción por profesional ya la
// resuelve la vista diaria (columnas = profesionales).

const NOMBRES_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORA_MIN_DEFAULT = 8
const HORA_MAX_DEFAULT = 20

function BloqueTurno({ turno, sucursalNombre, onClick }) {
  const estado = estadoVisual(turno)
  const tooltipTexto = sucursalNombre ? `${turno.profesional_nombre} — ${sucursalNombre}` : turno.profesional_nombre
  return (
    <button
      type="button"
      onClick={(e) => {
        // La celda que contiene este bloque también es clickeable (para dar
        // de alta un turno en el lugar libre restante, si lo hay) — sin esto
        // el click en un turno existente dispara los dos handlers a la vez.
        e.stopPropagation()
        // anchorRect del chip (más chico que una celda de la vista diaria) —
        // el posicionamiento de PopoverTurno solo usa el rect, no le importa
        // el tamaño del elemento que lo generó.
        onClick?.(turno, e.currentTarget.getBoundingClientRect())
      }}
      title={`${turno.hora.slice(0, 5)} — ${turno.paciente_nombre}`}
      className="w-full text-left hover:brightness-95 transition-[filter]"
    >
      <Badge estado={estado} className="w-full gap-1 whitespace-nowrap">
        <span className="font-semibold shrink-0">{turno.hora.slice(0, 5)}</span>
        <span className="shrink-0">-</span>
        <span className="truncate min-w-0">{abreviarPaciente(turno.paciente_nombre)}</span>
        <span className="shrink-0">-</span>
        {/* Iniciales del profesional en un chip circular translúcido, mismo
            criterio que antes de la simplificación: contrasta bien sobre
            cualquiera de los colores de estado del Badge. Nombre completo
            del profesional queda solo en este tooltip. */}
        <Tooltip texto={tooltipTexto}>
          <span className="w-3.5 h-3.5 rounded-full bg-white/70 text-[8px] flex items-center justify-center font-bold shrink-0">
            {inicialesDe(turno.profesional_nombre)}
          </span>
        </Tooltip>
      </Badge>
    </button>
  )
}

export default function CalendarioSemanal({
  fecha,
  turnos,
  onSeleccionarDia,
  onClickTurno,
  onCrearTurno,
  profesionales = [],
  disponibilidad = [],
  excepciones = [],
  cierres = [],
  sucursalesPorId = {},
}) {
  const [popoverElegir, setPopoverElegir] = useState(null)

  const lunes = inicioDeSemana(fecha)
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + i)
    return d
  })
  const diasStr = dias.map(fechaToStr)
  const hoyStr = fechaToStr(new Date())

  // Los turnos cancelados no se muestran en esta grilla (a pedido: la celda
  // queda como si el turno nunca hubiese existido visualmente) — pero el
  // registro no se toca en la base, Turno.estado se queda en 'cancelado'
  // igual que siempre ("Turno se cancela, nunca se borra"), disponible para
  // estadísticas y para la vista diaria, que no se toca acá.
  const turnosSemana = turnos.filter((t) => diasStr.includes(t.fecha) && t.estado !== 'cancelado')

  // Si el calendario ya viene filtrado por una sucursal activa (ver
  // CalendarioTurnos.jsx), acá solo va a quedar una sucursal distinta y el
  // tooltip no necesita mostrarla — se deriva de los datos, no de un flag
  // aparte, mismo criterio que la vista Día (5c): con el filtro puesto, esta
  // cuenta da 1 sola y el tooltip queda igual que hoy.
  const hayMasDeUnaSucursal = new Set(turnosSemana.map((t) => t.sucursal)).size > 1

  let horaMin = HORA_MIN_DEFAULT
  let horaMax = HORA_MAX_DEFAULT
  turnosSemana.forEach((t) => {
    const inicioMin = hmAMinutos(t.hora.slice(0, 5))
    const finMin = inicioMin + duracionAMinutos(t.duracion)
    horaMin = Math.min(horaMin, Math.floor(inicioMin / 60))
    horaMax = Math.max(horaMax, Math.ceil(finMin / 60))
  })

  const horas = []
  for (let h = horaMin; h < horaMax; h++) horas.push(h)

  // Cada turno se agrupa por su hora de inicio (bucket por hora, no proporcional
  // a la duración) — es una vista general, no un timeline al minuto.
  const turnosPorDiaHora = {}
  turnosSemana.forEach((t) => {
    const diaIdx = diasStr.indexOf(t.fecha)
    const hora = Math.floor(hmAMinutos(t.hora.slice(0, 5)) / 60)
    const key = `${diaIdx}-${hora}`
    ;(turnosPorDiaHora[key] ||= []).push(t)
  })

  // Reemplaza a bloqueDisponibleDe + profesionalesDisponiblesEn (ver historial
  // del archivo). Calcula el primer hueco real de 15 min, libre de turnos,
  // para este profesional dentro de esta hora — recorriendo franja a franja
  // (00/15/30/45) en vez de tratar la hora como un bloque atómico. Antes, un
  // solo turno de 15 min bloqueaba la hora entera para ese profesional aunque
  // le quedaran 45 min libres. null si no tiene ningún hueco (sin
  // disponibilidad configurada, excepción puntual, cierre de sucursal, o ya
  // todo ocupado).
  const primerHuecoLibreDe = (profesionalId, diaIdx, hora) => {
    const fechaStr = diasStr[diaIdx]
    const diaSemana = diaSemanaBackend(dias[diaIdx])
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(profesionalId) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return null

    const bloques = disponibilidad
      .filter((d) => String(d.profesional) === String(profesionalId) && d.dia_semana === diaSemana)
      .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
    if (bloques.length === 0) return null

    const turnosDelProfesional = turnosSemana.filter(
      (t) => String(t.profesional) === String(profesionalId) && t.fecha === fechaStr
    )
    const ocupaMinuto = (minuto) => turnosDelProfesional.some((t) => {
      const inicio = hmAMinutos(t.hora.slice(0, 5))
      return minuto >= inicio && minuto < inicio + duracionAMinutos(t.duracion)
    })

    for (let m = hora * 60; m < (hora + 1) * 60; m += 15) {
      const bloque = bloques.find((b) => {
        const inicio = hmAMinutos(b.hora_inicio.slice(0, 5))
        const fin = hmAMinutos(b.hora_fin.slice(0, 5))
        return m >= inicio && m < fin
      })
      if (bloque && !ocupaMinuto(m)) return { minuto: m, sucursal: bloque.sucursal }
    }
    return null
  }

  // Profesionales con al menos un hueco real de 15 min libre en esta hora —
  // a estos se les puede dar de alta un turno nuevo al clickear la celda
  // (ver handleClickCelda).
  const profesionalesLibresEn = (diaIdx, hora) =>
    profesionales.filter((p) => primerHuecoLibreDe(p.id, diaIdx, hora) !== null)

  // Da de alta el turno con el profesional ya resuelto (uno solo libre, o el
  // elegido en el popover) — mismo modal que usa la vista diaria
  // (NuevoTurnoModal, vía el callback onCrearTurno que arma el padre). La
  // hora ya no queda fija al inicio del bucket (HH:00): usa el primer hueco
  // real libre de ese profesional dentro de la hora clickeada.
  const asignarTurno = (diaIdx, hora, profesional) => {
    const hueco = primerHuecoLibreDe(profesional.id, diaIdx, hora)
    if (!hueco) return
    onCrearTurno?.({
      profesional,
      sucursalId: hueco.sucursal,
      fecha: diasStr[diaIdx],
      hora: minutosAHM(hueco.minuto),
    })
  }

  const handleClickCelda = (diaIdx, hora, event) => {
    const libres = profesionalesLibresEn(diaIdx, hora)
    if (libres.length === 0) return
    if (libres.length === 1) {
      asignarTurno(diaIdx, hora, libres[0])
      return
    }
    setPopoverElegir({
      diaIdx,
      hora,
      profesionales: libres,
      anchorRect: event.currentTarget.getBoundingClientRect(),
    })
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[56px_repeat(7,minmax(110px,1fr))] min-w-[850px]">
        <div />
        {dias.map((d, i) => {
          const esHoy = diasStr[i] === hoyStr
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSeleccionarDia(d)}
              className={`text-center py-2 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                esHoy ? 'text-primary' : 'text-slate-600'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide">{NOMBRES_DIA[i]}</div>
              <div className={`text-sm ${esHoy ? 'font-semibold' : ''}`}>{d.getDate()}</div>
            </button>
          )
        })}

        {horas.map((h) => (
          <div key={h} className="contents">
            <div className="text-[11px] text-slate-400 text-right pr-2 pt-1 border-t border-slate-100">
              {String(h).padStart(2, '0')}:00
            </div>
            {dias.map((_, diaIdx) => {
              const items = turnosPorDiaHora[`${diaIdx}-${h}`] || []
              // Clickeable con disponibilidad real: hay al menos un
              // profesional libre para asignarle un turno nuevo acá. No
              // clickeable si nadie atiende esa hora o si ya está todo
              // ocupado — pero esto ya no se refleja en el color de fondo,
              // solo en el cursor/hover (ver objetivo de este cambio: celdas
              // libres neutras, el color queda solo en el Badge del turno).
              const clickable = profesionalesLibresEn(diaIdx, h).length > 0
              return (
                <div
                  key={diaIdx}
                  onClick={clickable ? (e) => handleClickCelda(diaIdx, h, e) : undefined}
                  className={`border-t border-l border-slate-100 p-1 flex flex-col gap-1 min-h-[44px] bg-page ${
                    clickable ? 'cursor-pointer hover:brightness-95 transition-[filter]' : ''
                  }`}
                >
                  {items.map((t) => (
                    <BloqueTurno
                      key={t.id}
                      turno={t}
                      sucursalNombre={hayMasDeUnaSucursal ? sucursalesPorId[t.sucursal] : null}
                      onClick={onClickTurno}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {popoverElegir && (
        <PopoverElegirProfesional
          profesionales={popoverElegir.profesionales}
          anchorRect={popoverElegir.anchorRect}
          onClose={() => setPopoverElegir(null)}
          onElegir={(p) => {
            asignarTurno(popoverElegir.diaIdx, popoverElegir.hora, p)
            setPopoverElegir(null)
          }}
        />
      )}
    </div>
  )
}
