import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'

const DIAS = [
  { value: 0, label: 'Lunes' }, { value: 1, label: 'Martes' }, { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' }, { value: 4, label: 'Viernes' }, { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

export default function EditarProfesional() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { auth } = useAuth()

  const [sucursales, setSucursales] = useState([])
  const [disponibilidades, setDisponibilidades] = useState([])
  const [errorDisp, setErrorDisp] = useState('')
  const [guardandoHorario, setGuardandoHorario] = useState(false)
  const [horario, setHorario] = useState({
    sucursal: '', dia_semana: 0, hora_inicio: '09:00', hora_fin: '18:00',
  })

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

  const cargarDisponibilidad = () => {
    apiClient.get('/disponibilidad/')
      .then((res) => setDisponibilidades(res.data.filter((d) => String(d.profesional) === String(id))))
      .catch(() => setErrorDisp('No se pudo cargar la disponibilidad.'))
  }

  useEffect(() => {
    apiClient.get('/sucursales/')
      .then((res) => {
        setSucursales(res.data)
        setHorario((prev) => ({ ...prev, sucursal: res.data[0]?.id || '' }))
      })
      .catch(() => {})
    cargarDisponibilidad()
  }, [id])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleChangeHorario = (e) => setHorario({ ...horario, [e.target.name]: e.target.value })

  const handleSubmitHorario = async (e) => {
    e.preventDefault()
    setErrorDisp('')
    setGuardandoHorario(true)
    try {
      await apiClient.post('/disponibilidad/', { ...horario, profesional: id })
      cargarDisponibilidad()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar el horario.'
      setErrorDisp(mensaje)
    } finally {
      setGuardandoHorario(false)
    }
  }

  const eliminarHorario = async (dispId) => {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await apiClient.delete(`/disponibilidad/${dispId}/`)
      cargarDisponibilidad()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/profesionales/${id}/`, {
        nombre: form.nombre,
        apellido: form.apellido,
        puede_crear_turnos: form.puede_crear_turnos,
        puede_crear_pacientes: form.puede_crear_pacientes,
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
  return (
    <Layout>
      <div className="max-w-lg">
        <BotonVolver to="/profesionales" className="mb-4" />
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Editar profesional</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" name="puede_crear_turnos" checked={!!form.puede_crear_turnos}
                  onChange={handleChange} id="puede-crear-turnos"
                />
                <label htmlFor="puede-crear-turnos" className="text-sm text-slate-700">Puede crear turnos</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" name="puede_crear_pacientes" checked={!!form.puede_crear_pacientes}
                  onChange={handleChange} id="puede-crear-pacientes"
                />
                <label htmlFor="puede-crear-pacientes" className="text-sm text-slate-700">Puede crear pacientes</label>
              </div>
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Disponibilidad horaria</h2>

          {errorDisp && <p className="text-red-600 text-sm mb-4">{errorDisp}</p>}

          {disponibilidades.length === 0 ? (
            <p className="text-slate-500 text-sm mb-4">No hay horarios cargados todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100 mb-4">
              {disponibilidades.map((d) => (
                <li key={d.id} className="py-2 flex justify-between items-center text-sm">
                  <span>{d.dia_semana_nombre}: {d.hora_inicio} - {d.hora_fin}</span>
                  <button onClick={() => eliminarHorario(d.id)} className="text-red-600 text-xs hover:underline">
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmitHorario} className="space-y-3">
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

            <Boton type="submit" variante="primary" disabled={guardandoHorario}>
              {guardandoHorario ? 'Guardando...' : 'Agregar horario'}
            </Boton>
          </form>
        </div>
      </div>
    </Layout>
  )
}