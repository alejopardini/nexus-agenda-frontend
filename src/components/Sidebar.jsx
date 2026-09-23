import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, CalendarCheck, Stethoscope, BarChart3, Settings,
  MessageCircle, Menu, X, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import NotificationBell from './NotificationBell'
import NuevoClienteModal from './NuevoClienteModal'
import SoporteModal from './SoporteModal'
import Boton from './Boton'

// PRUEBA VISUAL (rama prueba-sidebar-visual): navbar lateral solo-íconos con
// tooltip al hover, en reemplazo del navbar superior de Navbar.jsx (que queda
// intacto y sin usar, por si se descarta este experimento).
//
// Un solo componente (SidebarIcon) cubre tanto los links directos (Inicio,
// Camillas, Estadísticas, Soporte, Mi Perfil) como las secciones con
// submenú (Clientes/Turnos/Profesionales): siempre es un <Link> real con
// su "to" (arregla que esas 3 no navegaran) y siempre tiene el mismo
// tooltip/flyout (arregla que el tooltip solo apareciera en algunos).

const TAMANO_ICONO = 22
const GROSOR_TRAZO = 2

function SidebarIcon({ to, onClick, Icon, label, items, active, danger }) {
  const esGrupo = Array.isArray(items) && items.length > 0
  const destino = to ?? items?.[0]?.to

  const clases = `flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
    danger
      ? 'text-white/80 hover:bg-red-500/80 hover:text-white'
      : `hover:bg-white/15 ${active ? 'text-secondary' : 'text-white/80 hover:text-white'}`
  }`

  const contenido = (
    <>
      <Icon size={TAMANO_ICONO} strokeWidth={GROSOR_TRAZO} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  )

  return (
    <div className="group relative">
      {destino ? (
        <Link to={destino} onClick={onClick} className={clases}>{contenido}</Link>
      ) : (
        <button type="button" onClick={onClick} className={clases}>{contenido}</button>
      )}

      {esGrupo ? (
        // Flyout pegado al ícono (sin gap) para que el hover no se pierda al mover el mouse hacia los links
        <div className="absolute left-full top-0 hidden group-hover:block z-50">
          <div className="ml-1 w-52 rounded-lg bg-white border border-slate-200 shadow-xl py-1.5">
            <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
            {items.map((item) => (
              item.onClick ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>
      ) : (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
          {label}
        </span>
      )}
    </div>
  )
}

function ItemMobile({ to, Icon, label, onClick }) {
  const contenido = (
    <>
      <Icon size={20} strokeWidth={GROSOR_TRAZO} aria-hidden="true" />
      {label}
    </>
  )
  const clases = 'flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-primary'

  if (!to) {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${clases}`}>
        {contenido}
      </button>
    )
  }

  return (
    <Link to={to} onClick={onClick} className={clases}>
      {contenido}
    </Link>
  )
}

function SeccionMobile({ Icon, titulo, items, onNavegar }) {
  const [abierto, setAbierto] = useState(false)
  if (items.length === 0) return null
  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full flex items-center gap-3 px-2 py-2 text-sm font-semibold text-slate-500 hover:text-primary"
      >
        <Icon size={20} strokeWidth={GROSOR_TRAZO} aria-hidden="true" />
        <span className="flex-1 text-left uppercase text-xs tracking-wide">{titulo}</span>
        <ChevronDown size={16} strokeWidth={GROSOR_TRAZO} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="pl-10 space-y-1 pb-1">
          {items.map((item) => (
            item.onClick ? (
              <button
                key={item.label}
                type="button"
                onClick={() => { item.onClick(); onNavegar() }}
                className="block w-full text-left text-sm text-slate-600 hover:text-primary py-1"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavegar}
                className="block text-sm text-slate-600 hover:text-primary py-1"
              >
                {item.label}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  )
}

// Marca reducida a la letra "N" (Nexus Agenda) para el riel angosto — no
// entra el wordmark completo ahí, y el nombre ya está en texto en
// Header.jsx al lado. Colores del sistema (navy/teal) en vez de un ícono,
// hasta que exista un isotipo propio del producto.
function MarcaN({ className = '' }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-white/90 text-primary font-sans font-bold text-xl ${className}`.trim()}
    >
      N
    </span>
  )
}

export default function Sidebar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modalNuevoClienteAbierto, setModalNuevoClienteAbierto] = useState(false)
  const [modalSoporteAbierto, setModalSoporteAbierto] = useState(false)

  // El menú mobile ahora es un overlay (absolute + backdrop fijo) en vez de
  // empujar el contenido: sin este bloqueo, la página de atrás seguiría
  // scrolleando debajo del backdrop mientras el menú está abierto.
  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout/')
    } catch {
      // si falla el POST (red, token ya vencido, etc.) igual deslogueamos del lado del cliente
    }
    logout()
    navigate('/login')
  }

  const esDueño = auth.rol === 'dueño'

  const itemsClientes = [
    { to: '/clientes', label: 'Ver lista' },
    ...(auth.rol !== 'profesional' || auth.puede_crear_clientes === true ? [{ label: 'Nuevo cliente', onClick: () => setModalNuevoClienteAbierto(true) }] : []),
    { to: '/clientes/sin-turno', label: 'Sin turno reciente' },
    { to: '/clientes/consultas-pendientes', label: 'Consultas pendientes' },
    { to: '/planes', label: 'Planes' },
  ]
  const itemsTurnos = [
    { to: '/turnos/lista', label: 'Ver lista' },
    { to: '/turnos/historial', label: 'Historial' },
    { to: '/disponibilidad', label: 'Disponibilidad' },
    ...(auth.rol === 'profesional' ? [{ to: '/campos-personalizados', label: 'Campos personalizados' }] : []),
    ...(esDueño ? [{ to: '/turnos/valores', label: 'Valores turnos' }] : []),
  ]
  const itemsProfesionales = [
    { to: '/profesionales', label: 'Ver lista' },
    ...(auth.rol !== 'secretaria' ? [{ to: '/consultas', label: 'Ver consultas' }] : []),
    ...(esDueño ? [{ to: '/profesionales/nuevo', label: 'Nuevo profesional' }] : []),
    ...(esDueño ? [{ to: '/secretarias', label: 'Secretaría' }] : []),
  ]
  const itemsConfiguracion = [
    { to: '/configuracion/marca', label: 'Marca' },
  ]

  // Una sola fuente de verdad para desktop (SidebarIcon) y mobile (ItemMobile/SeccionMobile)
  const secciones = [
    { key: 'inicio', to: '/', Icon: Home, label: 'Inicio' },
    { key: 'clientes', Icon: Users, label: 'Clientes', items: itemsClientes },
    { key: 'turnos', Icon: CalendarCheck, label: 'Turnos', items: itemsTurnos },
    { key: 'profesionales', Icon: Stethoscope, label: 'Profesionales', items: itemsProfesionales },
    ...(auth.rol !== 'secretaria' ? [{ key: 'estadisticas', to: '/estadisticas', Icon: BarChart3, label: 'Estadísticas' }] : []),
    ...(esDueño ? [{ key: 'configuracion', Icon: Settings, label: 'Configuración', items: itemsConfiguracion }] : []),
  ]

  const esActivo = (seccion) => {
    const rutas = seccion.items ? seccion.items.map((i) => i.to) : [seccion.to]
    return rutas.some((ruta) => location.pathname === ruta || (ruta !== '/' && location.pathname.startsWith(`${ruta}/`)))
  }

  return (
    <>
      {/* Sidebar desktop: fijo a la izquierda, solo íconos */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-16 flex-col items-center gap-1 bg-primary py-4 z-40">
        <Link to="/" className="mb-4 flex">
          <MarcaN className="h-11 w-11" />
        </Link>

        <nav className="flex-1 flex flex-col items-center gap-3">
          {secciones.map((s) => (
            <SidebarIcon
              key={s.key}
              to={s.to}
              Icon={s.Icon}
              label={s.label}
              items={s.items}
              active={esActivo(s)}
            />
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 pt-3 mt-2 border-t border-white/15 w-full">
          {/* Ícono TEMPORAL: placeholder de "Zoe" (el asistente) hasta que la
              diseñadora defina el ícono/branding final de soporte. */}
          <SidebarIcon onClick={() => setModalSoporteAbierto(true)} Icon={MessageCircle} label="Soporte técnico" />
          <div className="[&>div>button]:w-11 [&>div>button]:h-11 [&>div>button]:flex [&>div>button]:items-center [&>div>button]:justify-center [&>div>button]:rounded-xl [&>div>button]:text-white/80 [&>div>button:hover]:bg-white/15 [&>div>button:hover]:text-white">
            <NotificationBell />
          </div>
          {/* Usuario + Salir viven ahora en Header.jsx (siempre visibles,
              sin depender del alto de la ventana) - ver ese archivo. */}
        </div>
      </aside>

      {/* Mobile: barra superior angosta + panel superpuesto (overlay) con
          texto. El panel es "absolute top-full" del propio wrapper "relative"
          de la barra -> se pinta encima del contenido en vez de empujarlo
          hacia abajo (antes era un bloque normal en el flujo, y tras cerrarlo
          había que volver a scrollear para ver el contenido de nuevo). El
          backdrop fijo (bg-black/40) oscurece el resto de la pantalla y
          cierra el menú al tocar afuera; el wrapper de la barra queda en
          z-50 (por encima del backdrop en z-40) para que el botón de
          abrir/cerrar nunca quede tapado. */}
      <div className="md:hidden relative z-50">
        <div className="bg-primary px-4 py-2 flex items-center justify-between">
          <Link to="/">
            <MarcaN className="h-11 w-11" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/90 rounded-full [&>div>button]:w-8 [&>div>button]:h-8 [&>div>button]:flex [&>div>button]:items-center [&>div>button]:justify-center">
              <NotificationBell />
            </div>
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center text-white"
              aria-label="Abrir menú"
            >
              {mobileOpen ? <X size={22} strokeWidth={GROSOR_TRAZO} /> : <Menu size={22} strokeWidth={GROSOR_TRAZO} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-lg py-2 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {secciones.map((s) => (
              s.items ? (
                <SeccionMobile
                  key={s.key}
                  Icon={s.Icon}
                  titulo={s.label}
                  items={s.items}
                  onNavegar={() => setMobileOpen(false)}
                />
              ) : (
                <ItemMobile
                  key={s.key}
                  to={s.to}
                  Icon={s.Icon}
                  label={s.label}
                  onClick={() => setMobileOpen(false)}
                />
              )
            ))}
            {/* Ícono TEMPORAL, ver nota en el bloque desktop. */}
            <ItemMobile
              Icon={MessageCircle}
              label="Soporte técnico"
              onClick={() => { setModalSoporteAbierto(true); setMobileOpen(false) }}
            />
            <div className="border-t border-slate-100 pt-3 px-3 mt-2">
              <p className="text-xs text-slate-400">{auth.organizacion_nombre}</p>
              <Link
                to="/mi-perfil"
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-slate-500 hover:text-primary mb-2"
              >
                {auth.username} ({auth.rol})
              </Link>
              <Boton variante="destructive" onClick={handleLogout} className="w-full">
                Salir
              </Boton>
            </div>
          </div>
        )}
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {modalNuevoClienteAbierto && (
        <NuevoClienteModal
          onClose={() => setModalNuevoClienteAbierto(false)}
          onCreado={(p) => navigate('/clientes', { state: { abrirClienteId: p.id } })}
        />
      )}

      {modalSoporteAbierto && (
        <SoporteModal onClose={() => setModalSoporteAbierto(false)} />
      )}
    </>
  )
}
