import { Link, useNavigate } from 'react-router-dom'
import { CircleUser, LogOut, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSucursalActiva } from '../context/SucursalActivaContext'
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
// `filtraPorSucursal` (default false): opt-in explícito por pantalla, no
// opt-out. El selector de sucursal activa solo se muestra cuando la propia
// pantalla lo pide — si mañana se agrega una pantalla nueva y nadie se
// acuerda de este detalle, el default seguro es "no confundir" (selector
// oculto), no "mostrar un filtro que esa pantalla no respeta".
//
// Usuario + logout viven acá (y no al final del Sidebar) para que sean
// siempre visibles sin depender de la altura de la ventana — en el sidebar
// (una columna fija de alto completo, sin scroll propio) se recortaban en
// pantallas de notebook con poca altura.
export default function Header({ titulo, controles, filtraPorSucursal = false }) {
  const { auth, logout } = useAuth()
  const { sucursales, sucursalActivaId, setSucursalActiva } = useSucursalActiva()
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
        <span className="font-sans font-semibold text-[22px] shrink-0">
          <span className="text-primary">Quiro</span>
          <span className="text-secondary">Nexus</span>
        </span>
        {titulo && (
          <>
            <span className="text-texto-secundario shrink-0">/</span>
            <span className="font-sans text-[14px] text-texto-secundario truncate">{titulo}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {controles}

        {filtraPorSucursal && sucursales.length > 1 && (
          // Filtro de sesión (ver SucursalActivaContext), no de permisos —
          // el estilo cambia con "activo" para que no se confunda con
          // "viendo todo" cuando en realidad hay un filtro puesto.
          <div
            className={`flex items-center gap-1.5 text-sm rounded-lg border px-2.5 py-1 transition-colors ${
              sucursalActivaId
                ? 'border-primary text-primary bg-primary/5 font-medium'
                : 'border-borde-suave text-texto-secundario'
            }`}
          >
            <MapPin size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <select
              value={sucursalActivaId || ''}
              onChange={(e) => setSucursalActiva(e.target.value || null)}
              className="bg-transparent outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}

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
