// Card genérica reutilizable (rama prueba-sidebar-visual): fondo blanco +
// borde + header opcional + contenido libre. Ancho flexible (w-full por
// defecto, se acomoda al contenedor) — el ancho fijo de 320px era solo el
// tamaño de prueba en Figma. Todavía no aplicada a ninguna pantalla.
//
// El contenido es 100% libre (children): para el ejemplo de "texto
// secundario" (fechas) y "texto normal" (valores) se exportan CardTextoSecundario
// y CardTexto. Para mostrar un estado de turno adentro, usar el componente
// Badge en vez de texto plano.
//
// Uso:
// <Card titulo="Turno #123">
//   <CardTextoSecundario>12/09/2026</CardTextoSecundario>
//   <CardTexto>Juan Pérez</CardTexto>
//   <Badge estado="confirmado">Confirmado</Badge>
// </Card>

const BASE =
  'w-full bg-white border border-borde-suave rounded-xl p-4 flex flex-col gap-3'

const HEADER = 'font-sans font-semibold text-[16px] leading-tight text-heading'

export default function Card({ titulo, children, className = '', ...props }) {
  return (
    <div className={`${BASE} ${className}`.trim()} {...props}>
      {titulo && <h3 className={HEADER}>{titulo}</h3>}
      {children && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  )
}

export function CardTextoSecundario({ className = '', ...props }) {
  return (
    <p
      className={`font-sans font-normal text-[14px] leading-[17px] text-texto-secundario ${className}`.trim()}
      {...props}
    />
  )
}

export function CardTexto({ className = '', ...props }) {
  return (
    <p
      className={`font-sans font-normal text-[14px] leading-[17px] text-texto ${className}`.trim()}
      {...props}
    />
  )
}
