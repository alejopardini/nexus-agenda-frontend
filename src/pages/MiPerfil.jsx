import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'

export default function MiPerfil() {
  const { auth, actualizarAuth } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirmar: '' })
  const [errorPassword, setErrorPassword] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [passwordOk, setPasswordOk] = useState(false)

  useEffect(() => {
    apiClient
      .get('/mi-perfil/')
      .then((res) => setForm(res.data))
      .catch(() => setError('No se pudo cargar tu perfil.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setGuardadoOk(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardadoOk(false)
    setGuardando(true)
    try {
      const res = await apiClient.patch('/mi-perfil/', form)
      setForm(res.data)
      actualizarAuth({ username: res.data.username })
      setGuardadoOk(true)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar el perfil.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const handleChangePassword = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setPasswordOk(false)
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    setErrorPassword('')
    setPasswordOk(false)

    if (passwordForm.new_password !== passwordForm.confirmar) {
      setErrorPassword('Las contraseñas nuevas no coinciden.')
      return
    }

    setGuardandoPassword(true)
    try {
      await apiClient.post('/cambiar-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ old_password: '', new_password: '', confirmar: '' })
      setPasswordOk(true)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo cambiar la contraseña.'
      setErrorPassword(mensaje)
    } finally {
      setGuardandoPassword(false)
    }
  }

  if (loading || !form) {
    return (
      <Layout titulo="Mi perfil">
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  return (
    <Layout titulo="Mi perfil">
      <div className="max-w-lg">
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {guardadoOk && <p className="text-green-600 text-sm mb-4">Perfil actualizado.</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Apellido</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <p className="text-xs text-slate-400 mt-1">
                Necesario para poder recuperar tu contraseña por mail.
              </p>
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Cambiar contraseña</h2>

          {errorPassword && <p className="text-red-600 text-sm mb-4">{errorPassword}</p>}
          {passwordOk && <p className="text-green-600 text-sm mb-4">Contraseña actualizada.</p>}

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Contraseña actual</label>
              <input
                type="password"
                name="old_password"
                value={passwordForm.old_password}
                onChange={handleChangePassword}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Contraseña nueva</label>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handleChangePassword}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Confirmar contraseña nueva</label>
              <input
                type="password"
                name="confirmar"
                value={passwordForm.confirmar}
                onChange={handleChangePassword}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              />
            </div>

            <Boton type="submit" variante="primary" disabled={guardandoPassword} className="w-full">
              {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
            </Boton>
          </form>
        </div>

        {auth.rol === 'dueño' && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Auditoría</h2>
            <p className="text-sm text-slate-500 mb-3">
              Quién accedió a datos clínicos de tus clientes.
            </p>
            <Boton to="/auditoria" variante="secondary">
              Ver auditoría
            </Boton>
          </div>
        )}
      </div>
    </Layout>
  )
}
