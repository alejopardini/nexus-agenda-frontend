import { useNavigate } from 'react-router-dom'

export default function BotonVolver({ to, texto = 'Volver' }) {
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
      className="text-sm text-slate-500 hover:text-blue-600 hover:underline inline-block mb-3"
    >
      ← {texto}
    </button>
  )
}