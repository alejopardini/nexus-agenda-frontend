// Fuente única de verdad para los colores de la columna vertebral interactiva.
// La usan ColumnaVertebral.jsx y ColumnaVertebralMini.jsx (con y sin imagen de
// fondo) para no quedar desincronizadas entre sí.
//
// Cada categoría define un color de fondo del óvalo (bg) y un color de texto
// para la etiqueta que va sobre ese óvalo (text).

export const COLOR_REGION = {
  cervical: { bg: '#D5F0EE', text: '#245E5C' },
  toracica: { bg: '#D8E3F2', text: '#29466B' },
  lumbar: { bg: '#DCEFE2', text: '#356047' },
  pelvis: { bg: '#E5DDF1', text: '#57456E' }, // SACRO, ILION
}

// Overrides: pintan el óvalo entero (ambas mitades), sin importar la región.
// Bloqueada tiene prioridad visual sobre ajustado.
export const COLOR_AJUSTADO = { bg: '#F7E8B5', text: '#6F5A16' }
export const COLOR_BLOQUEADA = { bg: '#F4C2C2', text: '#8F3F3F' }
