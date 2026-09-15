import { useState } from 'react'
import { hmAMinutos, duracionAMinutos, diaSemanaBackend, fechaToStr, inicioDeSemana } from '../utils/fechas'
import { abreviarPaciente, inicialesDe } from '../utils/nombres'
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

// "En camilla" no es un Turno.estado — se deriva igual que en Camillas.jsx
// (hora_llamado seteada + la consulta que generó todavía sigue pendiente).
// "ausente" no tiene token de color propio pedido; se agrupa con "cancelado"
// (el turno ya no está "en curso").
function estadoVisual(turno) {
  if (turno.estado === 'cancelado' || turno.estado === 'ausente') return 'cancelado'
  if (turno.hora_llamado && turno.consulta_pendiente_id) return 'en-camilla'
  if (turno.estado === 'confirmado') return 'confirmado'
  return 'pendiente'
}

function BloqueTurno({ turno, onClick }) {
  const estado = estadoVisual(turno)
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
        <Tooltip texto={turno.profesional_nombre}>
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

  // Mismo cálculo de disponibilidad que usa la vista diaria (CalendarioTurnos.jsx):
  // profesional con un bloque de disponibilidad ese día de la semana, sin
  // excepción puntual para esa fecha ni cierre de sucursal ese día. Acá se
  // resuelve por hora (bucket), no por franja de 15 min, porque esta vista
  // agrupa por hora igual que turnosPorDiaHora de arriba. Devuelve el bloque
  // (no solo un booleano) porque hace falta su sucursal para dar de alta un
  // turno nuevo — ver asignarTurno más abajo.
  const bloqueDisponibleDe = (profesionalId, diaIdx, hora) => {
    const fechaStr = diasStr[diaIdx]
    const diaSemana = diaSemanaBackend(dias[diaIdx])
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(profesionalId) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return null
    const bloques = disponibilidad
      .filter((d) => String(d.profesional) === String(profesionalId) && d.dia_semana === diaSemana)
      .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
    return (
      bloques.find((b) => {
        const inicio = hmAMinutos(b.hora_inicio.slice(0, 5))
        const fin = hmAMinutos(b.hora_fin.slice(0, 5))
        return inicio < (hora + 1) * 60 && fin > hora * 60
      }) || null
    )
  }

  const profesionalesDisponiblesEn = (diaIdx, hora) =>
    profesionales.filter((p) => bloqueDisponibleDe(p.id, diaIdx, hora))

  // Subconjunto de "disponibles" que todavía no tiene un turno asignado en
  // este día+hora — a estos se les puede dar de alta un turno nuevo al
  // clickear la celda (ver handleClickCelda).
  const profesionalesLibresEn = (diaIdx, hora) => {
    const disponibles = profesionalesDisponiblesEn(diaIdx, hora)
    const items = turnosPorDiaHora[`${diaIdx}-${hora}`] || []
    // Sin filtro de estado acá: turnosPorDiaHora ya excluye los cancelados
    // (turnosSemana los saca desde el origen, más arriba).
    const idsOcupados = new Set(
      items
        .filter((t) => disponibles.some((p) => String(p.id) === String(t.profesional)))
        .map((t) => String(t.profesional))
    )
    return disponibles.filter((p) => !idsOcupados.has(String(p.id)))
  }

  // Da de alta el turno con el profesional ya resuelto (uno solo disponible,
  // o el elegido en el popover) — mismo modal que usa la vista diaria
  // (NuevoTurnoModal, vía el callback onCrearTurno que arma el padre). La
  // hora queda fija al inicio del bucket (HH:00): esta vista agrupa por
  // hora, no tiene granularidad de minuto para ofrecer otra cosa.
  const asignarTurno = (diaIdx, hora, profesional) => {
    const bloque = bloqueDisponibleDe(profesional.id, diaIdx, hora)
    if (!bloque) return
    onCrearTurno?.({
      profesional,
      sucursalId: bloque.sucursal,
      fecha: diasStr[diaIdx],
      hora: `${String(hora).padStart(2, '0')}:00`,
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
                  {items.map((t) => <BloqueTurno key={t.id} turno={t} onClick={onClickTurno} />)}
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
