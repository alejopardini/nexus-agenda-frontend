import { useState } from 'react'
import useClickOutside from '../hooks/useClickOutside'

export default function BuscadorCliente({ clientes, value, onChange, onNuevoCliente }) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)

  const ref = useClickOutside(() => setAbierto(false))

  const clienteSeleccionado = clientes.find((p) => String(p.id) === String(value))
  const valorInput = abierto ? texto : (clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : '')

  const textoLower = texto.trim().toLowerCase()
  let resultados
  if (!textoLower) {
    resultados = [...clientes].sort((a, b) => a.apellido.localeCompare(b.apellido)).slice(0, 8)
  } else {
    const porApellido = clientes.filter((p) => p.apellido.toLowerCase().startsWith(textoLower))
    const idsApellido = new Set(porApellido.map((p) => p.id))
    const porNombre = clientes.filter((p) => !idsApellido.has(p.id) && p.nombre.toLowerCase().startsWith(textoLower))
    resultados = [...porApellido, ...porNombre].slice(0, 8)
  }

  const elegir = (cliente) => {
    onChange(cliente.id)
    setAbierto(false)
    setTexto('')
  }

  const crearNuevo = () => {
    onNuevoCliente()
    setAbierto(false)
    setTexto('')
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={valorInput}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={() => { setAbierto(true); setTexto('') }}
        placeholder="Buscar cliente por apellido o nombre..."
        className="w-full border border-slate-300 rounded px-3 py-2"
        required
      />
      {abierto && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-full z-20 max-h-64 overflow-y-auto">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => elegir(p)}
              className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            >
              {p.nombre} {p.apellido}
            </button>
          ))}
          {resultados.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400">Sin resultados.</p>
          )}
          {onNuevoCliente && (
            <button
              type="button"
              onClick={crearNuevo}
              className="block w-full text-left px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 border-t border-slate-100"
            >
              + Crear nuevo cliente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
