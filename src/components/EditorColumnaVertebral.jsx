import { useEffect, useRef, useState } from 'react'
import ColumnaVertebral from './ColumnaVertebral'
import useClickOutside from '../hooks/useClickOutside'

const LISTADOS_POR_SEGMENTO = {
  C1_DER: ['ASR', 'AIR', 'ASRA', 'ASRP', 'AORA', 'AIRP'],
  C1_IZQ: ['ASL', 'AIL', 'ASLA', 'ASLP', 'AOLA', 'AILP'],
  C2_DER: ['SPBR', 'CPBR', 'BPSR', 'ESR', 'ESR-BR', 'ESR-SR', 'PRI', 'PRS', 'PI'],
  C2_IZQ: ['SPBL', 'CPBL', 'BPSL', 'ESL', 'ESL-BL', 'ESL-SL', 'PLI', 'PLS', 'PI'],
  C3_DER: ['PR', 'PRS', 'PRI', 'PI'], C3_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  C4_DER: ['PR', 'PRS', 'PRI', 'PI'], C4_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  C5_DER: ['PR', 'PRS', 'PRI', 'PI'], C5_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  C6_DER: ['PR', 'PRS', 'PRI', 'PI'], C6_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  C7_DER: ['PR', 'PRS', 'PRI', 'PI'], C7_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T1_DER: ['PR', 'PRS', 'PRI', 'PI'], T1_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T2_DER: ['PR', 'PRS', 'PRI', 'PI'], T2_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T3_DER: ['PR', 'PRS', 'PRI', 'PI'], T3_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T4_DER: ['PR', 'PRS', 'PRI', 'PI'], T4_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T5_DER: ['PR', 'PRS', 'PRI', 'PI'], T5_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T6_DER: ['PR', 'PRS', 'PRI', 'PI'], T6_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T7_DER: ['PR', 'PRS', 'PRI', 'PI'], T7_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T8_DER: ['PR', 'PRS', 'PRI', 'PI'], T8_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T9_DER: ['PR', 'PRS', 'PRI', 'PI'], T9_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T10_DER: ['PR', 'PRS', 'PRI', 'PI'], T10_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T11_DER: ['PR', 'PRS', 'PRI', 'PI'], T11_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  T12_DER: ['PR', 'PRS', 'PRI', 'PI'], T12_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  L1_DER: ['PR', 'PRS', 'PRI', 'PI'], L1_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  L2_DER: ['PR', 'PRS', 'PRI', 'PI'], L2_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  L3_DER: ['PR', 'PRS', 'PRI', 'PI'], L3_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  L4_DER: ['PR', 'PRS', 'PRI', 'PI'], L4_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  L5_DER: ['PR', 'PRS', 'PRI', 'PI'], L5_IZQ: ['PL', 'PLS', 'PLI', 'PI'],
  SACRO_DER: ['PI-R', 'PR', 'AP', 'BP'], SACRO_IZQ: ['PI-L', 'PL', 'AP', 'BP'],
  ILION_DER: ['PI', 'AS', 'IN', 'EX', 'PI-EX', 'PI-IN', 'AS-EX', 'AS-IN'],
  ILION_IZQ: ['PI', 'AS', 'IN', 'EX', 'PI-EX', 'PI-IN', 'AS-EX', 'AS-IN'],
}

const TECNICAS = ['SUP', 'GC', 'GNC', 'SP', 'TR', 'FS', 'PIE', 'PRO', 'THO', 'ACT']

function segmentoHermano(segmento) {
  // Ilión izquierdo y derecho son dos huesos distintos, no dos mitades de
  // uno solo como las vértebras — no deben sincronizarse entre sí.
  if (segmento.startsWith('ILION_')) return null
  if (segmento.endsWith('_DER')) return segmento.slice(0, -4) + '_IZQ'
  if (segmento.endsWith('_IZQ')) return segmento.slice(0, -4) + '_DER'
  return null
}

export default function EditorColumnaVertebral({ ajustes, onChangeAjustes, onGuardarSegmento }) {
  const [segmentoActivo, setSegmentoActivo] = useState(null)
  const ajustesRef = useRef(ajustes)

  useEffect(() => {
    ajustesRef.current = ajustes
  }, [ajustes])

  useEffect(() => {
    return () => {
      if (segmentoActivo && onGuardarSegmento) onGuardarSegmento(ajustesRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrarSegmento = () => {
    if (segmentoActivo && onGuardarSegmento) onGuardarSegmento(ajustesRef.current)
    setSegmentoActivo(null)
  }
  const panelRef = useClickOutside(cerrarSegmento)

  const datosSegmentoActivo = segmentoActivo ? ajustes[segmentoActivo] : null

  const handleClickSegmento = (segmento) => {
    if (segmentoActivo && segmentoActivo !== segmento && onGuardarSegmento) {
      onGuardarSegmento(ajustes)
    }
    setSegmentoActivo(segmento)
    if (!ajustes[segmento]) {
      onChangeAjustes({
        ...ajustes,
        [segmento]: { ajustado: false, tipo_ajuste: [], tecnica: '', notas: '', bloqueada: false },
      })
    }
  }

  const actualizarSegmento = (campo, valor) => {
    if (!segmentoActivo) return
    onChangeAjustes({
      ...ajustes,
      [segmentoActivo]: { ...ajustes[segmentoActivo], [campo]: valor },
    })
  }

  const toggleEnLista = (campo, valor) => {
    if (!segmentoActivo) return
    const actual = ajustes[segmentoActivo]?.[campo] || []
    const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]
    actualizarSegmento(campo, nuevo)
  }

  const toggleAjustado = () => {
    if (!segmentoActivo) return
    const actual = ajustes[segmentoActivo] || {}
    const nuevoAjustado = !actual.ajustado
    const hermano = segmentoHermano(segmentoActivo)
    const siguiente = {
      ...ajustes,
      [segmentoActivo]: {
        ...actual,
        ajustado: nuevoAjustado,
        bloqueada: nuevoAjustado ? false : actual.bloqueada,
      },
    }
    if (nuevoAjustado && hermano && ajustes[hermano]) {
      siguiente[hermano] = { ...ajustes[hermano], ajustado: false, bloqueada: false }
    }
    onChangeAjustes(siguiente)
  }

  const toggleBloqueada = () => {
    if (!segmentoActivo) return
    const actual = ajustes[segmentoActivo] || {}
    const nuevaBloqueada = !actual.bloqueada
    const hermano = segmentoHermano(segmentoActivo)
    const siguiente = {
      ...ajustes,
      [segmentoActivo]: {
        ...actual,
        bloqueada: nuevaBloqueada,
        ajustado: nuevaBloqueada ? false : actual.ajustado,
      },
    }
    if (hermano) {
      const actualHermano = ajustes[hermano] || {
        ajustado: false, tipo_ajuste: [], tecnica: '', notas: '', bloqueada: false,
      }
      siguiente[hermano] = {
        ...actualHermano,
        bloqueada: nuevaBloqueada,
        ajustado: nuevaBloqueada ? false : actualHermano.ajustado,
      }
    }
    onChangeAjustes(siguiente)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4" ref={panelRef}>
      <ColumnaVertebral
        ajustes={ajustes}
        segmentoActivo={segmentoActivo}
        onClickSegmento={handleClickSegmento}
      />

      <div className="sticky top-4 self-start">
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
                    type="radio"
                    name="tecnica"
                    checked={datosSegmentoActivo.tecnica === t}
                    onChange={() => actualizarSegmento('tecnica', t)}
                    onClick={() => {
                      if (datosSegmentoActivo.tecnica === t) actualizarSegmento('tecnica', '')
                    }}
                    disabled={!datosSegmentoActivo.ajustado}
                    className="disabled:cursor-not-allowed"
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
  )
}
