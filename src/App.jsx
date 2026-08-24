import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import NuevoPaciente from './pages/NuevoPaciente'
import DetallePaciente from './pages/DetallePaciente'
import EditarPaciente from './pages/EditarPaciente'
import Turnos from './pages/Turnos'
import NuevoTurno from './pages/NuevoTurno'
import CompletarConsulta from './pages/CompletarConsulta'
import Disponibilidad from './pages/Disponibilidad'
import TurnosCancelados from './pages/TurnosCancelados'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/nuevo"
            element={
              <ProtectedRoute>
                <NuevoPaciente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/:id/editar"
            element={
              <ProtectedRoute>
                <EditarPaciente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/:id"
            element={
              <ProtectedRoute>
                <DetallePaciente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/turnos"
            element={
              <ProtectedRoute>
                <Turnos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/turnos/nuevo"
            element={
              <ProtectedRoute>
                <NuevoTurno />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultas/:id/completar"
            element={
              <ProtectedRoute>
                <CompletarConsulta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disponibilidad"
            element={
              <ProtectedRoute>
                <Disponibilidad />
              </ProtectedRoute>
            }
          />
          


          <Route
            path="/turnos/cancelados"
            element={
              <ProtectedRoute>
                <TurnosCancelados />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App