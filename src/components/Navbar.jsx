import { useState } from 'react'
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

function MenuSeccionMobile({ titulo, items, onNavegar }) {
  if (items.length === 0) return null
  return (
    <div className="px-1">
      <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{titulo}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavegar}
            className="block text-sm text-slate-600 hover:text-blue-600 py-1"
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const esDueño = auth.rol === 'dueño'

  const itemsPacientes = [
    { to: '/pacientes', label: 'Ver lista' },
    ...(auth.rol !== 'profesional' ? [{ to: '/pacientes/nuevo', label: 'Nuevo paciente' }] : []),
    { to: '/interconsultas', label: 'Interconsultas' },
    { to: '/pacientes/sin-turno', label: 'Sin turno reciente' },
  ]
  const itemsTurnos = [
    { to: '/turnos/lista', label: 'Ver lista' },
    ...(auth.rol !== 'profesional' ? [{ to: '/turnos/nuevo', label: 'Nuevo turno' }] : []),
    { to: '/turnos', label: 'Ver calendario' },
    { to: '/turnos/historial', label: 'Historial' },
    { to: '/disponibilidad', label: 'Disponibilidad' },
    ...(auth.rol === 'profesional' ? [{ to: '/frases-rapidas', label: 'Frases rápidas' }] : []),
  ]
  const itemsProfesionales = [
    { to: '/profesionales', label: 'Ver lista' },
    ...(esDueño ? [{ to: '/profesionales/nuevo', label: 'Nuevo profesional' }] : []),
    ...(esDueño ? [{ to: '/secretarias', label: 'Secretaría' }] : []),
  ]

  return (
    <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img src={logoQnexus} alt="QuiroNexus" className="h-14 w-auto" />
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-slate-600 hover:text-blue-600">Inicio</Link>
            <Link to="/camillas" className="text-sm text-slate-600 hover:text-blue-600">Camillas</Link>
            <MenuDropdown titulo="Pacientes" items={itemsPacientes} />
            <MenuDropdown titulo="Turnos" items={itemsTurnos} />
            <MenuDropdown titulo="Profesionales" items={itemsProfesionales} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/soporte"
            title="Soporte técnico"
            className="hidden md:flex w-7 h-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm"
          >
            🛟
          </Link>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-400">{auth.organizacion_nombre}</span>
            <span className="text-sm text-slate-500">{auth.username} ({auth.rol})</span>
          </div>
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="hidden md:inline-block text-sm bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700"
          >
            Salir
          </button>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-slate-600 hover:text-blue-600 text-xl"
            aria-label="Abrir menú"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 mt-2 pt-2 pb-3 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-slate-600 hover:text-blue-600 px-1"
          >
            Inicio
          </Link>
          <Link
            to="/camillas"
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-slate-600 hover:text-blue-600 px-1"
          >
            Camillas
          </Link>
          <MenuSeccionMobile titulo="Pacientes" items={itemsPacientes} onNavegar={() => setMobileOpen(false)} />
          <MenuSeccionMobile titulo="Turnos" items={itemsTurnos} onNavegar={() => setMobileOpen(false)} />
          <MenuSeccionMobile titulo="Profesionales" items={itemsProfesionales} onNavegar={() => setMobileOpen(false)} />
          <Link
            to="/soporte"
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-slate-600 hover:text-blue-600 px-1"
          >
            🛟 Soporte técnico
          </Link>
          <div className="border-t border-slate-100 pt-3 px-1">
            <p className="text-xs text-slate-400">{auth.organizacion_nombre}</p>
            <p className="text-sm text-slate-500 mb-2">{auth.username} ({auth.rol})</p>
            <button
              onClick={handleLogout}
              className="w-full text-sm bg-red-600 text-white rounded px-3 py-2 hover:bg-red-700"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
