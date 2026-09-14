import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Mismo patrón visual que Boton variante="secondary" (Boton.jsx): outline,
// fondo blanco, borde/texto en btn-primary. Reemplaza el link de texto plano
// que tenía antes — unificado para usarse en cualquier pantalla con flujo de
// alta/edición. Sin margen propio: quien lo usa decide el espaciado con
// className (arriba de una card, dentro de un header en fila, etc).
export default function BotonVolver({ to, texto = 'Volver', className = '' }) {
  const navigate = useNavigate()

  const volver = () => {
    // history.state.idx lo setea react-router: es 0 en la primera entrada
    // de esta sesión de navegación (link directo, recarga) — ahí no hay
    // "atrás" dentro de la app, así que cae al destino fijo pasado por prop.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate(to)
    }
  }

  return (
    <button
      type="button"
      onClick={volver}
      className={`inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-white text-btn-primary border border-btn-primary font-sans font-semibold text-[12px] leading-[15px] transition-colors hover:bg-btn-outline-hover active:bg-btn-outline-active ${className}`.trim()}
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      {texto}
    </button>
  )
}
