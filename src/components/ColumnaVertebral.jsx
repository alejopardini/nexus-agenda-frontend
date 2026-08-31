const NIVELES = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 64
const OVALO_ALTO = 28
const PELVIS_OVALO_ANCHO = 70
const PELVIS_OVALO_ALTO = 40
const ILION_CAJA_ANCHO = PELVIS_OVALO_ANCHO + 16

const COLOR_REGION = {
  cervical: '#bbf7d0',
  toracica: '#bfdbfe',
  lumbar: '#fef08a',
  pelvis: '#fbcfe8',
}
const COLOR_AJUSTADO = '#f59e0b'
const COLOR_BLOQUEADA = '#ef4444'
const DESPLAZAMIENTO_AJUSTE = 24

function regionDe(nivel) {
  if (nivel.startsWith('C')) return 'cervical'
  if (nivel.startsWith('T')) return 'toracica'
  if (nivel.startsWith('L')) return 'lumbar'
  return 'pelvis' // SACRO, ILION
}

function colorEstado(nivel, datos) {
  if (datos?.bloqueada) return { color: COLOR_BLOQUEADA, texto: '#fff' }
  if (datos?.ajustado) return { color: COLOR_AJUSTADO, texto: '#fff' }
  return { color: COLOR_REGION[regionDe(nivel)], texto: '#1e293b' }
}

function resumenAjuste(datos) {
  if (!datos?.ajustado || datos?.bloqueada) return null
  const tipoAjuste = datos.tipo_ajuste || []
  const tecnica = Array.isArray(datos.tecnica) ? datos.tecnica[0] : datos.tecnica
  const partes = [tipoAjuste[0], tecnica].filter(Boolean)
  if (partes.length === 0) return null
  const extra = Math.max(0, tipoAjuste.length - 1)
  return partes.join('-') + (extra > 0 ? ` +${extra}` : '')
}

function OvaloPartido({ nivel, ajustes, onClick, ancho = OVALO_ANCHO, alto = OVALO_ALTO, sinDesplazamiento = false }) {
  const claveIzq = `${nivel}_IZQ`
  const claveDer = `${nivel}_DER`
  const bloqueadaIzq = ajustes[claveIzq]?.bloqueada
  const bloqueadaDer = ajustes[claveDer]?.bloqueada
  const ajustadoIzq = ajustes[claveIzq]?.ajustado
  const ajustadoDer = ajustes[claveDer]?.ajustado
  const bloqueada = bloqueadaIzq || bloqueadaDer
  const ajustado = ajustadoIzq || ajustadoDer
  const colorOvalo = bloqueada
    ? COLOR_BLOQUEADA
    : ajustado
      ? COLOR_AJUSTADO
      : COLOR_REGION[regionDe(nivel)]
  const resumenIzq = resumenAjuste(ajustes[claveIzq])
  const resumenDer = resumenAjuste(ajustes[claveDer])
  const mitadAncho = ancho / 2
  const radioExterior = alto / 2
  const desplazamiento = sinDesplazamiento || bloqueada
    ? 0
    : ajustadoDer
      ? DESPLAZAMIENTO_AJUSTE
      : ajustadoIzq
        ? -DESPLAZAMIENTO_AJUSTE
        : 0

  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: ancho }}>
      <div
        className="relative flex transition-all duration-150 hover:shadow-md hover:shadow-slate-400/50"
        style={{
          width: ancho,
          height: alto,
          borderRadius: 9999,
          overflow: 'hidden',
          border: '1px solid rgba(100,116,139,0.4)',
          transform: `translateX(${desplazamiento}px)`,
        }}
      >
        <button
          type="button"
          onClick={() => onClick(claveIzq)}
          title={claveIzq}
          style={{
            width: mitadAncho,
            height: alto,
            backgroundColor: colorOvalo,
            borderTopLeftRadius: radioExterior,
            borderBottomLeftRadius: radioExterior,
          }}
        />
        <button
          type="button"
          onClick={() => onClick(claveDer)}
          title={claveDer}
          style={{
            width: mitadAncho,
            height: alto,
            backgroundColor: colorOvalo,
            borderTopRightRadius: radioExterior,
            borderBottomRightRadius: radioExterior,
          }}
        />
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold leading-none"
          style={{ color: '#1e293b' }}
        >
          {nivel}
        </span>
      </div>
      {(resumenIzq || resumenDer) && (
        <div className="flex" style={{ width: ancho }}>
          <span className="text-[9px] text-slate-500 text-center leading-tight truncate" style={{ width: mitadAncho }}>
            {resumenIzq}
          </span>
          <span className="text-[9px] text-slate-500 text-center leading-tight truncate" style={{ width: mitadAncho }}>
            {resumenDer}
          </span>
        </div>
      )}
    </div>
  )
}

function VertebraPelvis({ segmento, datos, seleccionado, onClick, ancho, ovaloAlto, lineas }) {
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
        }}
      >
        {lineas.map((linea) => <span key={linea}>{linea}</span>)}
      </button>
      {resumen && (
        <span
          className="absolute text-[10px] text-slate-500 text-center whitespace-nowrap"
          style={{ top: '100%', marginTop: 2, left: '50%', transform: 'translateX(-50%)' }}
        >
          {resumen}
        </span>
      )}
    </div>
  )
}

function FilaNivel({ nivel, ajustes, onClickSegmento }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div style={{ width: ILION_CAJA_ANCHO, flexShrink: 0 }} aria-hidden="true" />
      <OvaloPartido nivel={nivel} ajustes={ajustes} onClick={onClickSegmento} />
    </div>
  )
}

export default function ColumnaVertebral({ ajustes, segmentoActivo, onClickSegmento }) {
  return (
    <div className="max-w-xs mx-auto w-full">
      {NIVELES.map((nivel) => (
        <FilaNivel
          key={nivel}
          nivel={nivel}
          ajustes={ajustes}
          onClickSegmento={onClickSegmento}
        />
      ))}

      <div className="flex items-center gap-2 py-3">
        <VertebraPelvis
          segmento="ILION_IZQ"
          datos={ajustes.ILION_IZQ}
          seleccionado={segmentoActivo === 'ILION_IZQ'}
          onClick={onClickSegmento}
          ancho={PELVIS_OVALO_ANCHO}
          ovaloAlto={PELVIS_OVALO_ALTO}
          lineas={['ILIÓN', 'IZQ']}
        />
        <OvaloPartido nivel="SACRO" ajustes={ajustes} onClick={onClickSegmento} sinDesplazamiento />
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
