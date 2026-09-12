import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Terminos from './pages/Terminos'
import OlvidePassword from './pages/OlvidePassword'
import RestablecerPassword from './pages/RestablecerPassword'
import MiPerfil from './pages/MiPerfil'
import ReservarPublico from './pages/ReservarPublico'
import Pacientes from './pages/Pacientes'
import NuevoPaciente from './pages/NuevoPaciente'
import DetallePaciente from './pages/DetallePaciente'
import EditarPaciente from './pages/EditarPaciente'
import Turnos from './pages/Turnos'
import NuevoTurno from './pages/NuevoTurno'
import TurnosCancelados from './pages/TurnosCancelados'
import HistorialTurnos from './pages/HistorialTurnos'
import CalendarioTurnos from './pages/CalendarioTurnos'
import ConsultaDetalle from './pages/ConsultaDetalle'
import Consultas from './pages/Consultas'
import Disponibilidad from './pages/Disponibilidad'
import Profesionales from './pages/Profesionales'
import NuevoProfesional from './pages/NuevoProfesional'
import EditarProfesional from './pages/EditarProfesional'
import Interconsultas from './pages/Interconsultas'
import Secretarias from './pages/Secretarias'
import NuevaSecretaria from './pages/NuevaSecretaria'
import Auditoria from './pages/Auditoria'
import Soporte from './pages/Soporte'
import PacientesSinTurno from './pages/PacientesSinTurno'
import ConsultasPendientes from './pages/ConsultasPendientes'
import Camillas from './pages/Camillas'
import CamposPersonalizados from './pages/CamposPersonalizados'
import Estadisticas from './pages/Estadisticas'
import ValoresTurnos from './pages/ValoresTurnos'
import Planes from './pages/Planes'
import GestionSuscripcion from './pages/GestionSuscripcion'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<RestablecerPassword />} />
          <Route path="/mi-perfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
          <Route path="/reservar/:organizacionId" element={<ReservarPublico />} />
          <Route path="/" element={<ProtectedRoute><CalendarioTurnos /></ProtectedRoute>} />
          <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
          <Route path="/pacientes/nuevo" element={<ProtectedRoute><NuevoPaciente /></ProtectedRoute>} />
          <Route path="/pacientes/:id/editar" element={<ProtectedRoute><EditarPaciente /></ProtectedRoute>} />
          <Route path="/pacientes/:id" element={<ProtectedRoute><DetallePaciente /></ProtectedRoute>} />
          <Route path="/turnos" element={<ProtectedRoute><CalendarioTurnos /></ProtectedRoute>} />
          <Route path="/turnos/lista" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
          <Route path="/turnos/nuevo" element={<ProtectedRoute><NuevoTurno /></ProtectedRoute>} />
          <Route path="/turnos/cancelados" element={<ProtectedRoute><TurnosCancelados /></ProtectedRoute>} />
          <Route path="/turnos/historial" element={<ProtectedRoute><HistorialTurnos /></ProtectedRoute>} />
          <Route path="/turnos/valores" element={<ProtectedRoute><ValoresTurnos /></ProtectedRoute>} />
          <Route path="/consultas" element={<ProtectedRoute><Consultas /></ProtectedRoute>} />
          <Route path="/consultas/:id" element={<ProtectedRoute><ConsultaDetalle /></ProtectedRoute>} />
          <Route path="/disponibilidad" element={<ProtectedRoute><Disponibilidad /></ProtectedRoute>} />
          <Route path="/profesionales" element={<ProtectedRoute><Profesionales /></ProtectedRoute>} />
          <Route path="/profesionales/nuevo" element={<ProtectedRoute><NuevoProfesional /></ProtectedRoute>} />
          <Route path="/profesionales/:id/editar" element={<ProtectedRoute><EditarProfesional /></ProtectedRoute>} />
          <Route path="/organizacion/suscripcion" element={<ProtectedRoute><GestionSuscripcion /></ProtectedRoute>} />
          <Route path="/interconsultas" element={<ProtectedRoute><Interconsultas /></ProtectedRoute>} />
          <Route path="/secretarias" element={<ProtectedRoute><Secretarias /></ProtectedRoute>} />
          <Route path="/secretarias/nueva" element={<ProtectedRoute><NuevaSecretaria /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
          <Route path="/soporte" element={<ProtectedRoute><Soporte /></ProtectedRoute>} />
          <Route path="/pacientes/sin-turno" element={<ProtectedRoute><PacientesSinTurno /></ProtectedRoute>} />
          <Route path="/pacientes/consultas-pendientes" element={<ProtectedRoute><ConsultasPendientes /></ProtectedRoute>} />
          <Route path="/planes" element={<ProtectedRoute><Planes /></ProtectedRoute>} />
          <Route path="/camillas" element={<ProtectedRoute><Camillas /></ProtectedRoute>} />
          <Route path="/campos-personalizados" element={<ProtectedRoute><CamposPersonalizados /></ProtectedRoute>} />
          <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App