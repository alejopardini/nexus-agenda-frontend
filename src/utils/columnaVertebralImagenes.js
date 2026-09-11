export const IMAGEN_POR_NIVEL = Object.fromEntries(
  Object.entries(import.meta.glob('/src/assets/columna/*.png', { eager: true, import: 'default' }))
    .map(([ruta, url]) => [ruta.split('/').pop().replace('.png', ''), url])
)

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
