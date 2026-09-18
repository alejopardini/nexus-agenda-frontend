import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Input de texto reutilizable (rama prueba-sidebar-visual): label + campo +
// mensaje de error opcional, con sus 4 estados (default/focus/error/disabled),
// sobre los tokens de color definidos en index.css (--color-input-*).
// Todavía no aplicado a ninguna pantalla — queda disponible para cuando se
// decida usarlo. Ancho flexible (w-full): el ancho fijo de 300px era solo el
// tamaño de prueba en Figma.
//
// Uso: <CampoTexto label="Nombre" id="nombre" value={...} onChange={...} />
//      <CampoTexto label="Email" error="Ingresá un email válido" ... />
//
// Con type="password": agrega automáticamente el ícono de mostrar/ocultar
// (Eye/EyeOff), sin que cada pantalla lo duplique. El estado de mostrar es
// local a esta instancia — dos CampoTexto password en el mismo formulario
// (ej. contraseña + repetir) no comparten el toggle. El botón del ícono es
// type="button" a propósito, para no disparar el submit del form.

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
  type,
  ...props
}) {
  const [mostrar, setMostrar] = useState(false)
  const esPassword = type === 'password'
  const estado = disabled ? ESTADOS.disabled : error ? ESTADOS.error : ESTADOS.default

  const campo = (
    <input
      id={id}
      type={esPassword ? (mostrar ? 'text' : 'password') : type}
      disabled={disabled}
      className={`${CAMPO_BASE} ${estado} ${esPassword ? 'pr-10' : ''} ${inputClassName}`.trim()}
      {...props}
    />
  )

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
      )}
      {esPassword ? (
        <div className="relative">
          {campo}
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            disabled={disabled}
            aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-input-placeholder hover:text-input-label disabled:pointer-events-none"
          >
            {mostrar ? (
              <EyeOff size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={18} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      ) : (
        campo
      )}
      {error && <p className={MENSAJE_ERROR}>{error}</p>}
    </div>
  )
}
