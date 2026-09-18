import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserMinus } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'
import BotonIcono from '../components/BotonIcono'

const ESTADO_SUSCRIPCION_LABELS = {
  trial: 'Prueba gratuita',
  activa: 'Activa',
  pago_pendiente: 'Pago pendiente',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

export default function Profesionales() {
  const { auth } = useAuth()
  const [profesionales, setProfesionales] = useState([])
  const [infoOrg, setInfoOrg] = useState(null)
  const [cantidadSucursales, setCantidadSucursales] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)

  const linkReserva = `${window.location.origin}/reservar/${auth.organizacion_id}`

  const copiarLinkReserva = async () => {
    try {
      await navigator.clipboard.writeText(linkReserva)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      alert('No se pudo copiar el link.')
    }
  }

  const cargar = () => {
    Promise.all([
      apiClient.get('/profesionales/'),
      apiClient.get('/organizacion/'),
      apiClient.get('/sucursales/'),
    ])
      .then(([profesionalesRes, orgRes, sucursalesRes]) => {
        setProfesionales(profesionalesRes.data)
        setInfoOrg(orgRes.data)
        setCantidadSucursales(sucursalesRes.data.length)
      })
      .catch(() => setError('No se pudieron cargar los profesionales.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const darDeBaja = async (id, nombre) => {
    if (!confirm(`¿Quitar a ${nombre} de la organización? Su historial se conserva.`)) return
    try {
      await apiClient.post(`/profesionales/${id}/dar_de_baja/`)
      cargar()
    } catch {
      alert('No se pudo dar de baja al profesional.')
    }
  }

  const enElLimite = infoOrg && infoOrg.cantidad_profesionales >= infoOrg.limite_profesionales

  const diasRestantesTrial =
    infoOrg?.suscripcion_estado === 'trial' && infoOrg.fecha_fin_trial
      ? Math.ceil((new Date(infoOrg.fecha_fin_trial) - new Date()) / (1000 * 60 * 60 * 24))
      : null

  return (
    <Layout titulo="Profesionales">
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-end items-center mb-1">
              {auth.rol === 'dueño' && infoOrg && (
                !enElLimite ? (
                  <Boton to="/profesionales/nuevo" variante="primary">
                    + Nuevo profesional
                  </Boton>
                ) : (
                  <span className="text-sm text-red-600">Límite del plan alcanzado</span>
                )
              )}
            </div>

            {infoOrg && (
              <p className="text-xs text-slate-400 mb-4">
                {infoOrg.cantidad_profesionales} de {infoOrg.limite_profesionales} profesionales — {infoOrg.plan_nombre}
              </p>
            )}

            {profesionales.length === 0 ? (
              <p className="text-slate-500">No hay profesionales cargados todavía.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Nombre</th>
                    {auth.rol === 'dueño' && <th className="py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {profesionales.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2">
                        {auth.rol === 'dueño' ? (
                          <Link to={`/profesionales/${p.id}/editar`} className="text-blue-600 hover:underline">
                            {p.nombre} {p.apellido}
                          </Link>
                        ) : (
                          <span>{p.nombre} {p.apellido}</span>
                        )}
                      </td>
                      {auth.rol === 'dueño' && (
                        <td className="py-2">
                          <BotonIcono
                            icono={UserMinus}
                            texto="Dar de baja"
                            color="destructive"
                            onClick={() => darDeBaja(p.id, `${p.nombre} ${p.apellido}`)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {auth.rol === 'dueño' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Reserva online</h2>
              <p className="text-sm text-slate-500 mb-3">
                Compartí este link con tus pacientes para que reserven turnos por su cuenta.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkReserva}
                  onClick={(e) => e.target.select()}
                  className="flex-1 min-w-[220px] border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-600 bg-slate-50"
                />
                <Boton onClick={copiarLinkReserva} variante="secondary">
                  {copiado ? 'Copiado ✓' : 'Copiar'}
                </Boton>
              </div>
            </div>
          )}

          {auth.rol === 'dueño' && infoOrg && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-slate-800">Plan</h2>
                <Boton to="/organizacion/suscripcion" variante="secondary">
                  Actualizar plan
                </Boton>
              </div>

              <dl className="text-sm text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <dt>Plan actual</dt>
                  <dd className="font-medium text-slate-800">{infoOrg.plan_nombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Profesionales</dt>
                  <dd>{infoOrg.cantidad_profesionales} de {infoOrg.limite_profesionales}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Sucursales</dt>
                  <dd>
                    {cantidadSucursales !== null
                      ? `${cantidadSucursales} de ${infoOrg.limite_sucursales}`
                      : `Hasta ${infoOrg.limite_sucursales}`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Estado</dt>
                  <dd>
                    {ESTADO_SUSCRIPCION_LABELS[infoOrg.suscripcion_estado] || infoOrg.suscripcion_estado}
                    {diasRestantesTrial !== null && (
                      diasRestantesTrial >= 0
                        ? ` — vence en ${diasRestantesTrial} día${diasRestantesTrial === 1 ? '' : 's'}`
                        : ' — vencida'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}