import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'

export default function NuevoPaciente() {
  const navigate = useNavigate()
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    sucursal: '',
    nombre: '',
    apellido: '',
    email: '',
    celular: '',
    fecha_nacimiento: '',
    historia_clinica: '',
    discapacidad: false,
    discapacidad_detalle: '',
  })

  useEffect(() => {
    apiClient
      .get('/sucursales/')
      .then((res) => {
        setSucursales(res.data)
        setForm((prev) => ({ ...prev, sucursal: res.data[0]?.id || '' }))
      })
      .catch(() => setError('No se pudieron cargar las sucursales.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'celular' || name === 'dni') {
      const filtrado = value.replace(/[^\d\s()+-]/g, '')
      setForm({ ...form, [name]: filtrado })
      return
    }
    

    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.post('/pacientes/', form)
      navigate('/pacientes')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo crear el paciente.'
      setError(mensaje)
    } finally {
      setGuardando(false)
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
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Nuevo paciente</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">DNI</label>
            <input
              type="text"
              inputMode="numeric"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Celular</label>
              <input
                type="tel"
                inputMode="numeric"
                name="celular"
                value={form.celular}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              max={hoy}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Historia clínica</label>
            <textarea
              name="historia_clinica"
              value={form.historia_clinica}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="discapacidad"
              checked={form.discapacidad}
              onChange={handleChange}
              id="discapacidad"
            />
            <label htmlFor="discapacidad" className="text-sm text-slate-600">Tiene discapacidad</label>
          </div>

          {form.discapacidad && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Detalle</label>
              <input
                type="text"
                name="discapacidad_detalle"
                value={form.discapacidad_detalle}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear paciente'}
          </button>
        </form>
      </div>
    </Layout>
  )
}