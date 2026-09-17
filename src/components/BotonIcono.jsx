import { Link } from 'react-router-dom'
import Tooltip from './Tooltip'

// Botón de solo ícono + tooltip en hover, para reemplazar los links de texto
// azul subrayado en filas/tarjetas donde no hay lugar para texto (Camillas,
// Turnos, etc). Reusa Tooltip.jsx (mismo componente que ya usan
// CalendarioSemanal y PanelFranjasHorarias) en vez de un tooltip nuevo.
//
// Con `to`, se renderiza como Link de react-router (mismo criterio que
// Boton.jsx); sin `to`, es un <button type="button"> con onClick.
// `texto` hace doble uso: contenido del tooltip Y label accesible
// (sr-only), para no depender del hover en lectores de pantalla.
//
// Uso: <BotonIcono icono={X} texto="Quitar" color="destructive" onClick={...} />

const COLORES = {
  neutral: 'text-slate-500 hover:text-slate-700',
  primary: 'text-blue-600 hover:text-blue-800',
  success: 'text-green-600 hover:text-green-800',
  warning: 'text-orange-600 hover:text-orange-800',
  destructive: 'text-red-600 hover:text-red-800',
}

export default function BotonIcono({
  icono: Icon,
  texto,
  color = 'primary',
  size = 16,
  position = 'top',
  to,
  className = '',
  ...props
}) {
  const clases = `inline-flex ${COLORES[color] || COLORES.primary} transition-colors ${className}`.trim()

  const contenido = (
    <>
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{texto}</span>
    </>
  )

  return (
    <Tooltip texto={texto} position={position}>
      {to ? (
        <Link to={to} className={clases} {...props}>{contenido}</Link>
      ) : (
        <button type="button" className={clases} {...props}>{contenido}</button>
      )}
    </Tooltip>
  )
}
