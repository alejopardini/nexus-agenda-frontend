// Popover chico (rama prueba-sidebar-visual): cuando una celda libre de
// CalendarioSemanal.jsx tiene más de un profesional disponible esa hora, hay
// que elegir a cuál asignar el turno nuevo antes de abrir NuevoTurnoModal
// (que solo acepta un profesional ya determinado, igual que la vista diaria).
// Mismo patrón de posicionamiento que PopoverTurno.jsx (anchorRect + clamp).
//
// Uso:
// <PopoverElegirProfesional
//   profesionales={disponibles}
//   anchorRect={celda.getBoundingClientRect()}
//   onClose={...}
//   onElegir={(profesional) => ...}
// />

import { useLayoutEffect, useState } from 'react'
import Card from './Card'
import { inicialesDe } from '../utils/nombres'
import useClickOutside from '../hooks/useClickOutside'

const MARGEN_VIEWPORT = 8
const ANCHO_POPOVER = 224 // w-56

export default function PopoverElegirProfesional({ profesionales, anchorRect, onClose, onElegir }) {
  const ref = useClickOutside(onClose)
  const [posicion, setPosicion] = useState(null)

  useLayoutEffect(() => {
    if (!ref.current || !anchorRect) return
    const alto = ref.current.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorRect.bottom + MARGEN_VIEWPORT
    let left = anchorRect.left

    if (top + alto > vh - MARGEN_VIEWPORT) {
      top = anchorRect.top - alto - MARGEN_VIEWPORT
    }
    if (top < MARGEN_VIEWPORT) top = MARGEN_VIEWPORT

    if (left + ANCHO_POPOVER > vw - MARGEN_VIEWPORT) {
      left = anchorRect.right - ANCHO_POPOVER
    }
    if (left < MARGEN_VIEWPORT) left = MARGEN_VIEWPORT
    if (left + ANCHO_POPOVER > vw - MARGEN_VIEWPORT) left = vw - MARGEN_VIEWPORT - ANCHO_POPOVER

    setPosicion({ top, left })
  }, [anchorRect, ref])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-56"
      style={{ top: posicion?.top ?? -9999, left: posicion?.left ?? -9999 }}
    >
      <Card titulo="Elegir profesional" className="shadow-lg p-2 gap-1">
        {profesionales.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onElegir(p)}
            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 text-sm text-texto"
          >
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
              {inicialesDe(`${p.nombre} ${p.apellido}`)}
            </span>
            <span className="truncate">{p.nombre} {p.apellido}</span>
          </button>
        ))}
      </Card>
    </div>
  )
}
