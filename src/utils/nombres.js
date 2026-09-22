// Helpers de formato de nombres, compartidos entre CalendarioSemanal.jsx y
// PanelFranjasHorarias.jsx (antes vivían solo en CalendarioSemanal.jsx).

export function inicialesDe(nombre) {
  return (nombre || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

const LARGO_MAX_APELLIDO = 10

// "Nombre Apellido" -> "N. Apellido". El backend solo manda el nombre
// completo concatenado (cliente_nombre), así que se asume: primera palabra
// = nombre de pila (se usa solo su inicial), última palabra = apellido. Con
// nombres compuestos ("Alejo Nicolas Pardini") da "A. Pardini", que es
// justamente el formato pedido.
export function abreviarCliente(nombreCompleto) {
  const partes = (nombreCompleto || '').trim().split(/\s+/)
  if (partes.length <= 1) return partes[0] || ''
  const inicial = partes[0][0]?.toUpperCase() || ''
  let apellido = partes[partes.length - 1]
  if (apellido.length > LARGO_MAX_APELLIDO) {
    apellido = `${apellido.slice(0, LARGO_MAX_APELLIDO - 1)}…`
  }
  return `${inicial}. ${apellido}`
}
