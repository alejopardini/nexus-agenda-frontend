import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import PacienteForm from '../components/PacienteForm'
import { useAuth } from '../context/AuthContext'

export default function NuevoPaciente() {
  const navigate = useNavigate()
  const { auth } = useAuth()

  if (auth.rol === 'profesional' && auth.puede_crear_pacientes !== true) {
    return (
      <Layout titulo="Nuevo paciente">
        <BotonVolver to="/pacientes" className="mb-4" />
        <p className="text-red-600">No tenés permiso para crear pacientes. Pedile a la secretaría o al dueño que lo haga.</p>
      </Layout>
    )
  }

  return (
    <Layout titulo="Nuevo paciente">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-sans font-semibold text-[32px] text-heading">Nuevo paciente</h1>
          <BotonVolver to="/pacientes" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <PacienteForm onCreado={(p) => navigate('/pacientes', { state: { abrirPacienteId: p.id } })} />
        </div>
      </div>
    </Layout>
  )
}
