import { Link } from 'react-router-dom'

export default function BotonVolver({ to, texto = 'Volver' }) {
  return (
    <Link to={to} className="text-sm text-slate-500 hover:text-blue-600 hover:underline inline-block mb-3">
      ← {texto}
    </Link>
  )
}