import { hmAMinutos, duracionAMinutos, diaSemanaBackend, fechaToStr, inicioDeSemana } from '../utils/fechas'
import { abreviarPaciente, inicialesDe } from '../utils/nombres'
import Tooltip from './Tooltip'

// PRUEBA VISUAL (rama prueba-sidebar-visual): vista semanal nueva, complementaria
// a la vista diaria de CalendarioTurnos.jsx (que no se toca). Agrupa los turnos
// de todos los profesionales por día+hora — la distinción por profesional ya la
// resuelve la vista diaria (columnas = profesionales).

const NOMBRES_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORA_MIN_DEFAULT = 8
const HORA_MAX_DEFAULT = 20

// Nombres de clase literales (no interpolados) para que Tailwind los detecte.
// Texto por estado (no un gris fijo): los tokens de fondo/texto vienen
// pensados en pares para tener buen contraste entre sí (ver Badge.jsx).
const CLASE_COLOR_ESTADO = {
  pendiente: 'bg-turno-pendiente text-turno-pendiente-text',
  confirmado: 'bg-turno-confirmado text-turno-confirmado-text',
  'en-camilla': 'bg-turno-en-camilla text-turno-en-camilla-text',
  cancelado: 'bg-turno-cancelado text-turno-cancelado-text',
}

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
      onClick={() => onClick?.(turno)}
      title={`${turno.hora.slice(0, 5)} — ${turno.paciente_nombre}`}
      className={`rounded px-1.5 py-1 text-[10px] leading-tight ${CLASE_COLOR_ESTADO[estado]} min-w-0 w-full flex items-center gap-1 whitespace-nowrap hover:brightness-95 transition-[filter]`}
    >
      <span className="font-semibold shrink-0">{turno.hora.slice(0, 5)}</span>
      <span className="shrink-0">-</span>
      <span className="truncate min-w-0">{abreviarPaciente(turno.paciente_nombre)}</span>
      <span className="shrink-0">-</span>
      {/* Iniciales del profesional en un chip circular neutro (blanco
          translúcido) — sin color propio, para no competir con el color de
          estado del bloque. Nombre completo del profesional queda solo en
          este tooltip (se sacó del title del botón para no duplicarlo). */}
      <Tooltip texto={turno.profesional_nombre}>
        <span className="w-3.5 h-3.5 rounded-full bg-white/70 text-[8px] flex items-center justify-center font-bold shrink-0">
          {inicialesDe(turno.profesional_nombre)}
        </span>
      </Tooltip>
    </button>
  )
}

export default function CalendarioSemanal({
  fecha,
  turnos,
  onSeleccionarDia,
  onClickTurno,
  profesionales = [],
  disponibilidad = [],
  excepciones = [],
  cierres = [],
}) {
  const lunes = inicioDeSemana(fecha)
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + i)
    return d
  })
  const diasStr = dias.map(fechaToStr)
  const hoyStr = fechaToStr(new Date())

  const turnosSemana = turnos.filter((t) => diasStr.includes(t.fecha))

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
  // agrupa por hora igual que turnosPorDiaHora de arriba.
  const profesionalesDisponiblesEn = (diaIdx, hora) => {
    const fechaStr = diasStr[diaIdx]
    const diaSemana = diaSemanaBackend(dias[diaIdx])
    return profesionales.filter((p) => {
      const tieneExcepcion = excepciones.some(
        (ex) => String(ex.profesional) === String(p.id) && ex.fecha === fechaStr
      )
      if (tieneExcepcion) return false
      const bloques = disponibilidad
        .filter((d) => String(d.profesional) === String(p.id) && d.dia_semana === diaSemana)
        .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
      return bloques.some((b) => {
        const inicio = hmAMinutos(b.hora_inicio.slice(0, 5))
        const fin = hmAMinutos(b.hora_fin.slice(0, 5))
        return inicio < (hora + 1) * 60 && fin > hora * 60
      })
    })
  }

  // Fondo de la celda cuando NO tiene turnos ya asignados (si los tiene, se
  // ve el/los BloqueTurno con su propio color de estado y esto no se toca):
  // gris si nadie atiende, verde pálido si hay lugar libre, rosa "bloqueado"
  // si todos los profesionales disponibles esa hora ya están ocupados.
  const colorFondoCelda = (diaIdx, hora) => {
    const disponibles = profesionalesDisponiblesEn(diaIdx, hora)
    if (disponibles.length === 0) return 'bg-slot-vacio'

    const idsDisponibles = new Set(disponibles.map((p) => String(p.id)))
    const items = turnosPorDiaHora[`${diaIdx}-${hora}`] || []
    const idsOcupados = new Set(
      items
        .filter((t) => t.estado !== 'cancelado' && idsDisponibles.has(String(t.profesional)))
        .map((t) => String(t.profesional))
    )

    if (idsOcupados.size === 0) return 'bg-slot-libre'
    if (idsOcupados.size >= idsDisponibles.size) return 'bg-slot-bloqueado'
    return '' // parcialmente ocupado: comportamiento actual, sin fondo especial
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
              return (
                <div
                  key={diaIdx}
                  className={`border-t border-l border-slate-100 p-1 flex flex-col gap-1 min-h-[44px] ${colorFondoCelda(diaIdx, h)}`}
                >
                  {items.map((t) => <BloqueTurno key={t.id} turno={t} onClick={onClickTurno} />)}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
