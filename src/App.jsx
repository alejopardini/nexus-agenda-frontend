import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Terminos from './pages/Terminos'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import NuevoPaciente from './pages/NuevoPaciente'
import DetallePaciente from './pages/DetallePaciente'
import EditarPaciente from './pages/EditarPaciente'
import Turnos from './pages/Turnos'
import NuevoTurno from './pages/NuevoTurno'
import TurnosCancelados from './pages/TurnosCancelados'
import ConsultaDetalle from './pages/ConsultaDetalle'
import Disponibilidad from './pages/Disponibilidad'
import Profesionales from './pages/Profesionales'
import NuevoProfesional from './pages/NuevoProfesional'
import EditarProfesional from './pages/EditarProfesional'
import Interconsultas from './pages/Interconsultas'
import Secretarias from './pages/Secretarias'
import NuevaSecretaria from './pages/NuevaSecretaria'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
          <Route path="/pacientes/nuevo" element={<ProtectedRoute><NuevoPaciente /></ProtectedRoute>} />
          <Route path="/pacientes/:id/editar" element={<ProtectedRoute><EditarPaciente /></ProtectedRoute>} />
          <Route path="/pacientes/:id" element={<ProtectedRoute><DetallePaciente /></ProtectedRoute>} />
          <Route path="/turnos" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
          <Route path="/turnos/nuevo" element={<ProtectedRoute><NuevoTurno /></ProtectedRoute>} />
          <Route path="/turnos/cancelados" element={<ProtectedRoute><TurnosCancelados /></ProtectedRoute>} />
          <Route path="/consultas/:id" element={<ProtectedRoute><ConsultaDetalle /></ProtectedRoute>} />
          <Route path="/disponibilidad" element={<ProtectedRoute><Disponibilidad /></ProtectedRoute>} />
          <Route path="/profesionales" element={<ProtectedRoute><Profesionales /></ProtectedRoute>} />
          <Route path="/profesionales/nuevo" element={<ProtectedRoute><NuevoProfesional /></ProtectedRoute>} />
          <Route path="/profesionales/:id/editar" element={<ProtectedRoute><EditarProfesional /></ProtectedRoute>} />
          <Route path="/interconsultas" element={<ProtectedRoute><Interconsultas /></ProtectedRoute>} />
          <Route path="/secretarias" element={<ProtectedRoute><Secretarias /></ProtectedRoute>} />
          <Route path="/secretarias/nueva" element={<ProtectedRoute><NuevaSecretaria /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App