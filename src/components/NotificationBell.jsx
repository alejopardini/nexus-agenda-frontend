import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import useClickOutside from '../hooks/useClickOutside'

function marcarComoVistos(ids) {
  const vistos = JSON.parse(localStorage.getItem('turnos_vistos') || '[]')
  const nuevos = [...new Set([...vistos, ...ids])]
  localStorage.setItem('turnos_vistos', JSON.stringify(nuevos))
}

function idsVistos() {
  return JSON.parse(localStorage.getItem('turnos_vistos') || '[]')
}

export default function NotificationBell() {
  const [turnos, setTurnos] = useState([])
  const [abierto, setAbierto] = useState(false)
  const ref = useClickOutside(() => setAbierto(false))

  useEffect(() => {
    apiClient
      .get('/turnos/')
      .then((res) => setTurnos(res.data))
      .catch(() => {})
  }, [])

  const hoy = new Date().toISOString().split('T')[0]

  const relevantes = turnos.filter(
    (t) => t.estado !== 'cancelado' && (t.fecha === hoy || t.estado === 'pendiente')
  )

  const vistos = idsVistos()
  const sinVer = relevantes.filter((t) => !vistos.includes(t.id))

  const toggle = () => {
    if (!abierto) {
      marcarComoVistos(relevantes.map((t) => t.id))
    }
    setAbierto(!abierto)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative text-slate-600 hover:text-slate-900">
        🔔
        {sinVer.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {sinVer.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Turnos de hoy y pendientes
          </div>
          {relevantes.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No hay nada para mostrar.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {relevantes.map((t) => (
                <li key={t.id} className="p-3 text-sm">
                  <Link to="/turnos/lista" onClick={() => setAbierto(false)} className="block hover:text-blue-600">
                    <div className="flex justify-between">
                      <span className="font-medium">{t.paciente_nombre}</span>
                      <span className="text-slate-500">{t.hora}</span>
                    </div>
                    <span className="text-slate-500 text-xs">{t.fecha} — {t.estado}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}