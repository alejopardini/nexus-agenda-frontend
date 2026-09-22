// Sistema de botones reutilizable (rama prueba-sidebar-visual): 4 variantes x
// 4 estados (default/hover/active/disabled), sobre los tokens de color
// definidos en index.css (--color-btn-*).
//
// Uso: <Boton variante="secondary" onClick={...}>Guardar</Boton>
// Con `to`, se renderiza como Link de react-router en vez de <button> — para
// los "+ Nuevo X" que en realidad navegan, no disparan una acción.
// <Boton to="/clientes/nuevo">+ Nuevo cliente</Boton>

import { Link } from 'react-router-dom'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg ' +
  'font-sans font-semibold text-[12px] leading-[15px] transition-colors ' +
  'disabled:cursor-not-allowed'

const TAMANOS = {
  md: 'h-10 px-4 py-2.5',
  // Para filas de formulario inline con inputs chicos (border ... px-2
  // py-1.5, sin altura fija) — mismo padding vertical que esos inputs, sin
  // h-* fijo, para que la altura coincida exacto en vez de aproximarla a
  // ojo. Ver CatalogoEditable.jsx.
  sm: 'px-3 py-1.5',
}

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
    'disabled:pointer-events-none disabled:border-btn-ghost-disabled-border disabled:text-btn-ghost-disabled-text',

  // Borde fijo #C95C5C en los 4 estados (no combina con el fondo de cada
  // estado como antes) — mismo patrón que secondary/ghost.
  destructive:
    'bg-btn-destructive text-white border border-btn-destructive ' +
    'hover:bg-btn-destructive-hover ' +
    'active:bg-btn-destructive-active ' +
    'disabled:pointer-events-none disabled:bg-btn-destructive-disabled disabled:text-btn-destructive-disabled-text',
}

export default function Boton({ variante = 'primary', tamaño = 'md', className = '', to, ...props }) {
  const clases = VARIANTES[variante] || VARIANTES.primary
  const tam = TAMANOS[tamaño] || TAMANOS.md
  const clasesFinal = `${BASE} ${tam} ${clases} ${className}`.trim()

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
