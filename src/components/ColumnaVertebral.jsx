const SEGMENTOS_COLUMNA = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 52
const OVALO_ALTO = 28
const PELVIS_OVALO_ANCHO = 70
const PELVIS_OVALO_ALTO = 40
const DESPLAZAMIENTO_PX = 20

const COLOR_REGION = {
  cervical: '#bbf7d0',
  toracica: '#bfdbfe',
  lumbar: '#fef08a',
  pelvis: '#fbcfe8',
}
const COLOR_AJUSTADO = '#f59e0b'
const COLOR_BLOQUEADA = '#ef4444'

function regionDe(segmento) {
  if (segmento.startsWith('C')) return 'cervical'
  if (segmento.startsWith('T')) return 'toracica'
  if (segmento.startsWith('L')) return 'lumbar'
  return 'pelvis' // SACRO, ILION_IZQ, ILION_DER
}

function colorEstado(segmento, datos) {
  if (datos?.bloqueada) return { color: COLOR_BLOQUEADA, texto: '#fff' }
  if (datos?.ajustado) return { color: COLOR_AJUSTADO, texto: '#fff' }
  return { color: COLOR_REGION[regionDe(segmento)], texto: '#1e293b' }
}

function offsetPorDireccion(datos) {
  if (datos?.bloqueada) return 0
  if (datos?.direccion === 'izquierda') return -DESPLAZAMIENTO_PX
  if (datos?.direccion === 'derecha') return DESPLAZAMIENTO_PX
  return 0
}

function resumenAjuste(datos) {
  if (!datos?.ajustado || datos?.bloqueada) return null
  const tipoAjuste = datos.tipo_ajuste || []
  const tecnica = datos.tecnica || []
  const primerTipo = tipoAjuste[0]
  const primeraTecnica = tecnica[0]
  const partes = [primerTipo, primeraTecnica].filter(Boolean)
  if (partes.length === 0) return null
  const extra = Math.max(0, tipoAjuste.length - 1) + Math.max(0, tecnica.length - 1)
  return partes.join('-') + (extra > 0 ? ` +${extra}` : '')
}

function VertebraFila({ segmento, datos, seleccionado, onClick }) {
  const { color, texto } = colorEstado(segmento, datos)
  const offset = offsetPorDireccion(datos)
  const resumen = resumenAjuste(datos)

  return (
    <div className="relative h-9 w-full">
      <button
        type="button"
        onClick={() => onClick(segmento)}
        title={segmento}
        className="absolute top-1/2 flex items-center justify-center text-[11px] font-bold transition-transform"
        style={{
          left: '50%',
          width: OVALO_ANCHO,
          height: OVALO_ALTO,
          borderRadius: 9999,
          backgroundColor: color,
          color: texto,
          border: seleccionado ? '2px solid #1d4ed8' : '1px solid rgba(100,116,139,0.4)',
          transform: `translate(calc(-50% + ${offset}px), -50%)`,
        }}
      >
        {segmento}
      </button>
      {resumen && (
        <span
          className="absolute top-1/2 text-[10px] text-slate-500 whitespace-nowrap"
          style={{
            left: `calc(50% + ${offset}px + ${OVALO_ANCHO / 2 + 8}px)`,
            transform: 'translateY(-50%)',
          }}
        >
          {resumen}
        </span>
      )}
    </div>
  )
}

function VertebraPelvis({ segmento, datos, seleccionado, onClick, ancho, ovaloAlto, offset = 0, lineas }) {
  const { color, texto } = colorEstado(segmento, datos)
  const resumen = resumenAjuste(datos)

  return (
    <div className="relative flex items-center justify-center" style={{ width: ancho + 16, height: PELVIS_OVALO_ALTO }}>
      <button
        type="button"
        onClick={() => onClick(segmento)}
        title={segmento}
        className="flex flex-col items-center justify-center leading-none text-[10px] font-bold"
        style={{
          width: ancho,
          height: ovaloAlto,
          borderRadius: 9999,
          backgroundColor: color,
          color: texto,
          border: seleccionado ? '2px solid #1d4ed8' : '1px solid rgba(100,116,139,0.4)',
          transform: `translateX(${offset}px)`,
        }}
      >
        {lineas ? lineas.map((linea) => <span key={linea}>{linea}</span>) : segmento}
      </button>
      {resumen && (
        <span
          className="absolute text-[10px] text-slate-500 text-center whitespace-nowrap"
          style={{ top: '100%', marginTop: 2, left: '50%', transform: `translateX(calc(-50% + ${offset}px))` }}
        >
          {resumen}
        </span>
      )}
    </div>
  )
}

export default function ColumnaVertebral({ ajustes, segmentoActivo, onClickSegmento }) {
  return (
    <div className="max-w-xs mx-auto w-full">
      {SEGMENTOS_COLUMNA.map((seg) => (
        <VertebraFila
          key={seg}
          segmento={seg}
          datos={ajustes[seg]}
          seleccionado={segmentoActivo === seg}
          onClick={onClickSegmento}
        />
      ))}

      <div className="flex items-center justify-center gap-3 py-3">
        <VertebraPelvis
          segmento="ILION_IZQ"
          datos={ajustes.ILION_IZQ}
          seleccionado={segmentoActivo === 'ILION_IZQ'}
          onClick={onClickSegmento}
          ancho={PELVIS_OVALO_ANCHO}
          ovaloAlto={PELVIS_OVALO_ALTO}
          lineas={['ILIÓN', 'IZQ']}
        />
        <VertebraPelvis
          segmento="SACRO"
          datos={ajustes.SACRO}
          seleccionado={segmentoActivo === 'SACRO'}
          onClick={onClickSegmento}
          ancho={OVALO_ANCHO}
          ovaloAlto={OVALO_ALTO}
          offset={offsetPorDireccion(ajustes.SACRO)}
        />
        <VertebraPelvis
          segmento="ILION_DER"
          datos={ajustes.ILION_DER}
          seleccionado={segmentoActivo === 'ILION_DER'}
          onClick={onClickSegmento}
          ancho={PELVIS_OVALO_ANCHO}
          ovaloAlto={PELVIS_OVALO_ALTO}
          lineas={['ILIÓN', 'DER']}
        />
      </div>
    </div>
  )
}
