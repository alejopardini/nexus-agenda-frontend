import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import EditorColumnaVertebral from './EditorColumnaVertebral'
import FichaPacienteModal from './FichaPacienteModal'
import GestionArchivosPaciente from './GestionArchivosPaciente'
import Boton from './Boton'
import { useEsVerticalQuiro } from '../hooks/useVertical'

const ETAPA_CUIDADO_OPCIONES = [
  ['aguda', 'Aguda'],
  ['intermedia', 'Intermedia'],
  ['mantenimiento', 'Mantenimiento'],
  ['reactivacion', 'Reactivación'],
]

const PANEL_TABS = [
  { key: 'informacion', label: 'Información' },
  { key: 'notas', label: 'Notas' },
  { key: 'archivos', label: 'Archivos' },
]

export default function PanelCamillaCondensado({ pacienteId, consultaId, onClose }) {
  const navigate = useNavigate()
  const esQuiro = useEsVerticalQuiro()
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
  const [panelTab, setPanelTab] = useState('informacion')
  const [historiaClinica, setHistoriaClinica] = useState('')
  const [notas, setNotas] = useState([])
  const [notasError, setNotasError] = useState(false)
  const [notaTexto, setNotaTexto] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

  useEffect(() => {
    let activo = true

    Promise.all([
      apiClient.get(`/consultas/${consultaId}/`),
      apiClient.get(`/consultas/${consultaId}/ajustes_vertebrales/`).catch(() => ({ data: [] })),
      apiClient.get(`/planes/?paciente=${pacienteId}`).catch(() => ({ data: [] })),
      apiClient.get(`/pacientes/${pacienteId}/seguimiento_quiropractico/`).catch(() => ({ data: null })),
      apiClient.get('/consultas/').catch(() => ({ data: [] })),
      apiClient.get(`/pacientes/${pacienteId}/`).catch(() => ({ data: null })),
      apiClient.get(`/notas-paciente/?paciente=${pacienteId}`).catch(() => ({ data: null })),
    ])
      .then(([consultaRes, ajustesRes, planesRes, seguimientoRes, consultasRes, pacienteRes, notasRes]) => {
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
        setHistorial(completadas.slice(0, 1))

        if (pacienteRes.data) setHistoriaClinica(pacienteRes.data.historia_clinica || '')

        if (notasRes.data) {
          setNotas(notasRes.data)
        } else {
          setNotasError(true)
        }
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

  const guardarHistoriaClinica = () => {
    apiClient.patch(`/pacientes/${pacienteId}/`, { historia_clinica: historiaClinica }).catch(() => {
      setError('No se pudo guardar la información. Probá de nuevo.')
    })
  }

  const agregarNota = async () => {
    const texto = notaTexto.trim()
    if (!texto) return
    setGuardandoNota(true)
    try {
      const res = await apiClient.post('/notas-paciente/', { paciente: pacienteId, texto })
      setNotas((prev) => [res.data, ...prev])
      setNotaTexto('')
    } catch {
      setError('No se pudo guardar la nota.')
    } finally {
      setGuardandoNota(false)
    }
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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-start p-4 border-b border-slate-200">
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

        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden p-4 space-y-4 lg:space-y-0">
          {loading && <p className="text-slate-500 text-sm">Cargando...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {!loading && consulta && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] lg:grid-rows-[minmax(0,1fr)] gap-4 lg:flex-1 lg:min-h-0">
              {esQuiro && (
                <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Ajustes vertebrales</p>
                  <p className="text-xs text-slate-500 mb-3">Click en una vértebra para marcarla. Se guarda solo.</p>
                  <EditorColumnaVertebral
                    ajustes={ajustes}
                    onChangeAjustes={setAjustes}
                    onGuardarSegmento={guardarAjustesConsulta}
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                {planActivo && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="text-blue-800 font-medium">
                      Quedan {planActivo.sesiones_restantes} de {planActivo.sesiones_totales} sesiones
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Etapa de cuidado</label>
                    <select
                      value={etapaCuidado}
                      onChange={(e) => handleChangeEtapa(e.target.value)}
                      className="w-32 border border-slate-300 rounded px-2 py-1.5 text-sm"
                    >
                      <option value="">Sin definir</option>
                      {ETAPA_CUIDADO_OPCIONES.map(([valor, label]) => (
                        <option key={valor} value={valor}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Frecuencia</label>
                    <input
                      type="text"
                      placeholder="Ej: cada 15 días"
                      value={frecuenciaSeguimiento}
                      onChange={(e) => setFrecuenciaSeguimiento(e.target.value)}
                      onBlur={handleBlurFrecuencia}
                      className="w-44 border border-slate-300 rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  {historial.length > 0 && (
                    <div>
                      <p className="block text-xs text-slate-600 mb-1">Última consulta</p>
                      <p className="text-sm text-slate-700 px-1 py-1.5">{historial[0].fecha}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex gap-1 mb-3">
                    {PANEL_TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setPanelTab(t.key)}
                        className={`text-xs px-3 py-1.5 rounded-t ${
                          panelTab === t.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {panelTab === 'informacion' && (
                    <textarea
                      value={historiaClinica}
                      onChange={(e) => setHistoriaClinica(e.target.value)}
                      onBlur={guardarHistoriaClinica}
                      rows={4}
                      placeholder="Historia clínica del paciente..."
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  )}

                  {panelTab === 'notas' && (
                    <div>
                      {notasError ? (
                        <p className="text-slate-400 text-sm">No se pudieron cargar las notas.</p>
                      ) : (
                        <>
                          <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                            {notas.length === 0 ? (
                              <p className="text-slate-400 text-sm italic">Sin notas cargadas todavía.</p>
                            ) : (
                              notas.map((n) => (
                                <div key={n.id} className="bg-slate-50 rounded p-2 text-sm">
                                  <p className="text-slate-800 whitespace-pre-wrap">{n.texto}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {n.autor_nombre || 'Desconocido'} — {new Date(n.fecha_hora).toLocaleString()}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={notaTexto}
                              onChange={(e) => setNotaTexto(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); agregarNota() }
                              }}
                              placeholder="Escribir una nota..."
                              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                            />
                            <Boton variante="primary" onClick={agregarNota} disabled={guardandoNota || !notaTexto.trim()}>
                              Enviar
                            </Boton>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {panelTab === 'archivos' && <GestionArchivosPaciente pacienteId={pacienteId} />}
                </div>

                {consulta.estado !== 'completada' && (
                  <Boton variante="primary" onClick={marcarCompletada} disabled={marcandoCompletada} className="w-full">
                    {marcandoCompletada ? 'Guardando...' : 'Marcar visita como completada'}
                  </Boton>
                )}

                <div className="flex justify-between pt-2 text-sm mt-auto">
                  <button onClick={() => setVerFichaCompleta(true)} className="text-blue-600 hover:underline">
                    Ver ficha completa del paciente
                  </button>
                  <button onClick={irAConsultaCompleta} className="text-blue-600 hover:underline">
                    Editar consulta completa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {verFichaCompleta && (
        <FichaPacienteModal pacienteId={pacienteId} onClose={() => setVerFichaCompleta(false)} ocultarEditar />
      )}
    </div>
  )
}
