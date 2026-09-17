// Clases del Badge (Badge.jsx) extraídas a un módulo aparte: un componente
// no puede compartir archivo con constantes/funciones sueltas sin romper
// Fast Refresh (react-refresh/only-export-components). Se usa tanto desde
// Badge.jsx como desde cualquier lugar que necesite la apariencia de Badge
// sobre un elemento que no es un <span> (ej. el <select> de Estado en
// HistorialTurnos.jsx).

// "md" es el tamaño de siempre — default, sin cambios para nada que ya use
// Badge. "xs" es compacto (CalendarioTurnos.jsx, tabla del día: franjas de
// 15 min con muy poco alto disponible) — cada tamaño trae su propio set fijo
// de clases, nunca compiten dos clases por la misma propiedad en el mismo
// elemento, así que no hace falta ningún override con "!important".
export const BASE_PILL =
  'inline-flex items-center rounded-full py-1.5 px-2.5 ' +
  'font-sans font-medium text-[12px] leading-4'

export const BASE_PILL_XS =
  'inline-flex items-center rounded-full py-0 px-1.5 ' +
  'font-sans font-medium text-[10px] leading-tight'

const TAMANOS = {
  md: BASE_PILL,
  xs: BASE_PILL_XS,
}

export const ESTADOS = {
  pendiente: 'bg-turno-pendiente text-turno-pendiente-text',
  confirmado: 'bg-turno-confirmado text-turno-confirmado-text',
  cancelado: 'bg-turno-cancelado text-turno-cancelado-text',
  'en-camilla': 'bg-turno-en-camilla text-turno-en-camilla-text',
  // "ausente" todavía no tiene token --color-turno-ausente asignado por la
  // diseñadora (index.css solo define pendiente/confirmado/cancelado/
  // en-camilla). Reusa el naranja que ya usan COLOR_ESTADO de Turnos.jsx y
  // BotonIcono color="warning" para el mismo estado, en vez de inventar un
  // tono nuevo — reemplazar por un token propio cuando exista.
  ausente: 'bg-orange-100 text-orange-800',
}

export function claseBadge(estado, tamaño = 'md') {
  return `${TAMANOS[tamaño] || BASE_PILL} ${ESTADOS[estado] || ESTADOS.pendiente}`
}
