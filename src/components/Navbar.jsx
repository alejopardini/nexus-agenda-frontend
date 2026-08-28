import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import logoQnexus from '../assets/logo_qnexus.png'

function MenuDropdown({ titulo, items }) {
  if (items.length === 0) return null
  return (
    <div className="relative group">
      <button className="text-sm text-slate-600 hover:text-blue-600 py-2">
        {titulo}
      </button>
      <div className="absolute left-0 top-full hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48 z-10">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const esDueño = auth.rol === 'dueño'

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <img src={logoQnexus} alt="QuiroNexus" className="h-14 w-auto" />
        <Link to="/" className="text-sm text-slate-600 hover:text-blue-600">Inicio</Link>
        <MenuDropdown
          titulo="Pacientes"
          items={[
            { to: '/pacientes', label: 'Ver lista' },
            ...(auth.rol !== 'profesional' ? [{ to: '/pacientes/nuevo', label: 'Nuevo paciente' }] : []),
            { to: '/interconsultas', label: 'Interconsultas' },
          ]}
        />
        <MenuDropdown
          titulo="Turnos"
          items={[
            { to: '/turnos/lista', label: 'Ver lista' },
            ...(auth.rol !== 'profesional' ? [{ to: '/turnos/nuevo', label: 'Nuevo turno' }] : []),
            { to: '/turnos', label: 'Ver calendario' },
            { to: '/disponibilidad', label: 'Disponibilidad' },
          ]}
        />
        <MenuDropdown
          titulo="Profesionales"
          items={[
            { to: '/profesionales', label: 'Ver lista' },
            ...(esDueño ? [{ to: '/profesionales/nuevo', label: 'Nuevo profesional' }] : []),
            ...(esDueño ? [{ to: '/secretarias', label: 'Secretaría' }] : []),
          ]}
        />
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/soporte"
          title="Soporte técnico"
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
        >
          🛟
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400">{auth.organizacion_nombre}</span>
          <span className="text-sm text-slate-500">{auth.username} ({auth.rol})</span>
        </div>
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="text-sm bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700"
        >
          Salir
        </button>
      </div>
    </nav>
  )
}