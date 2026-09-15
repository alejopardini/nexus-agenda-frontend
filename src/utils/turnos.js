// "En camilla" no es un Turno.estado — se deriva igual que en Camillas.jsx
// (hora_llamado seteada + la consulta que generó todavía sigue pendiente).
// "ausente" no tiene token de color propio pedido; se agrupa con "cancelado"
// (el turno ya no está "en curso").
//
// Vive en utils/ (no en CalendarioSemanal.jsx, donde se usó originalmente)
// para poder importarse también desde la tabla diaria de CalendarioTurnos.jsx
// sin romper Fast Refresh (un componente no puede compartir archivo con
// funciones sueltas sin desactivar el HMR de ese archivo).
export function estadoVisual(turno) {
  if (turno.estado === 'cancelado' || turno.estado === 'ausente') return 'cancelado'
  if (turno.hora_llamado && turno.consulta_pendiente_id) return 'en-camilla'
  if (turno.estado === 'confirmado') return 'confirmado'
  return 'pendiente'
}
