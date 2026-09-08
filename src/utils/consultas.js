export function buscarConsultaCompletadaPrevia(consultas, pacienteId) {
  return consultas.find(
    (c) => String(c.paciente) === String(pacienteId) && c.estado === 'completada'
  )
}
