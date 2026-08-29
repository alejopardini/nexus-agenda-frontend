import PacienteForm from './PacienteForm'

export default function NuevoPacienteModal({ onClose, onCreado }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg">Nuevo paciente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-4">
          <PacienteForm onCreado={(p) => { onCreado(p); onClose() }} />
        </div>
      </div>
    </div>
  )
}
