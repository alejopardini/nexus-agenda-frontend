import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import useClickOutside from '../hooks/useClickOutside'
import BotonVolver from '../components/BotonVolver'
import ColumnaVertebral from '../components/ColumnaVertebral'

const LISTADOS_POR_SEGMENTO = {
  C1: ['ASR', 'AIR', 'ASRA', 'ASRP', 'AIRA', 'AIRP'],
  C2: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  // TODO: C3-C7 sin confirmar, usamos temporalmente la lista de C2
  C3: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  C4: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  C5: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  C6: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  C7: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  T1: ['PR', 'PRS', 'PRI', 'PI'], T2: ['PR', 'PRS', 'PRI', 'PI'],
  T3: ['PR', 'PRS', 'PRI', 'PI'], T4: ['PR', 'PRS', 'PRI', 'PI'],
  T5: ['PR', 'PRS', 'PRI', 'PI'], T6: ['PR', 'PRS', 'PRI', 'PI'],
  T7: ['PR', 'PRS', 'PRI', 'PI'], T8: ['PR', 'PRS', 'PRI', 'PI'],
  T9: ['PR', 'PRS', 'PRI', 'PI'], T10: ['PR', 'PRS', 'PRI', 'PI'],
  T11: ['PR', 'PRS', 'PRI', 'PI'], T12: ['PR', 'PRS', 'PRI', 'PI'],
  L1: ['PR', 'PRS', 'PRI', 'PI'], L2: ['PR', 'PRS', 'PRI', 'PI'],
  L3: ['PR', 'PRS', 'PRI', 'PI'], L4: ['PR', 'PRS', 'PRI', 'PI'],
  L5: ['PR', 'PRS', 'PRI', 'PI'],
  SACRO: ['PI-R', 'P-R', 'AP', 'BP'],
  ILION_IZQ: ['PI', 'AS', 'IN', 'EX', 'PI-EX', 'PI-IN', 'AS-EX', 'AS-IN'],
  ILION_DER: ['PI', 'AS', 'IN', 'EX', 'PI-EX', 'PI-IN', 'AS-EX', 'AS-IN'],
}

const TECNICAS = ['SUP', 'GC', 'GNC', 'SP', 'TR', 'FS', 'PIE', 'PRO', 'THO', 'ACT']

const SEGMENTOS_SIN_DIRECCION = ['ILION_IZQ', 'ILION_DER']

export default function ConsultaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [ajustes, setAjustes] = useState({})
  const [segmentoActivo, setSegmentoActivo] = useState(null)
  const [turnoInfo, setTurnoInfo] = useState(null)

  const panelRef = useClickOutside(() => setSegmentoActivo(null))

  const esQuiropractico = consulta?.profesional_especialidad === 'kinesiologo_quiropra'

  useEffect(() => {
    apiClient
      .get(`/consultas/${id}/`)
      .then((res) => {
        setConsulta(res.data)
        setMotivo(res.data.motivo || '')
        setObservaciones(res.data.observaciones || '')
        if (res.data.turno) {
          apiClient.get(`/turnos/${res.data.turno}/`).then((r) => setTurnoInfo(r.data)).catch(() => {})
        }
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
              tecnica: a.tecnica || [],
              notas: a.notas || '',
              direccion: a.direccion || null,
              bloqueada: a.bloqueada || false,
            }
          })
          setAjustes(mapa)
        }
      })
      .catch(() => setError('No se pudo cargar la consulta.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleClickSegmento = (segmento) => {
    setSegmentoActivo(segmento)
    setAjustes((prev) => ({
      ...prev,
      [segmento]: prev[segmento] || {
        ajustado: false,
        tipo_ajuste: [],
        tecnica: [],
        notas: '',
        direccion: null,
        bloqueada: false,
      },
    }))
  }

  const actualizarSegmento = (campo, valor) => {
    if (!segmentoActivo) return
    setAjustes((prev) => ({
      ...prev,
      [segmentoActivo]: { ...prev[segmentoActivo], [campo]: valor },
    }))
  }

  const toggleEnLista = (campo, valor) => {
    if (!segmentoActivo) return
    const actual = ajustes[segmentoActivo]?.[campo] || []
    const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]
    actualizarSegmento(campo, nuevo)
  }

  const toggleAjustado = () => {
    if (!segmentoActivo) return
    setAjustes((prev) => {
      const actual = prev[segmentoActivo] || {}
      const nuevoAjustado = !actual.ajustado
      return {
        ...prev,
        [segmentoActivo]: {
          ...actual,
          ajustado: nuevoAjustado,
          bloqueada: nuevoAjustado ? false : actual.bloqueada,
          direccion: nuevoAjustado ? actual.direccion : null,
        },
      }
    })
  }

  const toggleBloqueada = () => {
    if (!segmentoActivo) return
    setAjustes((prev) => {
      const actual = prev[segmentoActivo] || {}
      const nuevaBloqueada = !actual.bloqueada
      return {
        ...prev,
        [segmentoActivo]: {
          ...actual,
          bloqueada: nuevaBloqueada,
          ajustado: nuevaBloqueada ? false : actual.ajustado,
          direccion: nuevaBloqueada ? null : actual.direccion,
        },
      }
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
      })

      if (esQuiropractico) {
        const listaAjustes = Object.entries(ajustes)
          .filter(([, v]) => v.ajustado || v.bloqueada || v.notas || v.tipo_ajuste.length || v.tecnica.length)
          .map(([segmento, v]) => ({
            segmento,
            ajustado: v.ajustado,
            tipo_ajuste: v.tipo_ajuste,
            tecnica: v.tecnica,
            notas: v.notas,
            direccion: v.direccion,
            bloqueada: v.bloqueada,
          }))
        await apiClient.post(`/consultas/${id}/ajustes_vertebrales/`, { ajustes: listaAjustes })
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

  const datosSegmentoActivo = segmentoActivo ? ajustes[segmentoActivo] : null

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
      <BotonVolver to={`/pacientes/${consulta.paciente}`} texto="Volver a la ficha del paciente" />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
        <h1 className="text-xl font-bold text-slate-800 mb-1">
          Consulta — {consulta.estado === 'completada' ? 'completada' : 'pendiente'}
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          {consulta.paciente_nombre} — {consulta.fecha}
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm text-slate-600 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
              rows={4}
            />
          </div>

          {esQuiropractico && (
            <div className="pt-4 border-t border-slate-100" ref={panelRef}>
              <h2 className="text-sm font-semibold text-slate-700 mb-1">Ajustes vertebrales</h2>
              <p className="text-xs text-slate-500 mb-3">
                Click en una vértebra para marcarla.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColumnaVertebral
                  ajustes={ajustes}
                  segmentoActivo={segmentoActivo}
                  onClickSegmento={handleClickSegmento}
                />

                <div>
                  {datosSegmentoActivo ? (
                    <div className="bg-slate-50 rounded p-3 text-sm">
                      <p className="font-medium text-slate-700 mb-2">
                        {segmentoActivo} {datosSegmentoActivo.ajustado ? '— ajustado' : '— no ajustado'}
                      </p>

                      <div className="flex items-center gap-3 mb-3">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={!!datosSegmentoActivo.ajustado}
                            onChange={toggleAjustado}
                          />
                          Ajustado
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={!!datosSegmentoActivo.bloqueada}
                            onChange={toggleBloqueada}
                          />
                          Bloqueada
                        </label>
                      </div>

                      <p className="text-xs text-slate-500 mb-1">Listados</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(LISTADOS_POR_SEGMENTO[segmentoActivo] || []).map((t) => (
                          <label
                            key={t}
                            className={`flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 ${
                              !datosSegmentoActivo.ajustado ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={datosSegmentoActivo.tipo_ajuste.includes(t)}
                              onChange={() => toggleEnLista('tipo_ajuste', t)}
                              disabled={!datosSegmentoActivo.ajustado}
                              className="disabled:cursor-not-allowed"
                            />
                            {t}
                          </label>
                        ))}
                      </div>

                      <p className="text-xs text-slate-500 mb-1">Técnicas</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {TECNICAS.map((t) => (
                          <label
                            key={t}
                            className={`flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1 ${
                              !datosSegmentoActivo.ajustado ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={datosSegmentoActivo.tecnica.includes(t)}
                              onChange={() => toggleEnLista('tecnica', t)}
                              disabled={!datosSegmentoActivo.ajustado}
                              className="disabled:cursor-not-allowed"
                            />
                            {t}
                          </label>
                        ))}
                      </div>

                      {!SEGMENTOS_SIN_DIRECCION.includes(segmentoActivo) && (
                        <>
                          <p className="text-xs text-slate-500 mb-1">Dirección</p>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {[
                              { valor: 'izquierda', label: 'Izquierda' },
                              { valor: 'derecha', label: 'Derecha' },
                              { valor: null, label: 'Ninguna' },
                            ].map((op) => (
                              <label
                                key={op.label}
                                className={`flex items-center gap-1 text-xs text-slate-600 ${
                                  !datosSegmentoActivo.ajustado ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="direccion"
                                  checked={(datosSegmentoActivo.direccion || null) === op.valor}
                                  onChange={() => actualizarSegmento('direccion', op.valor)}
                                  disabled={!datosSegmentoActivo.ajustado}
                                  className="disabled:cursor-not-allowed"
                                />
                                {op.label}
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      <p className="text-xs text-slate-500 mb-1">Nota</p>
                      <input
                        type="text"
                        value={datosSegmentoActivo.notas}
                        onChange={(e) => actualizarSegmento('notas', e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Seleccioná una vértebra para ver/editar los detalles del ajuste.
                    </p>
                  )}
                </div>
              </div>
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