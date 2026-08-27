export function hmAMinutos(hm) {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export function minutosAHM(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function duracionAMinutos(duracionStr) {
  const [h, m] = duracionStr.split(':').map(Number)
  return h * 60 + m
}

export function diaSemanaBackend(fecha) {
  const jsDay = fecha.getDay()
  return (jsDay + 6) % 7
}

export function fechaToStr(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
