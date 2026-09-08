import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import EditorColumnaVertebral from '../components/EditorColumnaVertebral'

const CARACTERISTICAS_DOLOR_OPCIONES = [
  'Doloroso', 'Ardor', 'Sordo', 'Agudo', 'Punzante', 'Pulsátil', 'Debilidad', 'Entumecimiento', 'Tensión',
]

const FRECUENCIA_DOLOR_OPCIONES = [
  ['constante', 'Constante'],
  ['intermitente', 'Intermitente'],
  ['ocasional', 'Ocasional'],
  ['frecuente', 'Frecuente'],
]

const AGRAVADO_POR_OPCIONES = [
  'Actividad pesada', 'Actividad moderada', 'Actividad liviana', 'Torsión', 'Levantar peso',
  'Flexión', 'Estar de pie prolongado', 'Sentado prolongado', 'Estrés', 'Cambios de temperatura',
]

const PROGRESION_OPCIONES = [
  ['peor', 'Peor'],
  ['igual', 'Igual'],
  ['mejor', 'Mejor'],
  ['fluctuante', 'Fluctuante'],
]

const ALIVIADO_POR_OPCIONES = [
  'Hielo', 'Calor', 'Actividad', 'Reposo en cama', 'Medicación de venta libre',
  'Medicación recetada', 'Cambios posturales', 'Descanso', 'Estiramiento', 'Soporte/faja',
]

const ESTADO_CONDICION_OPCIONES = [
  ['mejoria_marcada', 'Mejoría marcada'],
  ['mejoria_leve', 'Mejoría leve'],
  ['sin_cambios', 'Sin cambios'],
  ['empeoramiento_leve', 'Empeoramiento leve'],
  ['empeoramiento_marcado', 'Empeoramiento marcado'],
]

const PROGRESANDO_OPCIONES = [
  ['bien', 'Progresando bien'],
  ['lento', 'Progresando lento'],
  ['estancado', 'Estancado'],
]

const TRATAMIENTO_EFICAZ_OPCIONES = [
  ['si', 'Sí'],
  ['parcial', 'Parcial'],
  ['no', 'No'],
]

const PRONOSTICO_OPCIONES = [
  ['excelente', 'Excelente'],
  ['bueno', 'Bueno'],
  ['reservado', 'Reservado'],
  ['malo', 'Malo'],
]

const ETAPA_CUIDADO_OPCIONES = [
  ['aguda', 'Aguda'],
  ['moderada', 'Moderada'],
  ['mantenimiento', 'Mantenimiento'],
]

export default function ConsultaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [caracteristicasDolor, setCaracteristicasDolor] = useState([])
  const [detalleDolor, setDetalleDolor] = useState('')
  const [frecuenciaDolor, setFrecuenciaDolor] = useState('')
  const [dolorPromedio, setDolorPromedio] = useState(0)
  const [agravadoPor, setAgravadoPor] = useState([])
  const [progresionDesdeUltimaVisita, setProgresionDesdeUltimaVisita] = useState('')
  const [progresionDespuesActividad, setProgresionDespuesActividad] = useState('')
  const [progresionDespuesDormir, setProgresionDespuesDormir] = useState('')
  const [aliviadoPor, setAliviadoPor] = useState([])
  const [estadoCondicion, setEstadoCondicion] = useState('')
  const [progresando, setProgresando] = useState('')
  const [tratamientoEficaz, setTratamientoEficaz] = useState('')
  const [pronostico, setPronostico] = useState('')
  const [etapaCuidado, setEtapaCuidado] = useState('')
  const [frecuenciaSeguimiento, setFrecuenciaSeguimiento] = useState('')
  const [camposPersonalizados, setCamposPersonalizados] = useState([])
  const [valoresPersonalizados, setValoresPersonalizados] = useState({})
  const [ajustes, setAjustes] = useState({})
  const [turnoInfo, setTurnoInfo] = useState(null)

  const esQuiropractico = consulta?.profesional_especialidad === 'kinesiologo_quiropra'

  useEffect(() => {
    apiClient
      .get(`/consultas/${id}/`)
      .then((res) => {
        setConsulta(res.data)
        setMotivo(res.data.motivo || '')
        setObservaciones(res.data.observaciones || '')
        setCaracteristicasDolor(res.data.caracteristicas_dolor || [])
        setDetalleDolor(res.data.detalle_dolor || '')
        setFrecuenciaDolor(res.data.frecuencia_dolor || '')
        setDolorPromedio(res.data.dolor_promedio ?? 0)
        setAgravadoPor(res.data.agravado_por || [])
        setProgresionDesdeUltimaVisita(res.data.progresion_desde_ultima_visita || '')
        setProgresionDespuesActividad(res.data.progresion_despues_actividad || '')
        setProgresionDespuesDormir(res.data.progresion_despues_dormir || '')
        setAliviadoPor(res.data.aliviado_por || [])
        setEstadoCondicion(res.data.estado_condicion || '')
        setProgresando(res.data.progresando || '')
        setTratamientoEficaz(res.data.tratamiento_eficaz || '')
        setPronostico(res.data.pronostico || '')
        setValoresPersonalizados(res.data.valores_personalizados || {})
        setCamposPersonalizados(res.data.campos_personalizados_disponibles || [])
        if (res.data.turno) {
          apiClient.get(`/turnos/${res.data.turno}/`).then((r) => setTurnoInfo(r.data)).catch(() => {})
        }
        apiClient
          .get(`/pacientes/${res.data.paciente}/seguimiento_quiropractico/`)
          .then((r) => {
            if (r.data) {
              setEtapaCuidado(r.data.etapa_cuidado || '')
              setFrecuenciaSeguimiento(r.data.frecuencia || '')
            }
          })
          .catch(() => {})
        if (res.data.profesional_especialidad === 'kinesiologo_quiropra') {
          return apiClient.get(`/consultas/${id}/ajustes_vertebrales/`)
        }
        return null
      })
      .then((res) => {
        if (res) {
          const mapa = {}
          res.data.forEach((a) => {
            mapa[a.segmento] = {
              ajustado: a.ajustado,
              tipo_ajuste: a.tipo_ajuste || [],
              tecnica: a.tecnica || '',
              notas: a.notas || '',
              bloqueada: a.bloqueada || false,
            }
          })
          setAjustes(mapa)
        }
      })
      .catch(() => setError('No se pudo cargar la consulta.'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleValorEnArray = (setter, actual, valor) => {
    setter(actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor])
  }

  const setValorCampoPersonalizado = (campoId, valor) => {
    setValoresPersonalizados((prev) => ({ ...prev, [campoId]: valor }))
  }

  const toggleValorCampoPersonalizado = (campoId, opcion) => {
    setValoresPersonalizados((prev) => {
      const actual = prev[campoId] || []
      const nuevo = actual.includes(opcion) ? actual.filter((v) => v !== opcion) : [...actual, opcion]
      return { ...prev, [campoId]: nuevo }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/consultas/${id}/`, {
        motivo,
        observaciones,
        estado: 'completada',
        caracteristicas_dolor: caracteristicasDolor,
        detalle_dolor: detalleDolor,
        frecuencia_dolor: frecuenciaDolor,
        dolor_promedio: dolorPromedio,
        agravado_por: agravadoPor,
        progresion_desde_ultima_visita: progresionDesdeUltimaVisita,
        progresion_despues_actividad: progresionDespuesActividad,
        progresion_despues_dormir: progresionDespuesDormir,
        aliviado_por: aliviadoPor,
        estado_condicion: estadoCondicion,
        progresando,
        tratamiento_eficaz: tratamientoEficaz,
        pronostico,
        valores_personalizados: valoresPersonalizados,
      })

      if (esQuiropractico) {
        const listaAjustes = Object.entries(ajustes)
          .filter(([, v]) => v.ajustado || v.bloqueada || v.notas || v.tipo_ajuste.length || v.tecnica)
          .map(([segmento, v]) => ({
            segmento,
            ajustado: v.ajustado,
            tipo_ajuste: v.tipo_ajuste,
            tecnica: v.tecnica,
            notas: v.notas,
            bloqueada: v.bloqueada,
          }))
        await apiClient.post(`/consultas/${id}/ajustes_vertebrales/`, { ajustes: listaAjustes })
      }

      try {
        await apiClient.post(`/pacientes/${consulta.paciente}/seguimiento_quiropractico/`, {
          etapa_cuidado: etapaCuidado,
          frecuencia: frecuenciaSeguimiento,
        })
      } catch {
        alert(
          'La consulta se guardó, pero no se pudo guardar el seguimiento quiropráctico (etapa/frecuencia). Probá guardarlo de nuevo desde la ficha del paciente.'
        )
      }

      navigate(`/pacientes/${consulta.paciente}`)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo guardar la consulta.'
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

  if (error || !consulta) {
    return (
      <Layout>
        <p className="text-red-600">{error || 'Consulta no encontrada.'}</p>
      </Layout>
    )
  }

  const MARGEN_MINUTOS_COMPLETAR = 15
  let habilitadoDesde = null
  if (turnoInfo) {
    const momentoTurno = new Date(`${turnoInfo.fecha}T${turnoInfo.hora}`)
    habilitadoDesde = new Date(momentoTurno.getTime() - MARGEN_MINUTOS_COMPLETAR * 60000)
  }
  const debeEsperar = consulta.estado !== 'completada' && habilitadoDesde && new Date() < habilitadoDesde
  const horaHabilitada = habilitadoDesde
    ? `${String(habilitadoDesde.getHours()).padStart(2, '0')}:${String(habilitadoDesde.getMinutes()).padStart(2, '0')}`
    : ''

  return (
    <Layout>
      <BotonVolver to={`/pacientes/${consulta.paciente}`} />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-5xl">
        <h1 className="text-xl font-bold text-slate-800 mb-1">
          Consulta — {consulta.estado === 'completada' ? 'completada' : 'pendiente'}
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          {consulta.paciente_nombre} — {consulta.fecha}
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Subjetivo</h2>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Características del dolor</label>
            <div className="flex flex-wrap gap-3 mb-2">
              {CARACTERISTICAS_DOLOR_OPCIONES.map((op) => (
                <label key={op} className="flex items-center gap-1 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={caracteristicasDolor.includes(op)}
                    onChange={() => toggleValorEnArray(setCaracteristicasDolor, caracteristicasDolor, op)}
                  />
                  {op}
                </label>
              ))}
            </div>
            <textarea
              value={detalleDolor}
              onChange={(e) => setDetalleDolor(e.target.value)}
              placeholder="Detalle del dolor (opcional)"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Frecuencia del dolor</label>
            <select
              value={frecuenciaDolor}
              onChange={(e) => setFrecuenciaDolor(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            >
              <option value="">Sin definir</option>
              {FRECUENCIA_DOLOR_OPCIONES.map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Dolor promedio: <span className="font-medium text-slate-800">{dolorPromedio}</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={dolorPromedio}
              onChange={(e) => setDolorPromedio(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Agravado por</label>
            <div className="flex flex-wrap gap-3">
              {AGRAVADO_POR_OPCIONES.map((op) => (
                <label key={op} className="flex items-center gap-1 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={agravadoPor.includes(op)}
                    onChange={() => toggleValorEnArray(setAgravadoPor, agravadoPor, op)}
                  />
                  {op}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Progresión</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Desde la última visita</label>
                <select
                  value={progresionDesdeUltimaVisita}
                  onChange={(e) => setProgresionDesdeUltimaVisita(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Sin definir</option>
                  {PROGRESION_OPCIONES.map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Después de actividad</label>
                <select
                  value={progresionDespuesActividad}
                  onChange={(e) => setProgresionDespuesActividad(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Sin definir</option>
                  {PROGRESION_OPCIONES.map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Después de dormir</label>
                <select
                  value={progresionDespuesDormir}
                  onChange={(e) => setProgresionDespuesDormir(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Sin definir</option>
                  {PROGRESION_OPCIONES.map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Aliviado por</label>
            <div className="flex flex-wrap gap-3">
              {ALIVIADO_POR_OPCIONES.map((op) => (
                <label key={op} className="flex items-center gap-1 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={aliviadoPor.includes(op)}
                    onChange={() => toggleValorEnArray(setAliviadoPor, aliviadoPor, op)}
                  />
                  {op}
                </label>
              ))}
            </div>
          </div>

          {esQuiropractico && (
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Objetivo</h2>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Ajustes vertebrales</h3>
              <p className="text-xs text-slate-500 mb-3">
                Click en una vértebra para marcarla.
              </p>

              <EditorColumnaVertebral ajustes={ajustes} onChangeAjustes={setAjustes} />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Evaluación</h2>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Estado de la condición</label>
              <select
                value={estadoCondicion}
                onChange={(e) => setEstadoCondicion(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">Sin definir</option>
                {ESTADO_CONDICION_OPCIONES.map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Progresando</label>
              <select
                value={progresando}
                onChange={(e) => setProgresando(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">Sin definir</option>
                {PROGRESANDO_OPCIONES.map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Tratamiento eficaz</label>
              <select
                value={tratamientoEficaz}
                onChange={(e) => setTratamientoEficaz(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">Sin definir</option>
                {TRATAMIENTO_EFICAZ_OPCIONES.map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Pronóstico</label>
              <select
                value={pronostico}
                onChange={(e) => setPronostico(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="">Sin definir</option>
                {PRONOSTICO_OPCIONES.map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Plan</h2>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Etapa de cuidado</label>
                <select
                  value={etapaCuidado}
                  onChange={(e) => setEtapaCuidado(e.target.value)}
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
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                rows={4}
              />
            </div>
          </div>

          {camposPersonalizados.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Campos adicionales</h2>

              {camposPersonalizados.map((campo) => (
                <div key={campo.id}>
                  <label className="block text-sm text-slate-600 mb-1">{campo.etiqueta}</label>
                  {campo.tipo === 'texto' && (
                    <input
                      type="text"
                      value={valoresPersonalizados[campo.id] || ''}
                      onChange={(e) => setValorCampoPersonalizado(campo.id, e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    />
                  )}
                  {campo.tipo === 'select' && (
                    <select
                      value={valoresPersonalizados[campo.id] || ''}
                      onChange={(e) => setValorCampoPersonalizado(campo.id, e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    >
                      <option value="">Sin definir</option>
                      {(campo.opciones || []).map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  )}
                  {campo.tipo === 'checkbox' && (
                    <div className="flex flex-wrap gap-3">
                      {(campo.opciones || []).map((op) => (
                        <label key={op} className="flex items-center gap-1 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={(valoresPersonalizados[campo.id] || []).includes(op)}
                            onChange={() => toggleValorCampoPersonalizado(campo.id, op)}
                          />
                          {op}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando || debeEsperar}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : consulta.estado === 'completada' ? 'Guardar cambios' : 'Marcar como completada'}
          </button>
          {debeEsperar && (
            <p className="text-xs text-slate-500 text-center">Podés completarla desde las {horaHabilitada}</p>
          )}
        </form>
      </div>
    </Layout>
  )
}