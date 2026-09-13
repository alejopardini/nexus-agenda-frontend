import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import apiClient from '../api/client'
import Layout from '../components/Layout'

const RANGOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
]

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const COLOR_NUEVOS = '#26457a'
const COLOR_RECURRENTES = '#59c2bf'

const formatMonto = (monto) =>
  `$${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatFechaCorta = (fecha, esAnual) => {
  const [, mes, dia] = fecha.split('-')
  if (esAnual) return MESES_CORTOS[Number(mes) - 1]
  return `${dia}/${mes}`
}

export default function Estadisticas() {
  const [modo, setModo] = useState('periodo') // 'periodo' | 'anio'
  const [dias, setDias] = useState(30)
  const [anio, setAnio] = useState(null)
  const [aniosDisponibles, setAniosDisponibles] = useState([])
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .get('/estadisticas/anios-disponibles/')
      .then((res) => {
        setAniosDisponibles(res.data)
        if (res.data.length > 0) setAnio(res.data[res.data.length - 1])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (modo === 'anio' && anio == null) return
    setLoading(true)
    setError('')
    const query = modo === 'anio' ? `anio=${anio}` : `dias=${dias}`
    apiClient
      .get(`/estadisticas/?${query}`)
      .then((res) => setDatos(res.data))
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setLoading(false))
  }, [modo, dias, anio])

  const cambiarRango = (nuevosDias) => {
    setDias(nuevosDias)
    setLoading(true)
    setError('')
  }

  const maxTipoTurno = datos ? Math.max(1, ...datos.top_tipos_turno.map((t) => t.cantidad)) : 1
  const esAnual = modo === 'anio'

  return (
    <Layout
      titulo="Estadísticas"
      controles={
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 rounded p-1">
            <button
              onClick={() => setModo('periodo')}
              className={`text-sm px-3 py-1 rounded ${
                modo === 'periodo' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              Por período
            </button>
            <button
              onClick={() => setModo('anio')}
              className={`text-sm px-3 py-1 rounded ${
                modo === 'anio' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              Por año
            </button>
          </div>

          {modo === 'periodo' ? (
            <div className="flex gap-2">
              {RANGOS.map((r) => (
                <button
                  key={r.dias}
                  onClick={() => cambiarRango(r.dias)}
                  className={`text-sm px-3 py-1.5 rounded border ${
                    dias === r.dias
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <select
              value={anio ?? ''}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-sm border border-slate-300 rounded px-2 py-1.5"
            >
              {aniosDisponibles.length === 0 && <option value="">Sin años disponibles</option>}
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {loading && <p className="text-slate-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && datos && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-primary">{datos.total_pacientes}</p>
              <p className="text-xs text-slate-500 mt-1">Pacientes</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-primary">{datos.total_visitas}</p>
              <p className="text-xs text-slate-500 mt-1">Visitas</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatMonto(datos.total_facturado)}</p>
              <p className="text-xs text-slate-500 mt-1">Facturado</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatMonto(datos.total_cobrado)}</p>
              <p className="text-xs text-slate-500 mt-1">Cobrado</p>
            </div>
          </div>
        )}

        {!loading && !error && datos && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-sm font-semibold text-primary mb-3">
              {esAnual ? 'Evolución mensual' : 'Evolución diaria'}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={datos.evolucion_diaria}>
                <CartesianGrid vertical={false} stroke="#e1e0d9" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(fecha) => formatFechaCorta(fecha, esAnual)}
                  tick={{ fontSize: 11, fill: '#898781' }}
                  axisLine={{ stroke: '#c3c2b7' }}
                  tickLine={false}
                  interval={esAnual ? 0 : Math.max(0, Math.ceil(datos.evolucion_diaria.length / 10) - 1)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#898781' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip labelFormatter={(fecha) => formatFechaCorta(fecha, esAnual)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="pacientes_nuevos"
                  name="Nuevos"
                  stackId="visitas"
                  fill={COLOR_NUEVOS}
                  stroke="#ffffff"
                  strokeWidth={2}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="pacientes_recurrentes"
                  name="Recurrentes"
                  stackId="visitas"
                  fill={COLOR_RECURRENTES}
                  stroke="#ffffff"
                  strokeWidth={2}
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && datos && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-sm font-semibold text-primary mb-3">Top pacientes</h2>
              {datos.top_pacientes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sin datos facturados en este rango.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {datos.top_pacientes.map((p, i) => (
                    <li key={p.paciente_id} className="py-2 flex justify-between items-center text-sm">
                      <span className="text-slate-700">
                        <span className="text-slate-400 mr-2">{i + 1}.</span>
                        {p.nombre}
                      </span>
                      <span className="font-medium text-slate-800">{formatMonto(p.total_facturado)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-sm font-semibold text-primary mb-3">Top tipos de turno</h2>
              {datos.top_tipos_turno.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sin turnos con tipo cargado en este rango.</p>
              ) : (
                <div className="space-y-3">
                  {datos.top_tipos_turno.map((t) => (
                    <div key={t.tipo_turno}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{t.label}</span>
                        <span className="font-medium text-slate-800">{t.cantidad}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded h-2">
                        <div
                          className="bg-primary h-2 rounded"
                          style={{ width: `${(t.cantidad / maxTipoTurno) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
