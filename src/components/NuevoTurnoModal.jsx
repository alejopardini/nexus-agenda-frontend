import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import BuscadorPaciente from './BuscadorPaciente'
import NuevoPacienteModal from './NuevoPacienteModal'

export default function NuevoTurnoModal({ profesional, sucursalId, fecha, hora, onClose, onCreado }) {
  const [pacientes, setPacientes] = useState([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [paciente, setPaciente] = useState('')
  const [tiposTurno, setTiposTurno] = useState([])
  const [tipoTurnoId, setTipoTurnoId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)
  const [planDisponible, setPlanDisponible] = useState(null)

  useEffect(() => {
    apiClient
      .get('/pacientes/')
      .then((res) => setPacientes(res.data))
      .catch(() => setError('No se pudieron cargar los pacientes.'))
      .finally(() => setLoadingPacientes(false))
  }, [])

  useEffect(() => {
    apiClient
      .get('/tipos-turno/')
      .then((res) => {
        const activos = res.data.filter((t) => t.activo)
        setTiposTurno(activos)
        setTipoTurnoId(activos[0]?.id || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!paciente) {
      setPlanDisponible(null)
      return
    }
    setPlanDisponible(null)
    apiClient
      .get(`/planes/?paciente=${paciente}`)
      .then((res) => {
        const tienePlan = res.data.some((p) => p.activo && p.sesiones_usadas < p.sesiones_totales)
        setPlanDisponible(tienePlan)
      })
      .catch(() => setPlanDisponible(false))
  }, [paciente])

  const pacienteSeleccionado = pacientes.find((p) => String(p.id) === String(paciente))
  const tipo = tiposTurno.find((t) => String(t.id) === String(tipoTurnoId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!paciente) {
      setError('Elegí un paciente.')
      return
    }
    if (!tipo) {
      setError('Elegí un tipo de turno.')
      return
    }

    setGuardando(true)
    const payload = {
      sucursal: sucursalId,
      paciente,
      profesional: profesional.id,
      fecha,
      hora,
      tipo_turno_catalogo: tipoTurnoId,
      descripcion: '',
      estado: 'pendiente',
      duracion: `${String(Math.floor(tipo.duracion_minutos / 60)).padStart(2, '0')}:${String(tipo.duracion_minutos % 60).padStart(2, '0')}:00`,
    }
    if (planDisponible === false) {
      payload.monto_cobrado = tipo.precio
    }

    try {
      const res = await apiClient.post('/turnos/', payload)
      onCreado(res.data)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo crear el turno.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4">
        <div className="flex justify-between items-start mb-3">
          <h2 className="font-bold text-slate-800 text-lg">Nuevo turno</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <p className="text-sm text-slate-500 mb-3">
          {profesional.nombre} {profesional.apellido} — {fecha} — {hora}
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Paciente</label>
            <BuscadorPaciente
              pacientes={pacientes}
              value={paciente}
              onChange={setPaciente}
              onNuevoPaciente={() => setModalNuevoPacienteAbierto(true)}
            />
            {planDisponible === true && (
              <p className="text-xs text-slate-500 mt-1">
                Este turno va a descontar una sesión del plan activo de {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}.
              </p>
            )}
            {planDisponible === false && tipo && (
              <p className="text-xs text-slate-500 mt-1">Se va a cobrar ${tipo.precio} por este turno.</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Tipo de turno</label>
            {tiposTurno.length === 0 ? (
              <p className="text-red-600 text-xs">No hay tipos de turno configurados — cargalos en Valores turnos.</p>
            ) : (
              <select
                value={tipoTurnoId}
                onChange={(e) => setTipoTurnoId(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                required
              >
                {tiposTurno.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} — {t.duracion_minutos} min — ${t.precio}</option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={guardando || loadingPacientes}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear turno'}
          </button>
        </form>
      </div>

      {modalNuevoPacienteAbierto && (
        <NuevoPacienteModal
          onClose={() => setModalNuevoPacienteAbierto(false)}
          onCreado={(p) => {
            setPacientes((prev) => [...prev, p])
            setPaciente(p.id)
          }}
        />
      )}
    </div>
  )
}
