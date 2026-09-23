import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'

export default function EditarCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    apiClient
      .get(`/clientes/${id}/`)
      .then((res) => setForm(res.data))
      .catch(() => setError('No se pudo cargar el cliente.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'celular') value = value.replace(/[^\d\s()+-]/g, '')
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/clientes/${id}/`, form)
      navigate('/clientes', { state: { abrirClienteId: id } })
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <Layout titulo="Editar cliente">
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error && !form) {
    return (
      <Layout titulo="Editar cliente">
        <p className="text-red-600">{error}</p>
      </Layout>
    )
  }

  return (
    <Layout titulo="Editar cliente">
      <div className="max-w-lg">
        <BotonVolver to="/clientes" state={{ abrirClienteId: id }} className="mb-4" />
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type="text" name="dni" value={form.dni || ''} onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Obra social</label>
                <input
                  type="text" name="obra_social" value={form.obra_social || ''} onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email" name="email" value={form.email || ''} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Celular</label>
              <input
                type="text" name="celular" value={form.celular || ''} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Fecha de nacimiento</label>
              <input
                type="date" name="fecha_nacimiento" value={form.fecha_nacimiento || ''} onChange={handleChange}
                max={hoy} className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox" name="discapacidad" checked={form.discapacidad || false}
                onChange={(e) => setForm({ ...form, discapacidad: e.target.checked })}
                id="discapacidad"
              />
              <label htmlFor="discapacidad" className="text-sm text-slate-700">Tiene discapacidad</label>
            </div>

            {form.discapacidad && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Detalle</label>
                <input
                  type="text" name="discapacidad_detalle" value={form.discapacidad_detalle || ''} onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-600 mb-1">Historia clínica</label>
              <textarea
                name="historia_clinica" value={form.historia_clinica || ''} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2" rows={4}
              />
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>
          </form>
        </div>
      </div>
    </Layout>
  )
}
