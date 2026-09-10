// Tooltip reutilizable, mismo patrón visual que el de Sidebar.jsx (SidebarIcon):
// wrapper "group relative" + texto absoluto en bg-primary/text-white que
// aparece con opacity + group-hover, sin JS de posicionamiento.
// Por defecto aparece arriba del elemento (position="top"); pensado para
// envolver elementos chicos (ej. círculo de iniciales) dentro de layouts con
// poco espacio horizontal, a diferencia del tooltip lateral del sidebar.

const POSICION = {
  top: 'left-1/2 bottom-full -translate-x-1/2 mb-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export default function Tooltip({ texto, children, position = 'top', className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`.trim()}>
      {children}
      <span
        className={`pointer-events-none absolute ${POSICION[position]} whitespace-nowrap rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50`}
      >
        {texto}
      </span>
    </span>
  )
}
