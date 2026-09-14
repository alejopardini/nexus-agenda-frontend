import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Boton from './Boton'
import CampoTexto from './CampoTexto'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <p className="font-sans text-[14px] text-input-error">{error}</p>}

      {sucursales.length > 1 && (
        <div>
          <label className="block font-sans font-medium text-[12px] leading-[15px] text-input-label mb-2">
            Sucursal
          </label>
          <select
            name="sucursal"
            value={form.sucursal}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-lg border border-input-border bg-white text-left font-sans text-[14px] outline-none focus:border-2 focus:border-input-focus"
            required
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoTexto
          label="Nombre"
          id="nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <CampoTexto
          label="Apellido"
          id="apellido"
          name="apellido"
          value={form.apellido}
          onChange={handleChange}
          required
        />

        <CampoTexto
          label="DNI"
          id="dni"
          name="dni"
          value={form.dni}
          onChange={handleChange}
        />
        <CampoTexto
          label="Obra social"
          id="obra_social"
          name="obra_social"
          value={form.obra_social}
          onChange={handleChange}
        />

        <CampoTexto
          label="Fecha de nacimiento"
          id="fecha_nacimiento"
          name="fecha_nacimiento"
          type="date"
          max={hoy}
          value={form.fecha_nacimiento}
          onChange={handleChange}
        />
        <CampoTexto
          label="Teléfono"
          id="celular"
          name="celular"
          value={form.celular}
          onChange={handleChange}
        />

        <CampoTexto
          label="Email"
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="md:col-span-2"
        />
      </div>

      <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
        {guardando ? 'Guardando...' : 'Crear paciente'}
      </Boton>
    </form>
  )
}
