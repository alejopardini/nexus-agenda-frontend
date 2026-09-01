import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import ColumnaVertebral from './ColumnaVertebral'

const ESTADO_CONDICION_LABELS = {
  mejoria_marcada: 'Mejoría marcada',
  mejoria_leve: 'Mejoría leve',
  sin_cambios: 'Sin cambios',
  empeoramiento_leve: 'Empeoramiento leve',
  empeoramiento_marcado: 'Empeoramiento marcado',
}

const ETAPA_CUIDADO_LABELS = {
  aguda: 'Aguda',
  moderada: 'Moderada',
  mantenimiento: 'Mantenimiento',
}

export default function FichaCamillaModal({ consultaId, onClose }) {
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [ajustesMapa, setAjustesMapa] = useState({})
  const [etapaCuidado, setEtapaCuidado] = useState('')
  const [frecuenciaSeguimiento, setFrecuenciaSeguimiento] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      apiClient.get(`/consultas/${consultaId}/`),
      apiClient.get(`/consultas/${consultaId}/ajustes_vertebrales/`).catch(() => ({ data: [] })),
    ])
      .then(([consultaRes, ajustesRes]) => {
        setConsulta(consultaRes.data)
        const mapa = {}
        ajustesRes.data.forEach((a) => { mapa[a.segmento] = a })
        setAjustesMapa(mapa)
        return apiClient
          .get(`/pacientes/${consultaRes.data.paciente}/seguimiento_quiropractico/`)
          .catch(() => ({ data: null }))
      })
      .then((segRes) => {
        if (segRes?.data) {
          setEtapaCuidado(segRes.data.etapa_cuidado || '')
          setFrecuenciaSeguimiento(segRes.data.frecuencia || '')
        }
      })
      .catch((err) => {
        setError(
          err.response?.status === 403
            ? 'Este contenido es clínico y no está disponible para tu rol.'
            : 'No se pudo cargar la consulta.'
        )
      })
      .finally(() => setLoading(false))
  }, [consultaId])

  const planTexto = [
    etapaCuidado ? (ETAPA_CUIDADO_LABELS[etapaCuidado] || etapaCuidado) : null,
    frecuenciaSeguimiento || null,
  ].filter(Boolean).join(' — ')

  const resumen = consulta
    ? [
        ['Motivo', consulta.motivo],
        ['Características del dolor', (consulta.caracteristicas_dolor || []).join(', ')],
        ['Dolor promedio', consulta.dolor_promedio != null ? `${consulta.dolor_promedio}/10` : ''],
        ['Agravado por', (consulta.agravado_por || []).join(', ')],
        ['Aliviado por', (consulta.aliviado_por || []).join(', ')],
        [
          'Estado de la condición',
          consulta.estado_condicion ? (ESTADO_CONDICION_LABELS[consulta.estado_condicion] || consulta.estado_condicion) : '',
        ],
        ['Plan', planTexto],
      ].filter(([, valor]) => valor)
    : []

  const irAConsultaCompleta = () => {
    onClose()
    navigate(`/consultas/${consultaId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{consulta ? consulta.paciente_nombre : 'Consulta'}</h2>
            {consulta && <p className="text-sm text-slate-500">{consulta.fecha}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4">
          {loading && <p className="text-slate-500 text-sm">Cargando...</p>}
          {!loading && error && <p className="text-red-600 text-sm">{error}</p>}

          {!loading && !error && consulta && (
            <div className="space-y-4">
              <ColumnaVertebral ajustes={ajustesMapa} segmentoActivo={null} onClickSegmento={() => {}} />

              <div>
                <p className="text-xs text-slate-500 mb-1">Observaciones</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {consulta.observaciones || 'Sin observaciones cargadas.'}
                </p>
              </div>

              {resumen.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Resumen</p>
                  <dl className="space-y-1 text-sm">
                    {resumen.map(([label, valor]) => (
                      <div key={label} className="flex gap-1">
                        <dt className="text-slate-500 shrink-0">{label}:</dt>
                        <dd className="text-slate-800">{valor}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <button
                onClick={irAConsultaCompleta}
                className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 text-sm"
              >
                Editar consulta completa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
