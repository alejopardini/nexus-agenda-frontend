const NIVELES = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 52
const OVALO_ALTO = 28
const PELVIS_OVALO_ANCHO = 70
const PELVIS_OVALO_ALTO = 40

const COLOR_REGION = {
  cervical: '#bbf7d0',
  toracica: '#bfdbfe',
  lumbar: '#fef08a',
  pelvis: '#fbcfe8',
}
const COLOR_AJUSTADO = '#f59e0b'
const COLOR_BLOQUEADA = '#ef4444'

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

function Punto({ segmento, nivel, datos, seleccionado, onClick, ancho = OVALO_ANCHO, alto = OVALO_ALTO }) {
  const { color, texto } = colorEstado(nivel, datos)
  const resumen = resumenAjuste(datos)

  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: ancho }}>
      <button
        type="button"
        onClick={() => onClick(segmento)}
        title={segmento}
        className="flex items-center justify-center text-[11px] font-bold"
        style={{
          width: ancho,
          height: alto,
          borderRadius: 9999,
          backgroundColor: color,
          color: texto,
          border: seleccionado ? '2px solid #1d4ed8' : '1px solid rgba(100,116,139,0.4)',
        }}
      />
      {resumen && (
        <span className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">{resumen}</span>
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

function FilaNivel({ nivel, ajustes, segmentoActivo, onClickSegmento }) {
  const claveIzq = `${nivel}_IZQ`
  const claveDer = `${nivel}_DER`

  return (
    <div className="flex items-center justify-between py-1">
      <Punto
        segmento={claveIzq}
        nivel={nivel}
        datos={ajustes[claveIzq]}
        seleccionado={segmentoActivo === claveIzq}
        onClick={onClickSegmento}
      />
      <span className="text-xs font-semibold text-slate-600 w-10 text-center shrink-0">{nivel}</span>
      <Punto
        segmento={claveDer}
        nivel={nivel}
        datos={ajustes[claveDer]}
        seleccionado={segmentoActivo === claveDer}
        onClick={onClickSegmento}
      />
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
          segmentoActivo={segmentoActivo}
          onClickSegmento={onClickSegmento}
        />
      ))}

      <div className="flex items-center justify-center gap-2 py-3">
        <VertebraPelvis
          segmento="ILION_IZQ"
          datos={ajustes.ILION_IZQ}
          seleccionado={segmentoActivo === 'ILION_IZQ'}
          onClick={onClickSegmento}
          ancho={PELVIS_OVALO_ANCHO}
          ovaloAlto={PELVIS_OVALO_ALTO}
          lineas={['ILIÓN', 'IZQ']}
        />
        <div className="flex items-center gap-1.5">
          <Punto
            segmento="SACRO_IZQ"
            nivel="SACRO"
            datos={ajustes.SACRO_IZQ}
            seleccionado={segmentoActivo === 'SACRO_IZQ'}
            onClick={onClickSegmento}
          />
          <span className="text-xs font-semibold text-slate-600">SACRO</span>
          <Punto
            segmento="SACRO_DER"
            nivel="SACRO"
            datos={ajustes.SACRO_DER}
            seleccionado={segmentoActivo === 'SACRO_DER'}
            onClick={onClickSegmento}
          />
        </div>
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
