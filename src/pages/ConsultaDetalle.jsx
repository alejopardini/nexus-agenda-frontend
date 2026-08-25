import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import useClickOutside from '../hooks/useClickOutside'

import cervicalImg from '../assets/columna/columna_cervical.png'
import toracicaImg from '../assets/columna/columna_toracica.png'
import lumbarImg from '../assets/columna/columna_lumbar.png'
import sacroImg from '../assets/columna/columna_sacro_coccix.png'

const REGIONES = [
  {
    nombre: 'Cervical',
    imagen: cervicalImg,
    color: '#86efac',
    tamañoPunto: 4.2,
    mostrarTexto: false,
    segmentos: [
      { seg: 'C1', top: 35, left: 47 },
      { seg: 'C2', top: 46, left: 47 },
      { seg: 'C3', top: 57, left: 47 },
      { seg: 'C4', top: 67, left: 47 },
      { seg: 'C5', top: 76, left: 47 },
      { seg: 'C6', top: 85, left: 47 },
      { seg: 'C7', top: 95, left: 47 },
    ],
  },,
  {
    nombre: 'Torácica',
    imagen: toracicaImg,
    color: '#93c5fd',
    segmentos: [
      { seg: 'T1', top: 6, left: 46 }, { seg: 'T2', top: 13, left: 46 },
      { seg: 'T3', top: 20, left: 46 }, { seg: 'T4', top: 27, left: 46 },
      { seg: 'T5', top: 35, left: 46 }, { seg: 'T6', top: 43, left: 46 },
      { seg: 'T7', top: 51, left: 46 }, { seg: 'T8', top: 59, left: 46 },
      { seg: 'T9', top: 67, left: 46 }, { seg: 'T10', top: 75, left: 46 },
      { seg: 'T11', top: 83, left: 46 }, { seg: 'T12', top: 92, left: 46 },
    ],
  },
  {
    nombre: 'Lumbar',
    imagen: lumbarImg,
    color: '#fde047',
    segmentos: [
      { seg: 'L1', top: 14, left: 47 }, { seg: 'L2', top: 30, left: 47 },
      { seg: 'L3', top: 47, left: 47 }, { seg: 'L4', top: 64, left: 47 },
      { seg: 'L5', top: 80, left: 47 },
    ],
  },
  {
    nombre: 'Sacro / Cóccix',
    imagen: sacroImg,
    color: '#f9a8d4',
    segmentos: [
      { seg: 'SACRO', top: 35, left: 47 },
      { seg: 'COCCIX', top: 85, left: 47 },
    ],
  },
]

const TIPOS_AJUSTE = ['PRI', 'PRS', 'Derecha', 'Izquierda']
const TECNICAS = ['Pierce', 'Thompson', 'Con activador', 'Sin activador', 'Side posture', 'Supino', 'Prono', 'Acostado']

function RegionColumna({ region, ajustes, segmentoActivo, expandida, onToggleExpandir, onClickSegmento }) {
  const cantidadAjustados = region.segmentos.filter((s) => ajustes[s.seg]?.ajustado).length

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => onToggleExpandir(region.nombre)}
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium text-slate-700"
        style={{ backgroundColor: region.color + '55' }}
      >
        <span>{region.nombre}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs bg-white/70 rounded-full px-2 py-0.5">
            {cantidadAjustados}/{region.segmentos.length}
          </span>
          <span>{expandida ? '▾' : '▸'}</span>
        </span>
      </button>

      {expandida && (
        <div className="relative">
          <img src={region.imagen} alt={`Columna - ${region.nombre}`} className="w-full block" />
          {region.segmentos.map((s) => {
            const activo = ajustes[s.seg]?.ajustado
            const seleccionado = segmentoActivo === s.seg
            return (
              <button
                key={s.seg}
                type="button"
                onClick={() => onClickSegmento(s.seg)}
                title={s.seg}
                className="absolute rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 26,
                  height: 26,
                  backgroundColor: activo ? region.color : 'rgba(255,255,255,0.55)',
                  border: seleccionado ? '2px solid #1d4ed8' : '1px solid rgba(100,116,139,0.6)',
                  color: '#1e293b',
                }}
              >
                {s.seg.length <= 3 ? s.seg : ''}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
  const [regionesExpandidas, setRegionesExpandidas] = useState(
    new Set(REGIONES.map((r) => r.nombre)) // todas expandidas por defecto
  )

  const panelRef = useClickOutside(() => setSegmentoActivo(null))

  const esQuiropractico = consulta?.profesional_especialidad === 'kinesiologo_quiropra'

  useEffect(() => {
    apiClient
      .get(`/consultas/${id}/`)
      .then((res) => {
        setConsulta(res.data)
        setMotivo(res.data.motivo || '')
        setObservaciones(res.data.observaciones || '')
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
      [segmento]: {
        ajustado: !prev[segmento]?.ajustado,
        tipo_ajuste: prev[segmento]?.tipo_ajuste || [],
        tecnica: prev[segmento]?.tecnica || [],
        notas: prev[segmento]?.notas || '',
      },
    }))
  }

  const toggleExpandirRegion = (nombreRegion) => {
    setRegionesExpandidas((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(nombreRegion)) nuevo.delete(nombreRegion)
      else nuevo.add(nombreRegion)
      return nuevo
    })
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
          .filter(([, v]) => v.ajustado || v.notas || v.tipo_ajuste.length || v.tecnica.length)
          .map(([segmento, v]) => ({
            segmento,
            ajustado: v.ajustado,
            tipo_ajuste: v.tipo_ajuste,
            tecnica: v.tecnica,
            notas: v.notas,
          }))
        await apiClient.post(`/consultas/${id}/ajustes_vertebrales/`, { ajustes: listaAjustes })
      }

      navigate(`/pacientes/${consulta.paciente}`)
    } catch (err) {
      setError('No se pudo guardar la consulta.')
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

  return (
    <Layout>
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
                Click en una región para expandir/colapsar. Click en una vértebra para marcarla.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="max-w-xs mx-auto w-full">
                  {REGIONES.map((region) => (
                    <RegionColumna
                      key={region.nombre}
                      region={region}
                      ajustes={ajustes}
                      segmentoActivo={segmentoActivo}
                      expandida={regionesExpandidas.has(region.nombre)}
                      onToggleExpandir={toggleExpandirRegion}
                      onClickSegmento={handleClickSegmento}
                    />
                  ))}
                </div>

                <div>
                  {datosSegmentoActivo ? (
                    <div className="bg-slate-50 rounded p-3 text-sm">
                      <p className="font-medium text-slate-700 mb-2">
                        {segmentoActivo} {datosSegmentoActivo.ajustado ? '— ajustado' : '— no ajustado'}
                      </p>

                      <p className="text-xs text-slate-500 mb-1">Tipo de ajuste</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {TIPOS_AJUSTE.map((t) => (
                          <label key={t} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={datosSegmentoActivo.tipo_ajuste.includes(t)}
                              onChange={() => toggleEnLista('tipo_ajuste', t)}
                            />
                            {t}
                          </label>
                        ))}
                      </div>

                      <p className="text-xs text-slate-500 mb-1">Técnica</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {TECNICAS.map((t) => (
                          <label key={t} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={datosSegmentoActivo.tecnica.includes(t)}
                              onChange={() => toggleEnLista('tecnica', t)}
                            />
                            {t}
                          </label>
                        ))}
                      </div>

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
            disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : consulta.estado === 'completada' ? 'Guardar cambios' : 'Marcar como completada'}
          </button>
        </form>
      </div>
    </Layout>
  )
}