import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'

const DIAS = [
  { value: 0, label: 'Lunes' }, { value: 1, label: 'Martes' }, { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' }, { value: 4, label: 'Viernes' }, { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

export default function NuevoProfesional() {
  const navigate = useNavigate()
  const [sucursales, setSucursales] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    username: '', password: '', email: '', nombre: '', apellido: '',
    puede_crear_turnos: false, puede_crear_pacientes: false,
  })

  const [cargarHorario, setCargarHorario] = useState(false)
  const [horario, setHorario] = useState({
    sucursal: '', dia_semana: 0, hora_inicio: '09:00', hora_fin: '18:00',
  })

  useEffect(() => {
    apiClient.get('/sucursales/')
      .then((res) => {
        setSucursales(res.data)
        setHorario((prev) => ({ ...prev, sucursal: res.data[0]?.id || '' }))
      })
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }
  const handleChangeHorario = (e) => setHorario({ ...horario, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const res = await apiClient.post('/profesionales/', form)
      if (cargarHorario) {
        await apiClient.post('/disponibilidad/', { ...horario, profesional: res.data.id })
      }
      navigate('/profesionales')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo crear el profesional.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to="/profesionales" className="mb-4" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Nuevo profesional</h1>
          <p className="text-sm text-slate-500 mb-4">
            Se crea una cuenta de acceso para que el profesional pueda usar la app.
          </p>

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

            <hr className="border-slate-100" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" name="puede_crear_turnos" checked={form.puede_crear_turnos}
                  onChange={handleChange} id="puede-crear-turnos"
                />
                <label htmlFor="puede-crear-turnos" className="text-sm text-slate-700">Puede crear turnos</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" name="puede_crear_pacientes" checked={form.puede_crear_pacientes}
                  onChange={handleChange} id="puede-crear-pacientes"
                />
                <label htmlFor="puede-crear-pacientes" className="text-sm text-slate-700">Puede crear pacientes</label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox" checked={cargarHorario}
                onChange={(e) => setCargarHorario(e.target.checked)}
                id="cargar-horario"
              />
              <label htmlFor="cargar-horario" className="text-sm text-slate-700 font-medium">
                Cargar un horario de atención inicial
              </label>
            </div>

            {cargarHorario && (
              <div className="bg-slate-50 rounded p-3 space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
                  <select
                    name="sucursal" value={horario.sucursal} onChange={handleChangeHorario}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Día</label>
                  <select
                    name="dia_semana" value={horario.dia_semana} onChange={handleChangeHorario}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  >
                    {DIAS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">Desde</label>
                    <input
                      type="time" name="hora_inicio" value={horario.hora_inicio} onChange={handleChangeHorario}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">Hasta</label>
                    <input
                      type="time" name="hora_fin" value={horario.hora_fin} onChange={handleChangeHorario}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Podés sumar más bloques después desde "Disponibilidad" en el menú de Turnos.
                </p>
              </div>
            )}

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Crear profesional'}
            </Boton>
          </form>
        </div>
      </div>
    </Layout>
  )
}