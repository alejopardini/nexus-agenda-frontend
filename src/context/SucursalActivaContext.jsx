import { createContext, useContext, useEffect, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from './AuthContext'

const SucursalActivaContext = createContext(null)

const CLAVE_LOCALSTORAGE = 'sucursalActivaId'

// Filtro de sesión, no de permisos: vive en localStorage (por dispositivo,
// no por persona) y nunca es la base de una restricción real de backend —
// eso, si algún día hace falta, va a requerir un campo en Membresia (queda
// anotado, no se construye acá). Mientras tanto es puramente un default de
// UI que cada pantalla puede elegir respetar.
export function SucursalActivaProvider({ children }) {
  const { auth } = useAuth()
  const [sucursales, setSucursales] = useState([])
  const [sucursalActivaId, setSucursalActivaIdState] = useState(
    () => localStorage.getItem(CLAVE_LOCALSTORAGE) || null
  )

  useEffect(() => {
    if (!auth) return
    let cancelado = false
    apiClient
      .get('/sucursales/')
      .then((res) => {
        if (cancelado) return
        setSucursales(res.data)
        // Si la sucursal guardada en localStorage ya no existe (se borró
        // de la organización, o el usuario cambió de cuenta en este mismo
        // navegador), cae a "todas" en silencio en vez de quedar
        // filtrando por un id fantasma.
        setSucursalActivaIdState((actual) => {
          if (!actual) return actual
          const sigueExistiendo = res.data.some((s) => String(s.id) === String(actual))
          if (sigueExistiendo) return actual
          localStorage.removeItem(CLAVE_LOCALSTORAGE)
          return null
        })
      })
      .catch(() => {
        if (!cancelado) setSucursales([])
      })
    return () => {
      cancelado = true
    }
  }, [auth])

  const setSucursalActiva = (id) => {
    setSucursalActivaIdState(id)
    if (id) {
      localStorage.setItem(CLAVE_LOCALSTORAGE, id)
    } else {
      localStorage.removeItem(CLAVE_LOCALSTORAGE)
    }
  }

  return (
    <SucursalActivaContext.Provider value={{ sucursales, sucursalActivaId, setSucursalActiva }}>
      {children}
    </SucursalActivaContext.Provider>
  )
}

export function useSucursalActiva() {
  return useContext(SucursalActivaContext)
}
