import { useEffect, useState } from 'react'

// eager:false — cada imagen queda en su propio chunk (import dinámico), no en
// el bundle principal. Las 29 pesan ~48MB de fuente; con eager:true entraban
// todas a la carga inicial de la app aunque nadie abriera nunca una ficha con
// columna vertebral.
const MODULOS = import.meta.glob('/src/assets/columna/*.png', { import: 'default' })

function nivelDeRuta(ruta) {
  return ruta.split('/').pop().replace('.png', '')
}

// Todas las imágenes se necesitan juntas apenas se muestra la columna (es la
// columna completa, no hay carga por segmento) — se resuelven todas de una
// con Promise.all y se cachean a nivel de módulo, en vez de ir apareciendo de
// a una a medida que cada óvalo termina de cargar la suya.
let cache = null
let promesaCarga = null

function cargarImagenesColumna() {
  if (cache) return Promise.resolve(cache)
  if (!promesaCarga) {
    promesaCarga = Promise.all(
      Object.entries(MODULOS).map(([ruta, cargar]) => cargar().then((url) => [nivelDeRuta(ruta), url]))
    ).then((entradas) => {
      cache = Object.fromEntries(entradas)
      return cache
    })
  }
  return promesaCarga
}

// Mientras las imágenes cargan (solo la primera vez que se abre una columna
// en la sesión), devuelve {} — ColumnaVertebral/ColumnaVertebralMini ya
// tienen un estado sin imagen (óvalo de color plano) para cuando falta el
// nivel, así que no hace falta un loader nuevo: se ve el óvalo plano y pasa
// a la silueta con imagen en cuanto resuelve, todas juntas.
export function useImagenesPorNivel() {
  const [urls, setUrls] = useState(() => cache || {})
  useEffect(() => {
    if (cache) return
    let activo = true
    cargarImagenesColumna().then((resueltas) => { if (activo) setUrls(resueltas) })
    return () => { activo = false }
  }, [])
  return urls
}

// Opacidad del overlay de color sobre la imagen (experimental). Los colores
// en sí viven en utils/coloresColumna.js — misma fuente que los óvalos CSS.
export const OPACIDAD_COLOR_IMAGEN = 0.95

export function maskImagenStyle(url) {
  return {
    maskImage: `url(${url})`,
    maskSize: 'contain',
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskImage: `url(${url})`,
    WebkitMaskSize: 'contain',
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
  }
}
