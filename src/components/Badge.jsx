// Badge de estado reutilizable (rama prueba-sidebar-visual): píldora de
// fondo + texto según el estado de turno, sobre los tokens de color
// definidos en index.css (--color-turno-*). Reemplazo visual de los
// colores de estado ya usados en CalendarioSemanal.jsx y Camillas.jsx —
// pensado para poder usarse también en cualquier card de cliente/turno.
//
// Uso: <Badge estado="pendiente">Sin confirmar</Badge>
// Con tamaño="xs" (default "md", igual que siempre): pill compacta sin
// padding vertical, para espacios muy ajustados (ver CalendarioTurnos.jsx,
// tabla del día). Mismo patrón que la prop tamaño de Boton.jsx.
//
// Las clases en sí viven en utils/badge.js (claseBadge/BASE_PILL) para que
// otros elementos que no son un <span> (ej. el <select> de Estado en
// HistorialTurnos.jsx) puedan reusar la misma apariencia — un componente no
// puede exportar también constantes/funciones sueltas sin romper Fast
// Refresh (react-refresh/only-export-components).

import { claseBadge } from '../utils/badge'

export default function Badge({ estado, tamaño = 'md', className = '', children, ...props }) {
  return (
    <span className={`${claseBadge(estado, tamaño)} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}
