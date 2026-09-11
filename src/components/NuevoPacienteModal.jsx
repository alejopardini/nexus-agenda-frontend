import PacienteForm from './PacienteForm'
import Modal from './Modal'

export default function NuevoPacienteModal({ onClose, onCreado }) {
  return (
    <Modal titulo="Nuevo paciente" onClose={onClose}>
      <PacienteForm onCreado={(p) => { onCreado(p); onClose() }} />
    </Modal>
  )
}
