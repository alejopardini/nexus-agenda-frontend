import { useState } from 'react'
import apiClient from '../api/client'
import useClickOutside from '../hooks/useClickOutside'

export default function SelectorFrasesRapidas({ onSeleccionar }) {
  const [abierto, setAbierto] = useState(false)
  const [frases, setFrases] = useState([])
  const [cargado, setCargado] = useState(false)
  const [loading, setLoading] = useState(false)

  const ref = useClickOutside(() => setAbierto(false))

  const toggle = () => {
    if (!abierto && !cargado) {
      setLoading(true)
      apiClient
        .get('/frases-rapidas/')
        .then((res) => {
          setFrases(res.data)
          setCargado(true)
        })
        .catch(() => setFrases([]))
        .finally(() => setLoading(false))
    }
    setAbierto((prev) => !prev)
  }

  const elegir = (frase) => {
    onSeleccionar(frase.texto)
    setAbierto(false)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
      >
        📋 Frases
      </button>
      {abierto && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-64 max-h-64 overflow-y-auto z-20">
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-400">Cargando...</p>
          ) : frases.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              No tenés frases guardadas — gestionalas en tu perfil.
            </p>
          ) : (
            frases.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => elegir(f)}
                className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              >
                {f.titulo}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
