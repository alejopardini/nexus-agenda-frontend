import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Boton from './Boton'

export default function PacienteForm({ onCreado }) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [sucursales, setSucursales] = useState([])
  const [form, setForm] = useState({
    nombre: '', apellido: '', dni: '', obra_social: '', email: '', celular: '', fecha_nacimiento: '',
    sucursal: '',
  })

  useEffect(() => {
    apiClient.get('/sucursales/')
      .then((res) => {
        setSucursales(res.data)
        setForm((prev) => ({ ...prev, sucursal: res.data[0]?.id || '' }))
      })
      .catch(() => setError('No se pudieron cargar las sucursales.'))
  }, [])

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'celular') value = value.replace(/[^\d\s()+-]/g, '')
    setForm({ ...form, [name]: value })
  }

  const hoy = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const res = await apiClient.post('/pacientes/', form)
      onCreado(res.data)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {sucursales.length > 1 && (
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
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-600 mb-1">Nombre</label>
          <input
            type="text" name="nombre" value={form.nombre} onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2" required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-600 mb-1">Apellido</label>
          <input
            type="text" name="apellido" value={form.apellido} onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2" required
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-600 mb-1">DNI</label>
          <input
            type="text" name="dni" value={form.dni} onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-600 mb-1">Obra social</label>
          <input
            type="text" name="obra_social" value={form.obra_social} onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Email</label>
        <input
          type="email" name="email" value={form.email} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Celular</label>
        <input
          type="text" name="celular" value={form.celular} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Fecha de nacimiento</label>
        <input
          type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange}
          max={hoy} className="w-full border border-slate-300 rounded px-3 py-2"
        />
      </div>

      <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
        {guardando ? 'Guardando...' : 'Crear paciente'}
      </Boton>
    </form>
  )
}
