import axios from 'axios'

// Rutas que no requieren sesión — nunca deben llevar el token guardado, para
// que un token vencido no le impida a nadie loguearse/registrarse/resetear
// contraseña (el propio backend las expone sin auth, ver config/urls.py).
const RUTAS_PUBLICAS = ['/login/', '/register/', '/password-reset/', '/password-reset-confirm/']

// Mensajes que devuelve la autenticación por token cuando el token no existe,
// venció por inactividad, o el usuario ya no está activo (DRF traduce sus
// mensajes propios al español por LANGUAGE_CODE="es" — confirmado contra el
// backend, no son los strings en inglés de la librería) — a diferencia de un
// 403 por falta de permisos (TieneMembresia, chequeos de rol), que siempre
// trae un detail de negocio distinto a estos. DRF devuelve esto como 403 y
// no 401 porque SessionAuthentication (primera en
// DEFAULT_AUTHENTICATION_CLASSES) no expone un WWW-Authenticate header; se
// chequea igual el 401 por si eso cambia en el backend.
const MENSAJES_TOKEN_INVALIDO = [
  'Token inválido.',
  'Usuario inactivo o borrado.',
  'El token venció por inactividad. Iniciá sesión de nuevo.',
]

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

apiClient.interceptors.request.use((config) => {
  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => config.url?.startsWith(ruta))
  const token = localStorage.getItem('token')
  if (token && !esRutaPublica) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const esTokenInvalido =
      (error.response?.status === 401 || error.response?.status === 403) &&
      MENSAJES_TOKEN_INVALIDO.includes(error.response?.data?.detail)

    if (esTokenInvalido) {
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient