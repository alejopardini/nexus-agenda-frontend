const SEGMENTOS_COLUMNA = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
]

const OVALO_ANCHO = 26
const OVALO_ALTO = 14
const PELVIS_OVALO_ANCHO = 35
const PELVIS_OVALO_ALTO = 20
const DESPLAZAMIENTO_PX = 10
const ANCHO_CONTENEDOR = PELVIS_OVALO_ANCHO * 2 + OVALO_ANCHO + 16

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

function colorDe(segmento, datos) {
  if (datos?.bloqueada) return COLOR_BLOQUEADA
  if (datos?.ajustado) return COLOR_AJUSTADO
  return COLOR_REGION[regionDe(segmento)]
}

function offsetPorDireccion(datos) {
  if (datos?.bloqueada) return 0
  if (datos?.direccion === 'izquierda') return -DESPLAZAMIENTO_PX
  if (datos?.direccion === 'derecha') return DESPLAZAMIENTO_PX
  return 0
}

function OvaloFila({ segmento, datos }) {
  const offset = offsetPorDireccion(datos)
  return (
    <div className="relative h-4 w-full">
      <div
        className="absolute top-1/2"
        style={{
          left: '50%',
          width: OVALO_ANCHO,
          height: OVALO_ALTO,
          borderRadius: 9999,
          backgroundColor: colorDe(segmento, datos),
          border: '1px solid rgba(100,116,139,0.3)',
          transform: `translate(calc(-50% + ${offset}px), -50%)`,
        }}
      />
    </div>
  )
}

function OvaloPelvis({ segmento, datos, ancho, alto, offset = 0 }) {
  return (
    <div
      style={{
        width: ancho,
        height: alto,
        borderRadius: 9999,
        backgroundColor: colorDe(segmento, datos),
        border: '1px solid rgba(100,116,139,0.3)',
        transform: `translateX(${offset}px)`,
      }}
    />
  )
}

export default function ColumnaVertebralMini({ ajustes }) {
  return (
    <div className="mx-auto" style={{ width: ANCHO_CONTENEDOR }}>
      {SEGMENTOS_COLUMNA.map((seg) => (
        <OvaloFila key={seg} segmento={seg} datos={ajustes[seg]} />
      ))}
      <div className="flex items-center justify-center gap-1 pt-1">
        <OvaloPelvis segmento="ILION_IZQ" datos={ajustes.ILION_IZQ} ancho={PELVIS_OVALO_ANCHO} alto={PELVIS_OVALO_ALTO} />
        <OvaloPelvis
          segmento="SACRO"
          datos={ajustes.SACRO}
          ancho={OVALO_ANCHO}
          alto={OVALO_ALTO}
          offset={offsetPorDireccion(ajustes.SACRO)}
        />
        <OvaloPelvis segmento="ILION_DER" datos={ajustes.ILION_DER} ancho={PELVIS_OVALO_ANCHO} alto={PELVIS_OVALO_ALTO} />
      </div>
    </div>
  )
}
