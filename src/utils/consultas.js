export function buscarConsultaCompletadaPrevia(consultas, clienteId) {
  return consultas.find(
    (c) => String(c.cliente) === String(clienteId) && c.estado === 'completada'
  )
}
