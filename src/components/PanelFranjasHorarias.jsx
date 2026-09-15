import { hmAMinutos, minutosAHM, duracionAMinutos, diaSemanaBackend, fechaToStr } from '../utils/fechas'
import { abreviarPaciente, inicialesDe } from '../utils/nombres'
import Tooltip from './Tooltip'

const MARGEN_MINUTOS_MINIMO = 30

export default function PanelFranjasHorarias({
  titulo, fecha, idsRelevantes, disponibilidad, excepciones, cierres, turnos, mostrarProfesional,
  profesionales, onClickLibre,
}) {
  const fechaStr = fechaToStr(fecha)
  const diaSemana = diaSemanaBackend(fecha)
  const esHoy = fechaStr === fechaToStr(new Date())
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes()

  const profesionalesPorId = {}
  ;(profesionales || []).forEach((p) => { profesionalesPorId[p.id] = p })

  const bloquesPorProfesional = {}
  idsRelevantes.forEach((profId) => {
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(profId) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return
    const bloques = disponibilidad
      .filter((d) => String(d.profesional) === String(profId) && d.dia_semana === diaSemana)
      .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
      .map((d) => ({
        inicio: hmAMinutos(d.hora_inicio.slice(0, 5)),
        fin: hmAMinutos(d.hora_fin.slice(0, 5)),
        sucursal: d.sucursal,
      }))
    if (bloques.length > 0) bloquesPorProfesional[profId] = bloques
  })

  let minInicio = null
  let maxFin = null
  Object.values(bloquesPorProfesional).forEach((bloques) => {
    bloques.forEach((b) => {
      if (minInicio === null || b.inicio < minInicio) minInicio = b.inicio
      if (maxFin === null || b.fin > maxFin) maxFin = b.fin
    })
  })

  const franjas = []
  if (minInicio !== null && maxFin !== null) {
    for (let m = minInicio; m < maxFin; m += 15) franjas.push(m)
  }

  const turnosPanel = turnos.filter(
    (t) => t.fecha === fechaStr
      && (t.estado === 'confirmado' || t.estado === 'pendiente')
      && idsRelevantes.map(String).includes(String(t.profesional))
  )

  const turnosEnFranja = (minuto) => turnosPanel.filter((t) => {
    const inicio = hmAMinutos(t.hora.slice(0, 5))
    const fin = inicio + duracionAMinutos(t.duracion)
    return minuto >= inicio && minuto < fin
  })

  const libresEnFranja = (minuto, ocupantes) => {
    if (!onClickLibre) return []
    if (esHoy && minuto < ahoraMin + MARGEN_MINUTOS_MINIMO) return []
    const libres = []
    Object.entries(bloquesPorProfesional).forEach(([profId, bloques]) => {
      const bloque = bloques.find((b) => minuto >= b.inicio && minuto < b.fin)
      if (!bloque) return
      if (ocupantes.some((t) => String(t.profesional) === String(profId))) return
      libres.push({ profesionalId: profId, sucursal: bloque.sucursal })
    })
    return libres
  }

  const filasPanel = []
  franjas.forEach((minuto) => {
    const ocupantes = turnosEnFranja(minuto)
    if (ocupantes.length > 0) {
      filasPanel.push({ tipo: 'ocupada', minuto, ocupantes })
      return
    }
    const libres = libresEnFranja(minuto, ocupantes)
    if (libres.length > 0) {
      filasPanel.push({ tipo: 'libre-clickeable', minuto, libres })
      return
    }
    const ultima = filasPanel[filasPanel.length - 1]
    if (ultima && ultima.tipo === 'libre' && ultima.fin === minuto) {
      ultima.fin = minuto + 15
    } else {
      filasPanel.push({ tipo: 'libre', inicio: minuto, fin: minuto + 15 })
    }
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-3 h-fit">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-slate-800 text-sm">{titulo}</h2>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
          {turnosPanel.length}
        </span>
      </div>
      {franjas.length === 0 ? (
        <p className="text-slate-400 text-xs">Sin disponibilidad configurada para este día.</p>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto">
          {filasPanel.map((fila, idx) => {
            if (fila.tipo === 'libre') {
              return (
                <div key={`libre-${idx}`} className="text-xs text-slate-300 py-1.5 border-b border-slate-50">
                  {minutosAHM(fila.inicio)} - {minutosAHM(fila.fin)} — libre
                </div>
              )
            }
            if (fila.tipo === 'libre-clickeable') {
              return (
                <div key={`libreclick-${fila.minuto}`} className="flex items-start gap-2 text-xs py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 w-12 shrink-0">{minutosAHM(fila.minuto)}</span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {fila.libres.map((l) => {
                      const prof = profesionalesPorId[l.profesionalId]
                      return (
                        <button
                          key={l.profesionalId}
                          onClick={() => onClickLibre(l.profesionalId, l.sucursal, fila.minuto)}
                          className="rounded px-1.5 py-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs"
                        >
                          {prof ? `${prof.nombre} ${prof.apellido}` : 'Profesional'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }
            return (
              <div key={fila.minuto} className="flex items-start gap-2 text-xs py-1.5 border-b border-slate-50">
                <span className="text-slate-400 w-12 shrink-0">{minutosAHM(fila.minuto)}</span>
                <div className="flex-1 space-y-1">
                  {fila.ocupantes.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded px-1.5 py-1 flex items-center gap-1.5 ${
                        t.estado === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      <span className="truncate min-w-0">{abreviarPaciente(t.paciente_nombre)}</span>
                      {mostrarProfesional && (
                        <Tooltip texto={t.profesional_nombre} className="shrink-0">
                          <span className="w-3.5 h-3.5 rounded-full bg-white/70 text-[8px] flex items-center justify-center font-bold">
                            {inicialesDe(t.profesional_nombre)}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
