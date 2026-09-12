import { useEffect, useState } from 'react'
import apiClient from '../api/client'

// Arquitectura Zoe paso 5: gatea los componentes quiro-especificos
// (ColumnaVertebral y derivados) por Organizacion.vertical. Cachea el valor
// a nivel de modulo (no en localStorage - no hace falta sobrevivir un
// refresh, solo evitar pedirlo de nuevo en cada componente que lo usa
// dentro de la misma sesion de la pestaña) para que Camillas.jsx,
// PanelCamillaCondensado.jsx (embebido ahi mismo), ConsultaDetalle.jsx,
// FichaCamillaModal.jsx y FichaPacienteModal.jsx no disparen un GET
// /organizacion/ cada uno por su cuenta.
let verticalCacheado = null
let promesaEnCurso = null

function pedirVertical() {
  if (!promesaEnCurso) {
    promesaEnCurso = apiClient
      .get('/organizacion/')
      .then((res) => {
        verticalCacheado = res.data.vertical
        return verticalCacheado
      })
      .catch(() => {
        // Si falla el fetch, asumimos 'quiro' (el comportamiento de hoy)
        // en vez de ocultar la funcionalidad por un error de red
        // transitorio - ver diagnostico del commit.
        verticalCacheado = 'quiro'
        return verticalCacheado
      })
  }
  return promesaEnCurso
}

// Devuelve el vertical de la organizacion actual, o null mientras se esta
// resolviendo por primera vez en esta sesion de la pestaña.
export default function useVertical() {
  const [vertical, setVertical] = useState(verticalCacheado)

  useEffect(() => {
    if (verticalCacheado !== null) return
    pedirVertical().then(setVertical)
  }, [])

  return vertical
}

// Helper de conveniencia para el caso de uso mas comun (mostrar/ocultar
// los componentes de columna vertebral): null (todavia cargando) o 'quiro'
// confirmado se tratan igual - solo se oculta con una respuesta DISTINTA de
// 'quiro' ya confirmada. Evita que cada consumidor repita esta comparacion,
// y sobre todo evita el parpadeo de ocultar-y-volver-a-mostrar mientras
// carga, que hoy (con un solo vertical existente) nunca deberia notarse.
export function useEsVerticalQuiro() {
  const vertical = useVertical()
  return vertical === null || vertical === 'quiro'
}
