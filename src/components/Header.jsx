import { Link, useNavigate } from 'react-router-dom'
import { CircleUser, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

// Header delgado (rama prueba-sidebar-visual): barra fina arriba del
// contenido, al lado del sidebar fijo. Solo desktop (md+) — en mobile el
// propio Sidebar.jsx ya renderiza su propia barra superior con logo +
// notificaciones + botón de menú (md:hidden, ver más abajo en ese archivo),
// así que este Header no se duplica ahí para no competir con ese toggle.
//
// `titulo`/`controles` son opcionales: los pasa Layout desde la página
// activa (hoy solo CalendarioTurnos.jsx y Camillas.jsx los usan) para que el
// título de sección y su control de vista vivan acá en vez de duplicarse
// arriba del contenido. El resto de las páginas no los pasa y el header
// muestra solo el nombre de la app, como antes.
//
// Usuario + logout viven acá (y no al final del Sidebar) para que sean
// siempre visibles sin depender de la altura de la ventana — en el sidebar
// (una columna fija de alto completo, sin scroll propio) se recortaban en
// pantallas de notebook con poca altura.
export default function Header({ titulo, controles }) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout/')
    } catch {
      // si falla el POST (red, token ya vencido, etc.) igual deslogueamos del lado del cliente
    }
    logout()
    navigate('/login')
  }

  return (
    <header className="hidden md:flex md:ml-16 h-14 items-center justify-between px-6 bg-page border-b border-borde-suave">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-sans font-semibold text-[18px] text-texto shrink-0">QuiroNexus</span>
        {titulo && (
          <>
            <span className="text-texto-secundario shrink-0">/</span>
            <span className="font-sans text-[14px] text-texto-secundario truncate">{titulo}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {controles}

        <div className="flex items-center gap-3 pl-4 border-l border-borde-suave">
          <Link
            to="/mi-perfil"
            className="flex items-center gap-1.5 text-sm text-texto hover:text-btn-primary"
          >
            <CircleUser size={18} strokeWidth={2} aria-hidden="true" />
            {auth.username} <span className="text-texto-secundario">({auth.rol})</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-texto-secundario hover:text-btn-destructive"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
