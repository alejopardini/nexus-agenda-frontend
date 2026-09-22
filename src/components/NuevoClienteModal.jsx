import ClienteForm from './ClienteForm'
import Modal from './Modal'

export default function NuevoClienteModal({ onClose, onCreado }) {
  return (
    <Modal titulo="Nuevo cliente" onClose={onClose}>
      <ClienteForm onCreado={(p) => { onCreado(p); onClose() }} />
    </Modal>
  )
}
