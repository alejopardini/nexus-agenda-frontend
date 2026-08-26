import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import BotonVolver from '../components/BotonVolver'



export default function EditarProfesional() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { auth } = useAuth()

  if (auth.rol !== 'dueño') {
    return (
      <Layout>
        <p className="text-red-600">No tenés permiso para crear profesionales.</p>
      </Layout>
    )
  }

  useEffect(() => {
    apiClient
      .get(`/profesionales/${id}/`)
      .then((res) => setForm(res.data))
      .catch(() => setError('No se pudo cargar el profesional.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/profesionales/${id}/`, {
        nombre: form.nombre,
        apellido: form.apellido,
        
      })
      navigate('/profesionales')
    } catch (err) {
      setError('No se pudo guardar el profesional.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading || !form) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }
  <BotonVolver to="/profesionales" />
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Editar profesional</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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



          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </Layout>
  )
}