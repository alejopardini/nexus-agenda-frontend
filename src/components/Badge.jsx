// Badge de estado reutilizable (rama prueba-sidebar-visual): píldora de
// fondo + texto según el estado de turno, sobre los tokens de color
// definidos en index.css (--color-turno-*). Reemplazo visual de los
// colores de estado ya usados en CalendarioSemanal.jsx y Camillas.jsx —
// pensado para poder usarse también en cualquier card de paciente/turno.
//
// Uso: <Badge estado="pendiente">Sin confirmar</Badge>

const BASE =
  'inline-flex items-center rounded-full py-1.5 px-2.5 ' +
  'font-sans font-medium text-[12px] leading-4'

const ESTADOS = {
  pendiente: 'bg-turno-pendiente text-turno-pendiente-text',
  confirmado: 'bg-turno-confirmado text-turno-confirmado-text',
  cancelado: 'bg-turno-cancelado text-turno-cancelado-text',
  'en-camilla': 'bg-turno-en-camilla text-turno-en-camilla-text',
}

export default function Badge({ estado, className = '', children, ...props }) {
  const clases = ESTADOS[estado] || ESTADOS.pendiente
  return (
    <span className={`${BASE} ${clases} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}
