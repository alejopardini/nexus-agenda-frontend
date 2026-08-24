import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import apiClient from '../api/client'
import Layout from '../components/Layout'

const TIPOS_TURNO = [
  { value: 'primera_vez', label: 'Primera vez (20 min + 5 margen)', minutos: 25 },
  { value: 'chequeo', label: 'Chequeo (10 min + 5 margen)', minutos: 15 },
  { value: 'reactivacion', label: 'Reactivación (15 min + 5 margen)', minutos: 20 },
]

function hmAMinutos(hm) {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

function minutosAHM(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function duracionAMinutos(duracionStr) {
  // "HH:MM:SS" -> minutos
  const [h, m] = duracionStr.split(':').map(Number)
  return h * 60 + m
}

// Convierte JS Date.getDay() (0=domingo..6=sábado) al formato del backend (0=lunes..6=domingo)
function diaSemanaBackend(fecha) {
  const jsDay = fecha.getDay()
  return (jsDay + 6) % 7
}

function fechaToStr(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function NuevoTurno() {
  const navigate = useNavigate()
  const hoy = new Date()

  const [sucursales, setSucursales] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [todaDisponibilidad, setTodaDisponibilidad] = useState([])
  const [todosTurnos, setTodosTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)

  const [form, setForm] = useState({
    sucursal: '',
    paciente: '',
    profesional: '',
    tipoTurno: 'primera_vez',
    hora: '',
    descripcion: '',
    estado: 'pendiente',
  })

  useEffect(() => {
    Promise.all([
      apiClient.get('/sucursales/'),
      apiClient.get('/pacientes/'),
      apiClient.get('/profesionales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/turnos/'),
    ])
      .then(([sucursalesRes, pacientesRes, profesionalesRes, disponibilidadRes, turnosRes]) => {
        setSucursales(sucursalesRes.data)
        setPacientes(pacientesRes.data)
        setProfesionales(profesionalesRes.data)
        setTodaDisponibilidad(disponibilidadRes.data)
        setTodosTurnos(turnosRes.data.filter((t) => t.estado !== 'cancelado'))
        setForm((prev) => ({ ...prev, sucursal: sucursalesRes.data[0]?.id || '' }))
      })
      .catch(() => setError('No se pudieron cargar los datos del formulario.'))
      .finally(() => setLoading(false))
  }, [])

  const idsConDisponibilidad = new Set(todaDisponibilidad.map((d) => String(d.profesional)))
  const profesionalesElegibles = profesionales.filter((p) => idsConDisponibilidad.has(String(p.id)))

  const disponibilidadDelProfesional = todaDisponibilidad.filter(
    (d) => String(d.profesional) === String(form.profesional)
  )
  const diasPermitidos = new Set(disponibilidadDelProfesional.map((d) => d.dia_semana))

  const filterDate = (fecha) => {
    if (fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return false
    return diasPermitidos.has(diaSemanaBackend(fecha))
  }

  const tipo = TIPOS_TURNO.find((t) => t.value === form.tipoTurno)
  const fechaStr = fechaSeleccionada ? fechaToStr(fechaSeleccionada) : null

  const turnosDelDia = fechaStr
    ? todosTurnos.filter(
        (t) => String(t.profesional) === String(form.profesional) && t.fecha === fechaStr
      )
    : []

  const disponibilidadDelDia = fechaSeleccionada
    ? disponibilidadDelProfesional.filter((d) => d.dia_semana === diaSemanaBackend(fechaSeleccionada))
    : []

  // Generamos candidatos cada 15 min dentro de la disponibilidad del día,
  // y sacamos los que se superpongan con un turno ya existente.
  let horariosDisponibles = []
  disponibilidadDelDia.forEach((d) => {
    const inicioMin = hmAMinutos(d.hora_inicio.slice(0, 5))
    const finMin = hmAMinutos(d.hora_fin.slice(0, 5))
    for (let m = inicioMin; m + tipo.minutos <= finMin; m += 15) {
      const slotInicio = m
      const slotFin = m + tipo.minutos
      const ocupado = turnosDelDia.some((t) => {
        const tInicio = hmAMinutos(t.hora.slice(0, 5))
        const tFin = tInicio + duracionAMinutos(t.duracion)
        return slotInicio < tFin && tInicio < slotFin
      })
      if (!ocupado) {
        const hm = minutosAHM(m)
        if (!horariosDisponibles.includes(hm)) horariosDisponibles.push(hm)
      }
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'profesional') {
      setForm({ ...form, profesional: value, hora: '' })
      setFechaSeleccionada(null)
      return
    }
    if (name === 'tipoTurno') {
      setForm({ ...form, tipoTurno: value, hora: '' })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fechaSeleccionada) {
      setError('Elegí una fecha.')
      return
    }
    if (!form.hora) {
      setError('Elegí un horario.')
      return
    }

    setGuardando(true)

    const payload = {
      sucursal: form.sucursal,
      paciente: form.paciente,
      profesional: form.profesional,
      fecha: fechaStr,
      hora: form.hora,
      descripcion: form.descripcion,
      estado: form.estado,
      duracion: `${String(Math.floor(tipo.minutos / 60)).padStart(2, '0')}:${String(tipo.minutos % 60).padStart(2, '0')}:00`,
    }

    try {
      await apiClient.post('/turnos/', payload)
      navigate('/turnos')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.values(data).flat().join(' ')
        : 'No se pudo crear el turno.'
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Nuevo turno</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm text-slate-600 mb-1">Paciente</label>
            <select
              name="paciente"
              value={form.paciente}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
              required
            >
              <option value="">Seleccione un paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Profesional</label>
            <select
              name="profesional"
              value={form.profesional}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
              required
            >
              <option value="">Seleccione un profesional</option>
              {profesionalesElegibles.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
            {profesionales.length > profesionalesElegibles.length && (
              <p className="text-xs text-slate-400 mt-1">
                Algunos profesionales no aparecen porque todavía no tienen disponibilidad configurada.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Tipo de turno</label>
            <select
              name="tipoTurno"
              value={form.tipoTurno}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
            >
              {TIPOS_TURNO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Fecha</label>
              <DatePicker
                selected={fechaSeleccionada}
                onChange={(fecha) => {
                  setFechaSeleccionada(fecha)
                  setForm({ ...form, hora: '' })
                }}
                filterDate={filterDate}
                minDate={hoy}
                disabled={!form.profesional}
                placeholderText={form.profesional ? 'Elegí una fecha' : 'Elegí un profesional primero'}
                className="w-full border border-slate-300 rounded px-3 py-2"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Horario</label>
              <select
                name="hora"
                value={form.hora}
                onChange={handleChange}
                disabled={!fechaSeleccionada}
                className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">Seleccione un horario</option>
                {horariosDisponibles.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {fechaSeleccionada && horariosDisponibles.length === 0 && (
                <p className="text-red-600 text-xs mt-1">No hay horarios libres ese día para este tipo de turno.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear turno'}
          </button>
        </form>
      </div>
    </Layout>
  )
}