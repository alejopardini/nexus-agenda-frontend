import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import EditorColumnaVertebral from './EditorColumnaVertebral'
import FichaPacienteModal from './FichaPacienteModal'

const ETAPA_CUIDADO_OPCIONES = [
  ['aguda', 'Aguda'],
  ['moderada', 'Moderada'],
  ['mantenimiento', 'Mantenimiento'],
]

export default function PanelCamillaCondensado({ pacienteId, consultaId, onClose }) {
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [ajustes, setAjustes] = useState({})
  const [planActivo, setPlanActivo] = useState(null)
  const [etapaCuidado, setEtapaCuidado] = useState('')
  const [frecuenciaSeguimiento, setFrecuenciaSeguimiento] = useState('')
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [marcandoCompletada, setMarcandoCompletada] = useState(false)
  const [verFichaCompleta, setVerFichaCompleta] = useState(false)

  useEffect(() => {
    let activo = true

    Promise.all([
      apiClient.get(`/consultas/${consultaId}/`),
      apiClient.get(`/consultas/${consultaId}/ajustes_vertebrales/`).catch(() => ({ data: [] })),
      apiClient.get(`/planes/?paciente=${pacienteId}`).catch(() => ({ data: [] })),
      apiClient.get(`/pacientes/${pacienteId}/seguimiento_quiropractico/`).catch(() => ({ data: null })),
      apiClient.get('/consultas/').catch(() => ({ data: [] })),
    ])
      .then(([consultaRes, ajustesRes, planesRes, seguimientoRes, consultasRes]) => {
        if (!activo) return
        setConsulta(consultaRes.data)

        const mapa = {}
        ajustesRes.data.forEach((a) => {
          mapa[a.segmento] = {
            ajustado: a.ajustado,
            tipo_ajuste: a.tipo_ajuste || [],
            tecnica: a.tecnica || '',
            notas: a.notas || '',
            bloqueada: a.bloqueada || false,
          }
        })
        setAjustes(mapa)

        setPlanActivo(planesRes.data.find((p) => p.activo) || null)

        if (seguimientoRes.data) {
          setEtapaCuidado(seguimientoRes.data.etapa_cuidado || '')
          setFrecuenciaSeguimiento(seguimientoRes.data.frecuencia || '')
        }

        const completadas = consultasRes.data
          .filter((c) => String(c.paciente) === String(pacienteId) && c.estado === 'completada')
        setHistorial(completadas.slice(0, 5))
      })
      .catch(() => { if (activo) setError('No se pudo cargar la consulta.') })
      .finally(() => { if (activo) setLoading(false) })

    return () => { activo = false }
  }, [consultaId, pacienteId])

  const guardarAjustesConsulta = (mapaAjustes) => {
    const lista = Object.entries(mapaAjustes)
      .filter(([, v]) => v.ajustado || v.bloqueada || v.notas || v.tipo_ajuste.length || v.tecnica)
      .map(([segmento, v]) => ({
        segmento,
        ajustado: v.ajustado,
        tipo_ajuste: v.tipo_ajuste,
        tecnica: v.tecnica,
        notas: v.notas,
        bloqueada: v.bloqueada,
      }))
    apiClient.post(`/consultas/${consultaId}/ajustes_vertebrales/`, { ajustes: lista }).catch(() => {
      setError('No se pudo guardar el último ajuste. Probá de nuevo.')
    })
  }

  const guardarSeguimiento = (etapa, frecuencia) => {
    apiClient
      .post(`/pacientes/${pacienteId}/seguimiento_quiropractico/`, { etapa_cuidado: etapa, frecuencia })
      .catch(() => setError('No se pudo guardar la fase/frecuencia. Probá de nuevo.'))
  }

  const handleChangeEtapa = (valor) => {
    setEtapaCuidado(valor)
    guardarSeguimiento(valor, frecuenciaSeguimiento)
  }

  const handleBlurFrecuencia = () => {
    guardarSeguimiento(etapaCuidado, frecuenciaSeguimiento)
  }

  const marcarCompletada = async () => {
    setMarcandoCompletada(true)
    try {
      const res = await apiClient.patch(`/consultas/${consultaId}/`, { estado: 'completada' })
      setConsulta(res.data)
    } catch {
      setError('No se pudo marcar la visita como completada.')
    } finally {
      setMarcandoCompletada(false)
    }
  }

  const irAConsultaCompleta = () => {
    onClose()
    navigate(`/consultas/${consultaId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{consulta ? consulta.paciente_nombre : 'Consulta'}</h2>
            {consulta && (
              <p className="text-sm text-slate-500">
                {consulta.fecha} {consulta.estado === 'completada' && '— completada'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {loading && <p className="text-slate-500 text-sm">Cargando...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {!loading && consulta && (
            <>
              {planActivo && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="text-blue-800 font-medium">
                    Quedan {planActivo.sesiones_restantes} de {planActivo.sesiones_totales} sesiones
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-1">Etapa de cuidado</label>
                  <select
                    value={etapaCuidado}
                    onChange={(e) => handleChangeEtapa(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Sin definir</option>
                    {ETAPA_CUIDADO_OPCIONES.map(([valor, label]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 mb-1">Frecuencia recomendada</label>
                  <input
                    type="text"
                    placeholder="Ej: 1 vez por semana"
                    value={frecuenciaSeguimiento}
                    onChange={(e) => setFrecuenciaSeguimiento(e.target.value)}
                    onBlur={handleBlurFrecuencia}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {historial.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Consultas anteriores</p>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {historial.map((c) => (
                      <li key={c.id} className="py-1.5 text-slate-700">{c.fecha}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-1">Ajustes vertebrales</p>
                <p className="text-xs text-slate-500 mb-3">Click en una vértebra para marcarla. Se guarda solo.</p>
                <EditorColumnaVertebral
                  ajustes={ajustes}
                  onChangeAjustes={setAjustes}
                  onGuardarSegmento={guardarAjustesConsulta}
                />
              </div>

              {consulta.estado !== 'completada' && (
                <button
                  onClick={marcarCompletada}
                  disabled={marcandoCompletada}
                  className="w-full bg-green-600 text-white rounded py-2 font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {marcandoCompletada ? 'Guardando...' : 'Marcar visita como completada'}
                </button>
              )}

              <div className="flex justify-between pt-2 text-sm">
                <button onClick={() => setVerFichaCompleta(true)} className="text-blue-600 hover:underline">
                  Ver ficha completa del paciente
                </button>
                <button onClick={irAConsultaCompleta} className="text-blue-600 hover:underline">
                  Editar consulta completa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {verFichaCompleta && (
        <FichaPacienteModal pacienteId={pacienteId} onClose={() => setVerFichaCompleta(false)} />
      )}
    </div>
  )
}
