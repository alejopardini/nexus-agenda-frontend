// Header delgado (rama prueba-sidebar-visual): barra fina arriba del
// contenido, al lado del sidebar fijo. Solo desktop (md+) — en mobile el
// propio Sidebar.jsx ya renderiza su propia barra superior con logo +
// notificaciones + botón de menú (md:hidden, ver más abajo en ese archivo),
// así que este Header no se duplica ahí para no competir con ese toggle.
export default function Header() {
  return (
    <header className="hidden md:flex md:ml-16 h-14 items-center px-6 bg-page border-b border-borde-suave">
      <span className="font-sans font-semibold text-[18px] text-texto">QuironNexus</span>
    </header>
  )
}
