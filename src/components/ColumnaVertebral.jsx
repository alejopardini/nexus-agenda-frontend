import { useImagenesPorNivel, OPACIDAD_COLOR_IMAGEN, maskImagenStyle } from '../utils/columnaVertebralImagenes'
import { COLOR_REGION, COLOR_AJUSTADO, COLOR_BLOQUEADA } from '../utils/coloresColumna'

const NIVELES = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 60
const OVALO_ALTO = 25
const SACRO_ANCHO = 52
const SACRO_ALTO = 65
const ILION_ANCHO = 47
const ILION_ALTO = 80
// Deben coincidir con las clases Tailwind "gap-2" y "gap-0.5" usadas más abajo
const GAP_FILA_NORMAL = 8
const GAP_PELVIS = 2
// Ancho del espaciador de las filas C1-L5 para que su óvalo quede en el mismo
// eje horizontal que el Sacro de la fila de pelvis (que es más ancho).
const ILION_CAJA_ANCHO = (ILION_ANCHO + 16) + GAP_PELVIS + SACRO_ANCHO / 2 - GAP_FILA_NORMAL - OVALO_ANCHO / 2

const DESPLAZAMIENTO_AJUSTE = 24
const CODIGOS_SIN_DESPLAZAMIENTO = ['PI', 'PI-R', 'PI-L']

function regionDe(nivel) {
  if (nivel.startsWith('C')) return 'cervical'
  if (nivel.startsWith('T')) return 'toracica'
  if (nivel.startsWith('L')) return 'lumbar'
  return 'pelvis' // SACRO, ILION
}

function tieneCodigoSinDesplazamiento(tipoAjuste) {
  return (tipoAjuste || []).some((t) => CODIGOS_SIN_DESPLAZAMIENTO.includes(t))
}

function colorEstado(nivel, datos) {
  if (datos?.bloqueada) return { color: COLOR_BLOQUEADA.bg, texto: COLOR_BLOQUEADA.text }
  if (datos?.ajustado) return { color: COLOR_AJUSTADO.bg, texto: COLOR_AJUSTADO.text }
  const region = COLOR_REGION[regionDe(nivel)]
  return { color: region.bg, texto: region.text }
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

function OvaloPartido({ nivel, ajustes, onClick, imagenPorNivel, ancho = OVALO_ANCHO, alto = OVALO_ALTO, sinDesplazamiento = false }) {
  const claveIzq = `${nivel}_IZQ`
  const claveDer = `${nivel}_DER`
  const bloqueadaIzq = ajustes[claveIzq]?.bloqueada
  const bloqueadaDer = ajustes[claveDer]?.bloqueada
  const ajustadoIzq = ajustes[claveIzq]?.ajustado
  const ajustadoDer = ajustes[claveDer]?.ajustado
  const bloqueada = bloqueadaIzq || bloqueadaDer
  const ajustado = ajustadoIzq || ajustadoDer
  const estadoColor = bloqueada
    ? COLOR_BLOQUEADA
    : ajustado
      ? COLOR_AJUSTADO
      : COLOR_REGION[regionDe(nivel)]
  const colorOvalo = estadoColor.bg
  const colorTexto = estadoColor.text
  const colorOvaloImagen = estadoColor.bg
  const resumenIzq = resumenAjuste(ajustes[claveIzq])
  const resumenDer = resumenAjuste(ajustes[claveDer])
  const mitadAncho = ancho / 2
  const radioExterior = alto / 2
  const desplazamiento = sinDesplazamiento || bloqueada
    ? 0
    : ajustadoDer
      ? (tieneCodigoSinDesplazamiento(ajustes[claveDer]?.tipo_ajuste) ? 0 : DESPLAZAMIENTO_AJUSTE)
      : ajustadoIzq
        ? (tieneCodigoSinDesplazamiento(ajustes[claveIzq]?.tipo_ajuste) ? 0 : -DESPLAZAMIENTO_AJUSTE)
        : 0
  const imagenUrl = imagenPorNivel[nivel]

  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: ancho }}>
      <div
        className="relative flex transition-all duration-150 hover:shadow-md hover:shadow-slate-400/50"
        style={
          imagenUrl
            ? {
                width: ancho,
                height: alto,
                transform: `translateX(${desplazamiento}px)`,
              }
            : {
                width: ancho,
                height: alto,
                borderRadius: 9999,
                overflow: 'hidden',
                border: '1px solid rgba(100,116,139,0.4)',
                transform: `translateX(${desplazamiento}px)`,
              }
        }
      >
        {imagenUrl ? (
          <>
            <img
              src={imagenUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: colorOvaloImagen, opacity: OPACIDAD_COLOR_IMAGEN, ...maskImagenStyle(imagenUrl) }}
            />
            <button type="button" onClick={() => onClick(claveIzq)} title={claveIzq} style={{ width: mitadAncho, height: alto }} />
            <button type="button" onClick={() => onClick(claveDer)} title={claveDer} style={{ width: mitadAncho, height: alto }} />
          </>
        ) : (
          <>
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
          </>
        )}
        {nivel !== 'SACRO' && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] font-bold leading-none"
            style={{ color: colorTexto }}
          >
            {nivel}
          </span>
        )}
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

function VertebraPelvis({ segmento, datos, seleccionado, onClick, imagenPorNivel, ancho, ovaloAlto }) {
  const { color } = colorEstado(segmento, datos)
  const colorImagen = color
  const resumen = resumenAjuste(datos)
  const imagenUrl = imagenPorNivel[segmento]

  return (
    <div className="relative flex items-center justify-center" style={{ width: ancho + 16, height: ovaloAlto }}>
      <button
        type="button"
        onClick={() => onClick(segmento)}
        title={segmento}
        className="relative"
        style={
          imagenUrl
            ? {
                width: ancho,
                height: ovaloAlto,
                border: seleccionado ? '2px solid #1d4ed8' : 'none',
              }
            : {
                width: ancho,
                height: ovaloAlto,
                borderRadius: 9999,
                backgroundColor: color,
                border: seleccionado ? '2px solid #1d4ed8' : '1px solid rgba(100,116,139,0.4)',
              }
        }
      >
        {imagenUrl && (
          <>
            <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: colorImagen, opacity: OPACIDAD_COLOR_IMAGEN, ...maskImagenStyle(imagenUrl) }}
            />
          </>
        )}
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

function FilaNivel({ nivel, ajustes, onClickSegmento, imagenPorNivel }) {
  return (
    <div className="flex items-center gap-2 py-px">
      <div style={{ width: ILION_CAJA_ANCHO, flexShrink: 0 }} aria-hidden="true" />
      <OvaloPartido nivel={nivel} ajustes={ajustes} onClick={onClickSegmento} imagenPorNivel={imagenPorNivel} />
    </div>
  )
}

export default function ColumnaVertebral({ ajustes, segmentoActivo, onClickSegmento }) {
  const imagenPorNivel = useImagenesPorNivel()

  return (
    <div className="max-w-md mx-auto w-full">
      {NIVELES.map((nivel) => (
        <FilaNivel
          key={nivel}
          nivel={nivel}
          ajustes={ajustes}
          onClickSegmento={onClickSegmento}
          imagenPorNivel={imagenPorNivel}
        />
      ))}

      <div className="flex items-center gap-0.5 py-3">
        <VertebraPelvis
          segmento="ILION_IZQ"
          datos={ajustes.ILION_IZQ}
          seleccionado={segmentoActivo === 'ILION_IZQ'}
          onClick={onClickSegmento}
          imagenPorNivel={imagenPorNivel}
          ancho={ILION_ANCHO}
          ovaloAlto={ILION_ALTO}
        />
        <OvaloPartido
          nivel="SACRO"
          ajustes={ajustes}
          onClick={onClickSegmento}
          imagenPorNivel={imagenPorNivel}
          ancho={SACRO_ANCHO}
          alto={SACRO_ALTO}
          sinDesplazamiento
        />
        <VertebraPelvis
          segmento="ILION_DER"
          datos={ajustes.ILION_DER}
          seleccionado={segmentoActivo === 'ILION_DER'}
          onClick={onClickSegmento}
          imagenPorNivel={imagenPorNivel}
          ancho={ILION_ANCHO}
          ovaloAlto={ILION_ALTO}
        />
      </div>
    </div>
  )
}
