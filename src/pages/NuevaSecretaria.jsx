import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'

export default function NuevaSecretaria() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '', nombre: '', apellido: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.post('/secretarias/', form)
      navigate('/secretarias')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo crear la secretaria.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to="/secretarias" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Nueva secretaria</h1>

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

            <div>
              <label className="block text-sm text-slate-600 mb-1">Usuario (para iniciar sesión)</label>
              <input
                type="text" name="username" value={form.username} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2" required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2" required minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Email (opcional)</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Crear secretaria'}
            </Boton>
          </form>
        </div>
      </div>
    </Layout>
  )
}