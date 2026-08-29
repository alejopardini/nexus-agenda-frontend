import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import { hmAMinutos, minutosAHM, duracionAMinutos, diaSemanaBackend, fechaToStr } from '../utils/fechas'

export default function CalendarioTurnos() {
  const navigate = useNavigate()
  const [profesionales, setProfesionales] = useState([])
  const [disponibilidad, setDisponibilidad] = useState([])
  const [turnos, setTurnos] = useState([])
  const [excepciones, setExcepciones] = useState([])
  const [cierres, setCierres] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fecha, setFecha] = useState(new Date())

  useEffect(() => {
    Promise.all([
      apiClient.get('/profesionales/'),
      apiClient.get('/disponibilidad/'),
      apiClient.get('/turnos/'),
      apiClient.get('/excepciones/'),
      apiClient.get('/cierres/'),
      apiClient.get('/sucursales/'),
    ])
      .then(([profesionalesRes, disponibilidadRes, turnosRes, excepcionesRes, cierresRes, sucursalesRes]) => {
        setProfesionales(profesionalesRes.data)
        setDisponibilidad(disponibilidadRes.data)
        setTurnos(turnosRes.data.filter((t) => t.estado !== 'cancelado'))
        setExcepciones(excepcionesRes.data)
        setCierres(cierresRes.data)
        setSucursales(sucursalesRes.data)
      })
      .catch(() => setError('No se pudieron cargar los datos del calendario.'))
      .finally(() => setLoading(false))
  }, [])

  const cambiarDia = (delta) => {
    const nueva = new Date(fecha)
    nueva.setDate(nueva.getDate() + delta)
    setFecha(nueva)
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    )
  }

  const fechaStr = fechaToStr(fecha)
  const diaSemana = diaSemanaBackend(fecha)

  const sucursalesPorId = {}
  sucursales.forEach((s) => { sucursalesPorId[s.id] = s.nombre })

  const columnas = []
  profesionales.forEach((p) => {
    const tieneExcepcion = excepciones.some(
      (ex) => String(ex.profesional) === String(p.id) && ex.fecha === fechaStr
    )
    if (tieneExcepcion) return

    const bloques = disponibilidad
      .filter((d) => String(d.profesional) === String(p.id) && d.dia_semana === diaSemana)
      .filter((d) => !cierres.some((c) => String(c.sucursal) === String(d.sucursal) && c.fecha === fechaStr))
      .map((d) => ({
        inicio: hmAMinutos(d.hora_inicio.slice(0, 5)),
        fin: hmAMinutos(d.hora_fin.slice(0, 5)),
        sucursal: d.sucursal,
      }))

    if (bloques.length === 0) return
    columnas.push({ profesional: p, bloques })
  })

  let minInicio = null
  let maxFin = null
  columnas.forEach(({ bloques }) => {
    bloques.forEach((b) => {
      if (minInicio === null || b.inicio < minInicio) minInicio = b.inicio
      if (maxFin === null || b.fin > maxFin) maxFin = b.fin
    })
  })

  const franjas = []
  if (minInicio !== null && maxFin !== null) {
    for (let m = minInicio; m < maxFin; m += 15) franjas.push(m)
  }

  const turnosDelDia = turnos.filter((t) => t.fecha === fechaStr)

  const estaEnBloque = (bloques, minuto) => bloques.some((b) => minuto >= b.inicio && minuto < b.fin)

  const turnoQueOcupa = (profesionalId, minuto) => turnosDelDia.find((t) => {
    if (String(t.profesional) !== String(profesionalId)) return false
    const inicio = hmAMinutos(t.hora.slice(0, 5))
    const fin = inicio + duracionAMinutos(t.duracion)
    return minuto >= inicio && minuto < fin
  })

  const turnosHoy = turnosDelDia.length
  const atendidos = turnosDelDia.filter((t) => t.consulta_id && !t.consulta_pendiente_id).length

  let turnosLibres = 0
  columnas.forEach(({ profesional, bloques }) => {
    franjas.forEach((minuto) => {
      if (estaEnBloque(bloques, minuto) && !turnoQueOcupa(profesional.id, minuto)) turnosLibres += 1
    })
  })

  const handleClickCelda = (profesionalId, disponible, ocupado, minuto) => {
    if (!disponible || ocupado) return
    navigate(`/turnos/nuevo?profesional=${profesionalId}&fecha=${fechaStr}&hora=${minutosAHM(minuto)}`)
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">Calendario de turnos</h1>
          <Link to="/turnos/lista" className="text-sm text-blue-600 hover:underline">Ver lista</Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => cambiarDia(-1)}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            ← Día anterior
          </button>
          <input
            type="date"
            value={fechaStr}
            onChange={(e) => setFecha(new Date(`${e.target.value}T00:00:00`))}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => cambiarDia(1)}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Día siguiente →
          </button>
          <span className="text-sm text-slate-500 capitalize">
            {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{turnosHoy}</p>
            <p className="text-xs text-slate-500 mt-1">Turnos hoy</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{atendidos}</p>
            <p className="text-xs text-slate-500 mt-1">Atendidos</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{turnosLibres}</p>
            <p className="text-xs text-slate-500 mt-1">Turnos libres</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
          {columnas.length === 0 ? (
            <p className="text-slate-500 text-sm">Nadie atiende este día.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="w-16 text-left text-slate-500 border-b border-slate-200 pb-2">Hora</th>
                  {columnas.map(({ profesional, bloques }) => (
                    <th key={profesional.id} className="text-left text-slate-700 border-b border-slate-200 pb-2 px-2 min-w-[140px]">
                      <div>{profesional.nombre} {profesional.apellido}</div>
                      {sucursalesPorId[bloques[0].sucursal] && (
                        <div className="text-[10px] font-normal text-slate-400">{sucursalesPorId[bloques[0].sucursal]}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {franjas.map((minuto) => (
                  <tr key={minuto}>
                    <td className="text-slate-500 py-1 pr-2 align-top border-b border-slate-50">{minutosAHM(minuto)}</td>
                    {columnas.map(({ profesional, bloques }) => {
                      const disponible = estaEnBloque(bloques, minuto)
                      const turno = turnoQueOcupa(profesional.id, minuto)
                      const ocupado = Boolean(turno)
                      const esInicioTurno = ocupado && hmAMinutos(turno.hora.slice(0, 5)) === minuto

                      let claseColor = 'bg-slate-50'
                      if (disponible && !ocupado) claseColor = 'bg-green-100 hover:bg-green-200 cursor-pointer'
                      if (ocupado) claseColor = 'bg-red-100'

                      return (
                        <td
                          key={profesional.id}
                          onClick={() => handleClickCelda(profesional.id, disponible, ocupado, minuto)}
                          className={`border-b border-slate-50 px-2 py-1 align-top ${claseColor}`}
                        >
                          {esInicioTurno && (
                            <span className="text-[10px] text-red-800 leading-tight block">{turno.paciente_nombre}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
