// Modal genérico reutilizable (rama prueba-sidebar-visual): overlay + caja
// centrada con header (título + botón cerrar), body de contenido libre y
// footer de acciones opcional (pensado para usarse con Boton). Ancho
// flexible con tope en 480px por defecto (referencia del diseño original) —
// modales que ya traían más contenido (fichas, tabs) pueden pasar `ancho`
// con una clase max-w-* propia.
//
// El overlay y el cierre al hacer click afuera son patrón estándar de modal,
// no estaban especificados en el diseño pero son necesarios para que
// funcione. Mismo botón "×" en la esquina que ya usan los modales
// existentes de la app, acá como ícono (lucide X) con zona clickeable
// ampliada (24px de ícono + 10px de padding alrededor).
//
// `debajoTitulo` es un slot opcional para algo fijo entre el título y el
// body scrolleable (p.ej. una fila de tabs) — no forma parte del scroll.
//
// Uso:
// <Modal titulo="Confirmar" onClose={cerrar} acciones={<>
//   <Boton variante="ghost" onClick={cerrar}>Cancelar</Boton>
//   <Boton variante="primary" onClick={guardar}>Guardar</Boton>
// </>}>
//   <p>Contenido del modal.</p>
// </Modal>

import { X } from 'lucide-react'

export default function Modal({ titulo, debajoTitulo, children, acciones, onClose, ancho = 'max-w-[480px]', className = '' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${ancho} max-h-[85vh] bg-white border border-borde-suave rounded-xl p-6 flex flex-col gap-4 ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3.5 right-3.5 p-2.5 rounded-lg text-texto hover:bg-superficie-hover transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {titulo && (
          <h2 className="font-sans font-semibold text-[20px] leading-tight text-heading pr-10">
            {titulo}
          </h2>
        )}

        {debajoTitulo}

        <div className="flex-1 min-h-0 font-sans font-normal text-[14px] leading-[20px] text-texto overflow-y-auto">
          {children}
        </div>

        {acciones && <div className="flex justify-end gap-2">{acciones}</div>}
      </div>
    </div>
  )
}
