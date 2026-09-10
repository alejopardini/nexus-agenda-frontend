// Sistema de botones reutilizable (rama prueba-sidebar-visual): 4 variantes x
// 4 estados (default/hover/active/disabled), sobre los tokens de color
// definidos en index.css (--color-btn-*).
//
// Uso: <Boton variante="secondary" onClick={...}>Guardar</Boton>
// Con `to`, se renderiza como Link de react-router en vez de <button> — para
// los "+ Nuevo X" que en realidad navegan, no disparan una acción.
// <Boton to="/pacientes/nuevo">+ Nuevo paciente</Boton>

import { Link } from 'react-router-dom'

const BASE =
  'inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-lg ' +
  'font-sans font-semibold text-[12px] leading-[15px] transition-colors ' +
  'disabled:cursor-not-allowed'

const VARIANTES = {
  primary:
    'bg-btn-primary text-white border border-transparent ' +
    'hover:bg-btn-primary-hover active:bg-btn-primary-active ' +
    'disabled:pointer-events-none disabled:bg-btn-primary-disabled disabled:text-btn-primary-disabled-text',

  secondary:
    'bg-white text-btn-primary border border-btn-primary ' +
    'hover:bg-btn-outline-hover active:bg-btn-outline-active ' +
    'disabled:pointer-events-none disabled:bg-btn-secondary-disabled disabled:text-btn-secondary-disabled-text',

  ghost:
    'bg-transparent text-btn-primary border border-btn-primary ' +
    'hover:bg-btn-outline-hover active:bg-btn-outline-active ' +
    'disabled:pointer-events-none disabled:bg-btn-ghost-disabled',

  destructive:
    'bg-btn-destructive text-white border border-btn-destructive ' +
    'hover:bg-btn-destructive-hover hover:border-btn-destructive-hover ' +
    'active:bg-btn-destructive-active active:border-btn-destructive-active ' +
    'disabled:pointer-events-none disabled:bg-btn-destructive-disabled disabled:border-btn-destructive-disabled disabled:text-btn-destructive-disabled-text',
}

export default function Boton({ variante = 'primary', className = '', to, ...props }) {
  const clases = VARIANTES[variante] || VARIANTES.primary
  const clasesFinal = `${BASE} ${clases} ${className}`.trim()

  if (to) {
    return <Link to={to} className={clasesFinal} {...props} />
  }

  return (
    <button
      type="button"
      className={clasesFinal}
      {...props}
    />
  )
}
