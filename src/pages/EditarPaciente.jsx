import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import SelectorFrasesRapidas from '../components/SelectorFrasesRapidas'

export default function EditarPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    apiClient
      .get(`/pacientes/${id}/`)
      .then((res) => setForm(res.data))
      .catch(() => setError('No se pudo cargar el paciente.'))
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
      await apiClient.patch(`/pacientes/${id}/`, form)
      navigate('/pacientes', { state: { abrirPacienteId: id } })
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
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error && !form) {
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to={`/pacientes/${id}`} texto="Volver a la ficha" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Editar paciente</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
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

            <div className="flex gap-4">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-slate-600">Historia clínica</label>
                <SelectorFrasesRapidas
                  onSeleccionar={(texto) =>
                    setForm((prev) => ({
                      ...prev,
                      historia_clinica: prev.historia_clinica ? `${prev.historia_clinica}\n${texto}` : texto,
                    }))
                  }
                />
              </div>
              <textarea
                name="historia_clinica" value={form.historia_clinica || ''} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2" rows={4}
              />
            </div>

            <button
              type="submit" disabled={guardando}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}