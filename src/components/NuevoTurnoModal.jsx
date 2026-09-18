import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import BuscadorPaciente from './BuscadorPaciente'
import NuevoPacienteModal from './NuevoPacienteModal'
import SelectorPlantillaPlan from './SelectorPlantillaPlan'
import Modal from './Modal'
import Boton from './Boton'

const DURACION_PLAN_NUEVO_MINUTOS = 30

export default function NuevoTurnoModal({ profesional, sucursalId, fecha, hora, pacienteInicialId, onClose, onCreado }) {
  const [pacientes, setPacientes] = useState([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [paciente, setPaciente] = useState('')
  const [tiposTurno, setTiposTurno] = useState([])
  const [tipoTurnoId, setTipoTurnoId] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)
  const [planDisponible, setPlanDisponible] = useState(null)
  const [modo, setModo] = useState('individual')
  const [plantillasPlan, setPlantillasPlan] = useState([])
  const [nuevoPlanSesiones, setNuevoPlanSesiones] = useState('')
  const [nuevoPlanPrecio, setNuevoPlanPrecio] = useState('')

  useEffect(() => {
    apiClient
      .get('/pacientes/')
      .then((res) => {
        setPacientes(res.data)
        // Si el id que llegó por query param no existe o el usuario no
        // tiene acceso a ese paciente, no va a estar en esta lista —
        // se lo ignora en silencio y el buscador queda vacío, como si
        // no hubiera llegado ningún pacienteInicialId.
        if (pacienteInicialId && res.data.some((p) => String(p.id) === String(pacienteInicialId))) {
          setPaciente(pacienteInicialId)
        }
      })
      .catch(() => setError('No se pudieron cargar los pacientes.'))
      .finally(() => setLoadingPacientes(false))
  }, [pacienteInicialId])

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
    apiClient
      .get('/plantillas-plan/')
      .then((res) => setPlantillasPlan(res.data.filter((pl) => pl.activo)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!paciente) {
      setPlanDisponible(null)
      return
    }
    let cancelado = false
    setPlanDisponible(null)
    apiClient
      .get(`/planes/?paciente=${paciente}`)
      .then((res) => {
        if (cancelado) return
        const tienePlan = res.data.some((p) => p.activo && p.sesiones_usadas < p.sesiones_totales)
        setPlanDisponible(tienePlan)
      })
      .catch(() => {
        if (!cancelado) setPlanDisponible(false)
      })
    return () => {
      cancelado = true
    }
  }, [paciente])

  useEffect(() => {
    if (planDisponible !== false) {
      setModo('individual')
      setNuevoPlanSesiones('')
      setNuevoPlanPrecio('')
    }
  }, [planDisponible])

  const pacienteSeleccionado = pacientes.find((p) => String(p.id) === String(paciente))
  const tipo = tiposTurno.find((t) => String(t.id) === String(tipoTurnoId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!paciente) {
      setError('Elegí un paciente.')
      return
    }
    if (modo === 'individual' && !tipo) {
      setError('Elegí un tipo de turno.')
      return
    }
    if (modo === 'plan_nuevo' && (!nuevoPlanSesiones || !nuevoPlanPrecio)) {
      setError('Completá las sesiones y el precio del plan nuevo.')
      return
    }

    setGuardando(true)
    try {
      if (modo === 'plan_nuevo') {
        await apiClient.post('/planes/', {
          paciente,
          sesiones_totales: nuevoPlanSesiones,
          precio: nuevoPlanPrecio,
        })
      }

      const payload = {
        sucursal: sucursalId,
        paciente,
        profesional: profesional.id,
        fecha,
        hora,
        descripcion: '',
        estado: 'pendiente',
        duracion:
          modo === 'plan_nuevo'
            ? `00:${String(DURACION_PLAN_NUEVO_MINUTOS).padStart(2, '0')}:00`
            : `${String(Math.floor(tipo.duracion_minutos / 60)).padStart(2, '0')}:${String(tipo.duracion_minutos % 60).padStart(2, '0')}:00`,
      }
      if (modo === 'individual') {
        payload.tipo_turno_catalogo = tipoTurnoId
        if (planDisponible === false) {
          payload.monto_cobrado = tipo.precio
        }
      }

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
    <>
      <Modal titulo="Nuevo turno" onClose={onClose}>
        <p className="text-texto-secundario mb-3">
          {profesional.nombre} {profesional.apellido} — {fecha} — {hora}
        </p>

        {error && <p className="text-input-error mb-3">{error}</p>}

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
            {planDisponible === false && modo === 'individual' && tipo && (
              <p className="text-xs text-slate-500 mt-1">Se va a cobrar ${tipo.precio} por este turno.</p>
            )}
          </div>

          {planDisponible === false && (
            <div className="flex gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="modo"
                  checked={modo === 'individual'}
                  onChange={() => setModo('individual')}
                />
                Turno individual
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="modo"
                  checked={modo === 'plan_nuevo'}
                  onChange={() => setModo('plan_nuevo')}
                />
                Iniciar plan nuevo
              </label>
            </div>
          )}

          {modo === 'individual' ? (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              <SelectorPlantillaPlan
                plantillas={plantillasPlan}
                sesiones={nuevoPlanSesiones}
                precio={nuevoPlanPrecio}
                onChangeSesiones={setNuevoPlanSesiones}
                onChangePrecio={setNuevoPlanPrecio}
              />
            </div>
          )}

          <Boton type="submit" variante="primary" disabled={guardando || loadingPacientes} className="w-full">
            {guardando ? 'Guardando...' : 'Crear turno'}
          </Boton>
        </form>
      </Modal>

      {modalNuevoPacienteAbierto && (
        <NuevoPacienteModal
          onClose={() => setModalNuevoPacienteAbierto(false)}
          onCreado={(p) => {
            setPacientes((prev) => [...prev, p])
            setPaciente(p.id)
          }}
        />
      )}
    </>
  )
}
