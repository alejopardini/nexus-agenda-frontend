// Input de texto reutilizable (rama prueba-sidebar-visual): label + campo +
// mensaje de error opcional, con sus 4 estados (default/focus/error/disabled),
// sobre los tokens de color definidos en index.css (--color-input-*).
// Todavía no aplicado a ninguna pantalla — queda disponible para cuando se
// decida usarlo. Ancho flexible (w-full): el ancho fijo de 300px era solo el
// tamaño de prueba en Figma.
//
// Uso: <CampoTexto label="Nombre" id="nombre" value={...} onChange={...} />
//      <CampoTexto label="Email" error="Ingresá un email válido" ... />

const LABEL =
  'font-sans font-medium text-[12px] leading-[15px] text-input-label'

const CAMPO_BASE =
  'w-full h-10 py-2.5 px-3 rounded-lg text-left ' +
  'font-sans font-normal text-[14px] leading-[17px] ' +
  'placeholder:text-input-placeholder outline-none transition-colors'

const ESTADOS = {
  default: 'bg-white border border-input-border focus:border-2 focus:border-input-focus',
  error: 'bg-white border-2 border-input-error',
  disabled: 'bg-input-bg-disabled border-2 border-input-border-disabled text-input-text-disabled placeholder:text-input-text-disabled cursor-not-allowed',
}

const MENSAJE_ERROR = 'font-sans font-normal text-[12px] leading-[15px] text-input-error'

export default function CampoTexto({
  label,
  id,
  error,
  disabled = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  const estado = disabled ? ESTADOS.disabled : error ? ESTADOS.error : ESTADOS.default

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
      )}
      <input
        id={id}
        disabled={disabled}
        className={`${CAMPO_BASE} ${estado} ${inputClassName}`.trim()}
        {...props}
      />
      {error && <p className={MENSAJE_ERROR}>{error}</p>}
    </div>
  )
}
