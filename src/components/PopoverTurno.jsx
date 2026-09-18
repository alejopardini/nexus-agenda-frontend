// Popover chico reutilizable (rama prueba-sidebar-visual): referencia rápida
// de un turno + acciones (confirmar/cancelar/ver ficha), pensado para abrir
// junto a la celda ocupada de CalendarioTurnos.jsx en vez de ir directo a
// FichaPacienteModal. Reusa Card/Badge/Boton — nada de estilos sueltos.
//
// Posicionamiento: a diferencia de NotificationBell (que vive en 2 posiciones
// fijas conocidas y resuelve el flip con clases responsive), acá el ancla
// puede estar en cualquier lugar de una grilla, así que la posición se
// calcula en JS a partir de `anchorRect` (el getBoundingClientRect de la
// celda clickeada) + el tamaño real del popover ya montado, con clamping
// contra los bordes del viewport.
//
// Uso:
// <PopoverTurno
//   turno={turno}
//   anchorRect={celda.getBoundingClientRect()}
//   onClose={...}
//   onConfirmar={...}
//   onCancelar={...}
//   onVerFicha={...}
// />

import { useLayoutEffect, useState } from 'react'
import Card from './Card'
import { CardTextoSecundario } from './Card'
import Badge from './Badge'
import Boton from './Boton'
import useClickOutside from '../hooks/useClickOutside'

const MARGEN_VIEWPORT = 8
const ANCHO_POPOVER = 256 // w-64

function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto
}

export default function PopoverTurno({ turno, anchorRect, onClose, onConfirmar, onCancelar, onVerFicha }) {
  const ref = useClickOutside(onClose)
  const [posicion, setPosicion] = useState(null)

  useLayoutEffect(() => {
    if (!ref.current || !anchorRect) return
    const alto = ref.current.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Default: debajo de la celda, alineado a su borde izquierdo.
    let top = anchorRect.bottom + MARGEN_VIEWPORT
    let left = anchorRect.left

    // No entra hacia abajo -> abrir hacia arriba de la celda.
    if (top + alto > vh - MARGEN_VIEWPORT) {
      top = anchorRect.top - alto - MARGEN_VIEWPORT
    }
    // Tampoco entra hacia arriba (celda ocupa casi toda la altura) -> clampear.
    if (top < MARGEN_VIEWPORT) top = MARGEN_VIEWPORT

    // Se sale por la derecha -> alinear el borde derecho del popover con el
    // borde derecho de la celda.
    if (left + ANCHO_POPOVER > vw - MARGEN_VIEWPORT) {
      left = anchorRect.right - ANCHO_POPOVER
    }
    // Clamp final (celda pegada contra un borde).
    if (left < MARGEN_VIEWPORT) left = MARGEN_VIEWPORT
    if (left + ANCHO_POPOVER > vw - MARGEN_VIEWPORT) left = vw - MARGEN_VIEWPORT - ANCHO_POPOVER

    setPosicion({ top, left })
  }, [anchorRect, ref])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64"
      // Antes de medir, se manda fuera de pantalla en vez de en (0,0) para
      // no parpadear en la esquina un frame antes del primer cálculo.
      style={{ top: posicion?.top ?? -9999, left: posicion?.left ?? -9999 }}
    >
      <Card titulo={turno.paciente_nombre} className="shadow-lg">
        <CardTextoSecundario>{turno.hora.slice(0, 5)}</CardTextoSecundario>

        <Badge estado={turno.estado} className="self-start">
          {capitalizar(turno.estado)}
        </Badge>

        <div className="flex gap-2 pt-2">
          {turno.estado === 'pendiente' && (
            <Boton variante="primary" className="flex-1" onClick={onConfirmar}>
              Confirmar
            </Boton>
          )}
          <Boton variante="destructive" className="flex-1" onClick={onCancelar}>
            Cancelar
          </Boton>
        </div>

        <Boton variante="ghost" tamaño="sm" onClick={onVerFicha} className="w-full">
          Ver ficha completa
        </Boton>
      </Card>
    </div>
  )
}
