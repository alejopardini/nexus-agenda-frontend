import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import ColumnaVertebral from './ColumnaVertebral'
import Modal from './Modal'
import Boton from './Boton'
import { useEsVerticalQuiro } from '../hooks/useVertical'

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
  const esQuiro = useEsVerticalQuiro()
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
    <Modal
      ancho="max-w-xl"
      onClose={onClose}
      titulo={
        <>
          {consulta ? consulta.paciente_nombre : 'Consulta'}
          {consulta && (
            <span className="block text-[14px] font-normal text-texto-secundario mt-1">{consulta.fecha}</span>
          )}
        </>
      }
      acciones={
        !loading && !error && consulta ? (
          <Boton variante="primary" onClick={irAConsultaCompleta} className="w-full">
            Editar consulta completa
          </Boton>
        ) : null
      }
    >
      {loading && <p className="text-slate-500 text-sm">Cargando...</p>}
      {!loading && error && <p className="text-input-error text-sm">{error}</p>}

      {!loading && !error && consulta && (
        <div className="space-y-4">
          {esQuiro && (
            <ColumnaVertebral ajustes={ajustesMapa} segmentoActivo={null} onClickSegmento={() => {}} />
          )}

          <div>
            <p className="text-xs text-texto-secundario mb-1">Observaciones</p>
            <p className="text-sm text-texto whitespace-pre-wrap">
              {consulta.observaciones || 'Sin observaciones cargadas.'}
            </p>
          </div>

          {resumen.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-texto-secundario mb-1">Resumen</p>
              <dl className="space-y-1 text-sm">
                {resumen.map(([label, valor]) => (
                  <div key={label} className="flex gap-1">
                    <dt className="text-texto-secundario shrink-0">{label}:</dt>
                    <dd className="text-texto">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
