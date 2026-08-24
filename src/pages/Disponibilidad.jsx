import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

const DIAS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

export default function Disponibilidad() {
  const { auth } = useAuth()
  const [sucursales, setSucursales] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [disponibilidades, setDisponibilidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const esProfesionalPropio = auth.rol === 'profesional'

  const [form, setForm] = useState({
    sucursal: '',
    profesional: esProfesionalPropio ? auth.profesional_id : '',
    dia_semana: 0,
    hora_inicio: '09:00',
    hora_fin: '18:00',
  })

  const cargarDatos = () => {
    const pedidos = [apiClient.get('/sucursales/'), apiClient.get('/disponibilidad/')]
    if (!esProfesionalPropio) {
      pedidos.push(apiClient.get('/profesionales/'))
    }
    Promise.all(pedidos)
      .then(([sucursalesRes, disponibilidadRes, profesionalesRes]) => {
        setSucursales(sucursalesRes.data)
        setDisponibilidades(disponibilidadRes.data)
        if (profesionalesRes) setProfesionales(profesionalesRes.data)
        setForm((prev) => ({ ...prev, sucursal: sucursalesRes.data[0]?.id || '' }))
      })
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.post('/disponibilidad/', form)
      cargarDatos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar la disponibilidad.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await apiClient.delete(`/disponibilidad/${id}/`)
      cargarDatos()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Disponibilidad horaria</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!esProfesionalPropio && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Profesional</label>
                <select
                  name="profesional"
                  value={form.profesional}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Seleccione un profesional</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
              <select
                name="sucursal"
                value={form.sucursal}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Día</label>
              <select
                name="dia_semana"
                value={form.dia_semana}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {DIAS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Desde</label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={form.hora_inicio}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Hasta</label>
                <input
                  type="time"
                  name="hora_fin"
                  value={form.hora_fin}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Agregar horario'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Horarios cargados</h2>
          {disponibilidades.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay horarios configurados todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {disponibilidades.map((d) => (
                <li key={d.id} className="py-2 flex justify-between items-center text-sm">
                  <span>
                    {d.dia_semana_nombre}: {d.hora_inicio} - {d.hora_fin}
                  </span>
                  <button
                    onClick={() => eliminar(d.id)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}