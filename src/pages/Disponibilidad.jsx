import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'
import BotonIcono from '../components/BotonIcono'
import { formatearFecha } from '../utils/fechas'

const DIAS = [
  { value: 0, label: 'Lunes' }, { value: 1, label: 'Martes' }, { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' }, { value: 4, label: 'Viernes' }, { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

export default function Disponibilidad() {
  const { auth } = useAuth()
  const [sucursales, setSucursales] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [disponibilidades, setDisponibilidades] = useState([])
  const [excepciones, setExcepciones] = useState([])
  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardandoExcepcion, setGuardandoExcepcion] = useState(false)
  const [guardandoCierre, setGuardandoCierre] = useState(false)

  const esProfesionalPropio = auth.rol === 'profesional'
  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    sucursal: '', profesional: esProfesionalPropio ? auth.profesional_id : '',
    dia_semana: 0, hora_inicio: '09:00', hora_fin: '18:00',
  })

  const [formExcepcion, setFormExcepcion] = useState({
    sucursal: '', profesional: esProfesionalPropio ? auth.profesional_id : '',
    fecha_inicio: '', fecha_fin: '', motivo: '',
  })

  const [formCierre, setFormCierre] = useState({ sucursal: '', fecha: '', motivo: '' })

  const cargarDatos = () => {
    const pedidos = [
      apiClient.get('/sucursales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/excepciones/'),
      apiClient.get('/cierres/'),
    ]
    if (!esProfesionalPropio) pedidos.push(apiClient.get('/profesionales/'))

    Promise.all(pedidos)
      .then(([sucursalesRes, disponibilidadRes, excepcionesRes, cierresRes, profesionalesRes]) => {
        setSucursales(sucursalesRes.data)
        setDisponibilidades(disponibilidadRes.data)
        setExcepciones(excepcionesRes.data)
        setCierres(cierresRes.data)
        if (profesionalesRes) setProfesionales(profesionalesRes.data)
        const primeraSucursal = sucursalesRes.data[0]?.id || ''
        setForm((prev) => ({ ...prev, sucursal: primeraSucursal }))
        setFormExcepcion((prev) => ({ ...prev, sucursal: primeraSucursal }))
        setFormCierre((prev) => ({ ...prev, sucursal: primeraSucursal }))
      })
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleChangeExcepcion = (e) => setFormExcepcion({ ...formExcepcion, [e.target.name]: e.target.value })
  const handleChangeCierre = (e) => setFormCierre({ ...formCierre, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.post('/disponibilidad/', form)
      cargarDatos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar la disponibilidad.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const handleSubmitExcepcion = async (e) => {
    e.preventDefault()
    setError('')
    setGuardandoExcepcion(true)
    try {
      await apiClient.post('/excepciones/rango/', formExcepcion)
      setFormExcepcion((prev) => ({ ...prev, fecha_inicio: '', fecha_fin: '', motivo: '' }))
      cargarDatos()
    } catch (err) {
      setError('No se pudo guardar la excepción.')
    } finally {
      setGuardandoExcepcion(false)
    }
  }

  const handleSubmitCierre = async (e) => {
    e.preventDefault()
    setError('')
    setGuardandoCierre(true)
    try {
      await apiClient.post('/cierres/', formCierre)
      setFormCierre((prev) => ({ ...prev, fecha: '', motivo: '' }))
      cargarDatos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar el cierre.'
      setError(mensaje)
    } finally {
      setGuardandoCierre(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await apiClient.delete(`/disponibilidad/${id}/`)
      cargarDatos()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const eliminarExcepcion = async (id) => {
    if (!confirm('¿Eliminar esta excepción?')) return
    try {
      await apiClient.delete(`/excepciones/${id}/`)
      cargarDatos()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const eliminarCierre = async (id) => {
    if (!confirm('¿Eliminar este cierre?')) return
    try {
      await apiClient.delete(`/cierres/${id}/`)
      cargarDatos()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  if (loading) {
    return (
      <Layout titulo="Disponibilidad">
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  // Agrupar disponibilidad por sucursal -> profesional para la vista general.
  // Con una sola sucursal no tiene sentido mostrar un encabezado que agrupa
  // un único grupo (ruido) — el nombre de esa sucursal se muestra como
  // subtítulo discreto en su lugar, para que no aparezca "de la nada" el día
  // que se cargue una segunda sucursal.
  const mapaSucursales = {}
  sucursales.forEach((s) => { mapaSucursales[s.id] = s.nombre })

  const agrupadasPorSucursal = {}
  disponibilidades.forEach((d) => {
    if (!agrupadasPorSucursal[d.sucursal]) {
      agrupadasPorSucursal[d.sucursal] = { nombre: mapaSucursales[d.sucursal] || '—', profesionales: {} }
    }
    const profesionales = agrupadasPorSucursal[d.sucursal].profesionales
    if (!profesionales[d.profesional]) profesionales[d.profesional] = { nombre: d.profesional_nombre, items: [] }
    profesionales[d.profesional].items.push(d)
  })
  const mostrarAgrupacionPorSucursal = sucursales.length > 1

  const grupoProfesional = (profId, grupo) => (
    <div key={profId} className="border border-slate-200 rounded p-3">
      <p className="font-medium text-sm text-slate-800 mb-1">{grupo.nombre}</p>
      <ul className="text-sm space-y-1">
        {grupo.items.map((d) => (
          <li key={d.id} className="flex justify-between items-center text-slate-600">
            <span>{d.dia_semana_nombre}: {d.hora_inicio} - {d.hora_fin}</span>
            <BotonIcono icono={Trash2} texto="Eliminar" color="destructive" onClick={() => eliminar(d.id)} />
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <Layout titulo="Disponibilidad">
      <div className="max-w-5xl">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Vista general — horarios por profesional</h2>
            {!mostrarAgrupacionPorSucursal && sucursales[0] && (
              <p className="text-xs text-slate-400 mb-1">{sucursales[0].nombre}</p>
            )}
            <p className="text-xs text-slate-500 mb-3">
              Útil para ubicar rápido en qué días/horarios atiende cada uno antes de buscar un turno.
            </p>
            {Object.keys(agrupadasPorSucursal).length === 0 ? (
              <p className="text-slate-500 text-sm">No hay horarios configurados todavía.</p>
            ) : mostrarAgrupacionPorSucursal ? (
              <div className="space-y-4">
                {Object.entries(agrupadasPorSucursal).map(([sucId, sucGrupo]) => (
                  <div key={sucId}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{sucGrupo.nombre}</p>
                    <div className="space-y-3">
                      {Object.entries(sucGrupo.profesionales).map(([profId, grupo]) => grupoProfesional(profId, grupo))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(agrupadasPorSucursal).flatMap((sucGrupo) => Object.entries(sucGrupo.profesionales))
                  .map(([profId, grupo]) => grupoProfesional(profId, grupo))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Agregar horario</h2>
              <p className="text-xs text-slate-500 mb-3">
                Podés cargar varios bloques el mismo día — por ejemplo, "Lunes 9:00-12:00" y después "Lunes 16:00-18:00" por separado.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {!esProfesionalPropio && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Profesional</label>
                    <select
                      name="profesional" value={form.profesional} onChange={handleChange}
                      className="w-full border border-slate-300 rounded px-3 py-2" required
                    >
                      <option value="">Seleccione un profesional</option>
                      {profesionales.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
                  <select
                    name="sucursal" value={form.sucursal} onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-3 py-2" required
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Día</label>
                  <select
                    name="dia_semana" value={form.dia_semana} onChange={handleChange}
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
                      type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange}
                      className="w-full border border-slate-300 rounded px-3 py-2" required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">Hasta</label>
                    <input
                      type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange}
                      className="w-full border border-slate-300 rounded px-3 py-2" required
                    />
                  </div>
                </div>

                <Boton type="submit" variante="primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Agregar horario'}
                </Boton>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Vacaciones / licencias (por profesional)</h2>
              <p className="text-xs text-slate-500 mb-3">Bloquea un rango de fechas para un profesional puntual.</p>

              <form onSubmit={handleSubmitExcepcion} className="space-y-3 mb-4">
                {!esProfesionalPropio && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Profesional</label>
                    <select
                      name="profesional" value={formExcepcion.profesional} onChange={handleChangeExcepcion}
                      className="w-full border border-slate-300 rounded px-3 py-2" required
                    >
                      <option value="">Seleccione un profesional</option>
                      {profesionales.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
                  <select
                    name="sucursal" value={formExcepcion.sucursal} onChange={handleChangeExcepcion}
                    className="w-full border border-slate-300 rounded px-3 py-2" required
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">Desde</label>
                    <input
                      type="date" name="fecha_inicio" value={formExcepcion.fecha_inicio} onChange={handleChangeExcepcion}
                      min={hoy} className="w-full border border-slate-300 rounded px-3 py-2" required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">Hasta</label>
                    <input
                      type="date" name="fecha_fin" value={formExcepcion.fecha_fin} onChange={handleChangeExcepcion}
                      min={formExcepcion.fecha_inicio || hoy} className="w-full border border-slate-300 rounded px-3 py-2" required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Motivo (opcional)</label>
                  <input
                    type="text" name="motivo" placeholder="Ej: Vacaciones"
                    value={formExcepcion.motivo} onChange={handleChangeExcepcion}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <Boton type="submit" variante="primary" disabled={guardandoExcepcion}>
                  {guardandoExcepcion ? 'Guardando...' : 'Agregar excepción'}
                </Boton>
              </form>

              {excepciones.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay excepciones cargadas.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {excepciones.map((ex) => (
                    <li key={ex.id} className="py-2 flex justify-between items-center text-sm">
                      <span>{ex.profesional_nombre} — {formatearFecha(ex.fecha)} {ex.motivo && `(${ex.motivo})`}</span>
                      <BotonIcono icono={Trash2} texto="Eliminar" color="destructive" onClick={() => eliminarExcepcion(ex.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {auth.rol === 'dueño' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Cierre general (feriados)</h2>
                <p className="text-xs text-slate-500 mb-3">Cierra la sucursal para TODOS los profesionales ese día.</p>

                <form onSubmit={handleSubmitCierre} className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Sucursal</label>
                    <select
                      name="sucursal" value={formCierre.sucursal} onChange={handleChangeCierre}
                      className="w-full border border-slate-300 rounded px-3 py-2" required
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Fecha</label>
                      <input
                        type="date" name="fecha" value={formCierre.fecha} onChange={handleChangeCierre}
                        min={hoy} className="w-full border border-slate-300 rounded px-3 py-2" required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-slate-600 mb-1">Motivo</label>
                      <input
                        type="text" name="motivo" placeholder="Ej: Feriado nacional"
                        value={formCierre.motivo} onChange={handleChangeCierre}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  <Boton type="submit" variante="primary" disabled={guardandoCierre}>
                    {guardandoCierre ? 'Guardando...' : 'Agregar cierre'}
                  </Boton>
                </form>

                {cierres.length === 0 ? (
                  <p className="text-slate-500 text-sm">No hay cierres cargados.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {cierres.map((c) => (
                      <li key={c.id} className="py-2 flex justify-between items-center text-sm">
                        <span>{formatearFecha(c.fecha)} {c.motivo && `— ${c.motivo}`}</span>
                        <BotonIcono icono={Trash2} texto="Eliminar" color="destructive" onClick={() => eliminarCierre(c.id)} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}