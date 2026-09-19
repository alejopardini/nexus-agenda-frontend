import { useImagenesPorNivel, OPACIDAD_COLOR_IMAGEN, maskImagenStyle } from '../utils/columnaVertebralImagenes'
import { COLOR_REGION, COLOR_AJUSTADO, COLOR_BLOQUEADA } from '../utils/coloresColumna'

const SEGMENTOS_COLUMNA = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 28
const OVALO_ALTO = 9
const SACRO_ANCHO = 18
const SACRO_ALTO = 22
const ILION_ANCHO = 14
const ILION_ALTO = 24
const DESPLAZAMIENTO_PX = 10
// +8 = los dos gaps de 4px (gap-1) entre Ilión/Sacro/Ilión en la fila de pelvis
const ANCHO_CONTENEDOR = ILION_ANCHO * 2 + SACRO_ANCHO + 8

function regionDe(segmento) {
  if (segmento.startsWith('C')) return 'cervical'
  if (segmento.startsWith('T')) return 'toracica'
  if (segmento.startsWith('L')) return 'lumbar'
  return 'pelvis' // SACRO, ILION_IZQ, ILION_DER
}

function colorDe(segmento, datos) {
  if (datos?.bloqueada) return COLOR_BLOQUEADA.bg
  if (datos?.ajustado) return COLOR_AJUSTADO.bg
  return COLOR_REGION[regionDe(segmento)].bg
}

function colorImagenDe(segmento, datos) {
  return colorDe(segmento, datos)
}

function offsetPorDireccion(datos) {
  if (datos?.bloqueada) return 0
  if (datos?.direccion === 'izquierda') return -DESPLAZAMIENTO_PX
  if (datos?.direccion === 'derecha') return DESPLAZAMIENTO_PX
  return 0
}

function datosCombinados(segmento, ajustes) {
  const izq = ajustes[`${segmento}_IZQ`]
  const der = ajustes[`${segmento}_DER`]
  const bloqueada = Boolean(izq?.bloqueada || der?.bloqueada)
  const ajustado = Boolean(izq?.ajustado || der?.ajustado)
  let direccion = null
  if (!bloqueada) {
    if (der?.ajustado && !izq?.ajustado) direccion = 'derecha'
    else if (izq?.ajustado && !der?.ajustado) direccion = 'izquierda'
  }
  return { bloqueada, ajustado, direccion }
}

function OvaloFila({ segmento, ajustes, imagenPorNivel }) {
  const datos = datosCombinados(segmento, ajustes)
  const offset = offsetPorDireccion(datos)
  const imagenUrl = imagenPorNivel[segmento]
  return (
    <div className="relative h-4 w-full">
      <div
        className="absolute top-1/2"
        style={{
          left: '50%',
          width: OVALO_ANCHO,
          height: OVALO_ALTO,
          transform: `translate(calc(-50% + ${offset}px), -50%)`,
        }}
      >
        {imagenUrl ? (
          <>
            <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: colorImagenDe(segmento, datos), opacity: OPACIDAD_COLOR_IMAGEN, ...maskImagenStyle(imagenUrl) }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              borderRadius: 9999,
              backgroundColor: colorDe(segmento, datos),
              border: '1px solid rgba(100,116,139,0.3)',
            }}
          />
        )}
      </div>
    </div>
  )
}

function OvaloPelvis({ segmento, datos, imagenPorNivel, ancho, alto, offset = 0 }) {
  const imagenUrl = imagenPorNivel[segmento]
  return (
    <div className="relative" style={{ width: ancho, height: alto, transform: `translateX(${offset}px)` }}>
      {imagenUrl ? (
        <>
          <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: colorImagenDe(segmento, datos), opacity: OPACIDAD_COLOR_IMAGEN, ...maskImagenStyle(imagenUrl) }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 9999,
            backgroundColor: colorDe(segmento, datos),
            border: '1px solid rgba(100,116,139,0.3)',
          }}
        />
      )}
    </div>
  )
}

export default function ColumnaVertebralMini({ ajustes }) {
  const imagenPorNivel = useImagenesPorNivel()

  return (
    <div className="mx-auto" style={{ width: ANCHO_CONTENEDOR }}>
      {SEGMENTOS_COLUMNA.map((seg) => (
        <OvaloFila key={seg} segmento={seg} ajustes={ajustes} imagenPorNivel={imagenPorNivel} />
      ))}
      <div className="flex items-center justify-center gap-1 pt-1">
        <OvaloPelvis segmento="ILION_IZQ" datos={ajustes.ILION_IZQ} imagenPorNivel={imagenPorNivel} ancho={ILION_ANCHO} alto={ILION_ALTO} />
        <OvaloPelvis
          segmento="SACRO"
          datos={datosCombinados('SACRO', ajustes)}
          imagenPorNivel={imagenPorNivel}
          ancho={SACRO_ANCHO}
          alto={SACRO_ALTO}
        />
        <OvaloPelvis segmento="ILION_DER" datos={ajustes.ILION_DER} imagenPorNivel={imagenPorNivel} ancho={ILION_ANCHO} alto={ILION_ALTO} />
      </div>
    </div>
  )
}
