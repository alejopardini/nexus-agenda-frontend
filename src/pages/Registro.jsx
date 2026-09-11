import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const [form, setForm] = useState({
    username: '', password: '', password2: '', email: '', first_name: '', last_name: '', organizacion_nombre: '',
  })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!aceptaTerminos) {
      setError('Tenés que aceptar los términos y condiciones para continuar.')
      return
    }

    setGuardando(true)
    try {
      const { password2, ...payload } = form
      await register(payload)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo crear la cuenta.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-1 text-slate-800">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mb-6">Sos el dueño/a de tu clínica o consultorio.</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">Nombre</label>
            <input
              type="text" name="first_name" value={form.first_name} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2" required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">Apellido</label>
            <input
              type="text" name="last_name" value={form.last_name} onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2" required
            />
          </div>
        </div>

        <label className="block text-sm text-slate-600 mb-1">Nombre de tu clínica/consultorio (opcional)</label>
        <input
          type="text" name="organizacion_nombre" value={form.organizacion_nombre} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
          placeholder="Si lo dejás vacío, usamos tu nombre"
        />

        <label className="block text-sm text-slate-600 mb-1">Usuario</label>
        <input
          type="text" name="username" value={form.username} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4" required
        />

        <label className="block text-sm text-slate-600 mb-1">Email *</label>
        <input
          type="email" name="email" value={form.email} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4" required
        />

        <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
        <input
          type="password" name="password" value={form.password} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4" required
        />

        <label className="block text-sm text-slate-600 mb-1">Repetir contraseña</label>
        <input
          type="password" name="password2" value={form.password2} onChange={handleChange}
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4" required
        />

        <label className="flex items-start gap-2 text-xs text-slate-600 mb-6">
          <input
            type="checkbox" checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Acepto los <Link to="/terminos" target="_blank" className="text-blue-600 hover:underline">términos y condiciones</Link>
          </span>
        </label>

        <button
          type="submit" disabled={guardando}
          className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? 'Creando...' : 'Crear cuenta'}
        </button>

        <p className="text-sm text-slate-500 mt-4 text-center">
          ¿Ya tenés cuenta? <Link to="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
        </p>
      </form>
    </div>
  )
}