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
      <Layout>
        <BotonVolver to="/pacientes" />
        <p className="text-red-600">No tenés permiso para crear pacientes. Pedile a la secretaría o al dueño que lo haga.</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to="/pacientes" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Nuevo paciente</h1>
          <PacienteForm onCreado={(p) => navigate('/pacientes', { state: { abrirPacienteId: p.id } })} />
        </div>
      </div>
    </Layout>
  )
}
