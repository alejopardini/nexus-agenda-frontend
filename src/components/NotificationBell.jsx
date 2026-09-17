import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import apiClient from '../api/client'
import useClickOutside from '../hooks/useClickOutside'
import { formatearFecha, formatearHora } from '../utils/fechas'

const INTERVALO_POLLING_MS = 60000

const RESUMEN_VACIO = {
  turnos_pendientes: { cantidad: 0, items: [] },
  consultas_vencidas: { cantidad: 0, items: [] },
}

export default function NotificationBell() {
  const [resumen, setResumen] = useState(RESUMEN_VACIO)
  const [abierto, setAbierto] = useState(false)
  const ref = useClickOutside(() => setAbierto(false))

  useEffect(() => {
    const cargar = () => {
      apiClient
        .get('/turnos/resumen_notificaciones/')
        .then((res) => setResumen(res.data))
        .catch(() => {})
    }
    cargar()
    const intervalo = setInterval(cargar, INTERVALO_POLLING_MS)
    return () => clearInterval(intervalo)
  }, [])

  const { turnos_pendientes: turnosPendientes, consultas_vencidas: consultasVencidas } = resumen
  const total = turnosPendientes.cantidad + consultasVencidas.cantidad
  const cerrar = () => setAbierto(false)

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto((v) => !v)} className="relative text-slate-600 hover:text-slate-900">
        <Bell size={20} strokeWidth={2} aria-hidden="true" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {total}
          </span>
        )}
      </button>

      {abierto && (
        // Mismo criterio de anclaje que la version anterior: en mobile
        // (barra superior) ancla a la derecha y abre hacia abajo; en
        // desktop (vive en el cluster inferior del sidebar fijo) ancla a
        // la izquierda y abre hacia arriba para no cortarse contra el
        // borde inferior de la pantalla.
        <div className="absolute right-0 top-full mt-2 md:right-auto md:left-0 md:top-auto md:mt-0 md:bottom-full md:mb-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Notificaciones
          </div>

          <div className="border-b border-slate-100">
            <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Turnos sin confirmar
            </p>
            {turnosPendientes.items.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Nada pendiente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {turnosPendientes.items.map((t) => (
                  <li key={t.id} className="p-3 text-sm">
                    <Link to="/turnos/lista" onClick={cerrar} className="block hover:text-blue-600">
                      <div className="flex justify-between">
                        <span className="font-medium">{t.paciente_nombre}</span>
                        <span className="text-slate-500">{formatearHora(t.hora)}</span>
                      </div>
                      <span className="text-slate-500 text-xs">{formatearFecha(t.fecha)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {turnosPendientes.cantidad > turnosPendientes.items.length && (
              <Link to="/turnos/lista" onClick={cerrar} className="block p-3 text-sm text-blue-600 hover:underline">
                Ver los {turnosPendientes.cantidad} turnos sin confirmar →
              </Link>
            )}
          </div>

          <div>
            <p className="px-3 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Consultas vencidas sin completar
            </p>
            {consultasVencidas.items.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Nada vencido.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {consultasVencidas.items.map((t) => (
                  <li key={t.id} className="p-3 text-sm">
                    <Link to={`/consultas/${t.consulta_pendiente_id}`} onClick={cerrar} className="block hover:text-blue-600">
                      <div className="flex justify-between">
                        <span className="font-medium">{t.paciente_nombre}</span>
                        <span className="text-slate-500">{formatearHora(t.hora)}</span>
                      </div>
                      <span className="text-slate-500 text-xs">{formatearFecha(t.fecha)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {consultasVencidas.cantidad > consultasVencidas.items.length && (
              <Link to="/pacientes/consultas-pendientes" onClick={cerrar} className="block p-3 text-sm text-blue-600 hover:underline">
                Ver las {consultasVencidas.cantidad} consultas vencidas →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
