import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'

const COLORES = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff']
const FACTOR_GROSOR = 0.003
const TAMANIO_FUENTE_BASE = 16
const ZOOM_PASO = 0.25
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

const grosorProporcional = (ancho) => ancho * FACTOR_GROSOR
const tamanioFuenteProporcional = (ancho, anchoBase) => TAMANIO_FUENTE_BASE * (ancho / (anchoBase || ancho))

function dibujarTrazo(ctx, trazo, ancho, alto, anchoBase) {
  if (trazo.tipo === 'trazo') {
    ctx.globalCompositeOperation = trazo.modo === 'borrador' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = trazo.color
    ctx.lineWidth = trazo.modo === 'borrador' ? grosorProporcional(ancho) * 4 : grosorProporcional(ancho)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    trazo.puntos.forEach((p, i) => {
      const x = p.xRatio * ancho
      const y = p.yRatio * alto
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  } else if (trazo.tipo === 'linea') {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = trazo.color
    ctx.lineWidth = grosorProporcional(ancho)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(trazo.desde.xRatio * ancho, trazo.desde.yRatio * alto)
    ctx.lineTo(trazo.hasta.xRatio * ancho, trazo.hasta.yRatio * alto)
    ctx.stroke()
  } else if (trazo.tipo === 'texto') {
    ctx.globalCompositeOperation = 'source-over'
    const tamanioFuente = tamanioFuenteProporcional(ancho, anchoBase)
    ctx.font = `${tamanioFuente}px sans-serif`
    ctx.textBaseline = 'top'
    const padding = tamanioFuente / 3
    const x = trazo.xRatio * ancho
    const y = trazo.yRatio * alto
    const anchoTexto = ctx.measureText(trazo.valor).width
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - padding, y - padding, anchoTexto + padding * 2, tamanioFuente + padding * 2)
    ctx.fillStyle = '#000000'
    ctx.fillText(trazo.valor, x, y)
  }
}

export default function AnotadorArchivo({ archivo, pacienteId, onClose, onGuardado }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const contenedorRef = useRef(null)
  const inputTextoRef = useRef(null)
  const baseWidthRef = useRef(null)
  const trazosRef = useRef([])
  const trazoEnCursoRef = useRef(null)

  const [herramienta, setHerramienta] = useState('lapiz') // 'lapiz' | 'linea' | 'borrador' | 'texto'
  const [color, setColor] = useState(COLORES[0])
  const [zoom, setZoom] = useState(1)
  const [dibujando, setDibujando] = useState(false)
  const [puntoInicioLinea, setPuntoInicioLinea] = useState(null) // {xRatio, yRatio}
  const [textoPendiente, setTextoPendiente] = useState(null) // { xRatio, yRatio, xPantalla, yPantalla, valor }
  const [trazos, setTrazos] = useState([])
  const [trazoEnCurso, setTrazoEnCurso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [imagenLista, setImagenLista] = useState(false)

  useEffect(() => {
    trazosRef.current = trazos
    trazoEnCursoRef.current = trazoEnCurso
  })

  const redibujarTodo = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    trazosRef.current.forEach((t) => dibujarTrazo(ctx, t, canvas.width, canvas.height, baseWidthRef.current))
    if (trazoEnCursoRef.current) dibujarTrazo(ctx, trazoEnCursoRef.current, canvas.width, canvas.height, baseWidthRef.current)
  }

  const ajustarCanvas = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const nuevoAncho = img.clientWidth
    const nuevoAlto = img.clientHeight
    if (nuevoAncho === 0 || nuevoAlto === 0) return

    canvas.width = nuevoAncho
    canvas.height = nuevoAlto
    redibujarTodo()
  }

  const handleImgLoad = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (baseWidthRef.current === null) {
          baseWidthRef.current = imgRef.current.clientWidth
        }
        ajustarCanvas()
        setImagenLista(true)
      })
    })
  }

  useEffect(() => {
    if (imagenLista) ajustarCanvas()
  }, [imagenLista])

  useEffect(() => {
    const handler = () => ajustarCanvas()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => ajustarCanvas())
  }, [zoom])

  useEffect(() => {
    redibujarTodo()
  }, [trazos, trazoEnCurso])

  useEffect(() => {
    if (textoPendiente && inputTextoRef.current) {
      inputTextoRef.current.focus()
    }
  }, [textoPendiente])

  const posicionRelativa = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const escalaX = canvas.width / rect.width
    const escalaY = canvas.height / rect.height
    return {
      xCanvas: (clientX - rect.left) * escalaX,
      yCanvas: (clientY - rect.top) * escalaY,
      xPantalla: clientX - rect.left,
      yPantalla: clientY - rect.top,
    }
  }

  const handleStart = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const { xCanvas, yCanvas, xPantalla, yPantalla } = posicionRelativa(e)
    const punto = { xRatio: xCanvas / canvas.width, yRatio: yCanvas / canvas.height }

    if (herramienta === 'texto') {
      if (textoPendiente) return // ya hay un cuadro de texto abierto, primero confirmalo o cancelalo
      setTextoPendiente({ xRatio: punto.xRatio, yRatio: punto.yRatio, xPantalla, yPantalla, valor: '' })
      return
    }

    if (herramienta === 'linea') {
      if (!puntoInicioLinea) {
        setPuntoInicioLinea(punto)
      } else {
        setTrazos((prev) => [...prev, { tipo: 'linea', color, desde: puntoInicioLinea, hasta: punto }])
        setPuntoInicioLinea(null)
      }
      return
    }

    setTrazoEnCurso({ tipo: 'trazo', modo: herramienta, color, puntos: [punto] })
    setDibujando(true)
  }

  const handleMove = (e) => {
    if (herramienta === 'linea' || herramienta === 'texto' || !dibujando || !trazoEnCurso) return
    e.preventDefault()
    const canvas = canvasRef.current
    const { xCanvas, yCanvas } = posicionRelativa(e)
    const punto = { xRatio: xCanvas / canvas.width, yRatio: yCanvas / canvas.height }
    setTrazoEnCurso((prev) => ({ ...prev, puntos: [...prev.puntos, punto] }))
  }

  const handleEnd = () => {
    if (trazoEnCurso && trazoEnCurso.puntos.length > 1) {
      setTrazos((prev) => [...prev, trazoEnCurso])
    }
    setTrazoEnCurso(null)
    setDibujando(false)
  }

  const confirmarTexto = () => {
    if (!textoPendiente || !textoPendiente.valor.trim()) {
      setTextoPendiente(null)
      return
    }
    setTrazos((prev) => [...prev, {
      tipo: 'texto',
      xRatio: textoPendiente.xRatio,
      yRatio: textoPendiente.yRatio,
      valor: textoPendiente.valor,
    }])
    setTextoPendiente(null)
  }

  const cancelarTexto = () => setTextoPendiente(null)

  const iniciarArrastreCaja = (e) => {
    e.preventDefault()
    const inicioX = e.clientX
    const inicioY = e.clientY
    const xInicial = textoPendiente.xPantalla
    const yInicial = textoPendiente.yPantalla

    const onMove = (ev) => {
      setTextoPendiente((prev) => prev && {
        ...prev,
        xPantalla: xInicial + (ev.clientX - inicioX),
        yPantalla: yInicial + (ev.clientY - inicioY),
      })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const canvas = canvasRef.current
      setTextoPendiente((prev) => {
        if (!prev || !canvas) return prev
        return { ...prev, xRatio: prev.xPantalla / canvas.width, yRatio: prev.yPantalla / canvas.height }
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_PASO).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_PASO).toFixed(2)))
  const zoomReset = () => setZoom(1)

  const handleKeyDownTexto = (e) => {
    if (e.key === 'Enter') confirmarTexto()
    if (e.key === 'Escape') cancelarTexto()
  }

  const deshacer = () => {
    setTrazos((prev) => prev.slice(0, -1))
  }

  const borrarTodo = () => {
    setTrazos([])
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const img = imgRef.current
      const canvasDibujo = canvasRef.current

      const canvasFinal = document.createElement('canvas')
      canvasFinal.width = img.naturalWidth
      canvasFinal.height = img.naturalHeight
      const ctxFinal = canvasFinal.getContext('2d')

      ctxFinal.drawImage(img, 0, 0, canvasFinal.width, canvasFinal.height)
      ctxFinal.drawImage(
        canvasDibujo, 0, 0, canvasDibujo.width, canvasDibujo.height,
        0, 0, canvasFinal.width, canvasFinal.height
      )

      const blob = await new Promise((resolve) => canvasFinal.toBlob(resolve, 'image/png'))
      const nombreBase = archivo.nombre.replace(/\.[^/.]+$/, '')
      const formData = new FormData()
      formData.append('paciente', pacienteId)
      formData.append('archivo', blob, `${nombreBase} (anotado).png`)
      formData.append('nombre', `${nombreBase} (anotado)`)

      await apiClient.post('/archivos/', formData, {
        headers: { 'Content-Type': undefined },
      })
      onGuardado()
      onClose()
    } catch {
      alert('No se pudo guardar la anotación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-slate-200">
          <h2 className="font-medium text-slate-800 text-sm">Anotar: {archivo.nombre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="flex flex-wrap gap-2 items-center p-3 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-1">
            <button
              onClick={() => { setHerramienta('lapiz'); setPuntoInicioLinea(null); setTextoPendiente(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'lapiz' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              ✏️ Lápiz
            </button>
            <button
              onClick={() => { setHerramienta('linea'); setTextoPendiente(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'linea' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              📏 Línea recta
            </button>
            <button
              onClick={() => { setHerramienta('texto'); setPuntoInicioLinea(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'texto' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              🔤 Texto
            </button>
            <button
              onClick={() => { setHerramienta('borrador'); setPuntoInicioLinea(null); setTextoPendiente(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'borrador' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              🧹 Borrador
            </button>
          </div>

          {herramienta !== 'borrador' && herramienta !== 'texto' && (
            <div className="flex gap-1">
              {COLORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-slate-800' : 'border-slate-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          <button onClick={deshacer} className="text-xs px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100">
            ↩ Deshacer
          </button>
          <button onClick={borrarTodo} className="text-xs px-3 py-1.5 rounded bg-white border border-slate-300 text-red-600 hover:bg-red-50">
            Borrar todo
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN}
              className="text-xs w-7 py-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              −
            </button>
            <span className="text-xs text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX}
              className="text-xs w-7 py-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              +
            </button>
            <button onClick={zoomReset} className="text-xs px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100">
              Reset
            </button>
          </div>

          {herramienta === 'linea' && puntoInicioLinea && (
            <span className="text-xs text-blue-600">Click en el segundo punto para trazar la línea</span>
          )}
          {herramienta === 'texto' && !textoPendiente && (
            <span className="text-xs text-blue-600">Click donde querés escribir</span>
          )}
        </div>

        <div ref={contenedorRef} className="relative flex-1 overflow-auto flex items-center justify-center bg-slate-900 p-2">
          <div className="relative inline-block">
            <img
              ref={imgRef}
              src={archivo.archivo}
              alt={archivo.nombre}
              onLoad={handleImgLoad}
              className={`block select-none ${baseWidthRef.current ? '' : 'max-w-full max-h-[60vh]'}`}
              style={baseWidthRef.current ? { width: baseWidthRef.current * zoom, height: 'auto' } : undefined}
              draggable={false}
            />
            {imagenLista && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
            )}

            {textoPendiente && (
              <div
                className="absolute z-10 flex flex-col items-start gap-1"
                style={{ left: textoPendiente.xPantalla, top: textoPendiente.yPantalla }}
              >
                <div
                  onMouseDown={iniciarArrastreCaja}
                  className="w-full text-center bg-slate-700 text-white text-xs rounded-t cursor-move select-none py-0.5"
                  title="Arrastrar"
                >
                  ⠿
                </div>
                <input
                  ref={inputTextoRef}
                  type="text"
                  value={textoPendiente.valor}
                  onChange={(e) => setTextoPendiente({ ...textoPendiente, valor: e.target.value })}
                  onKeyDown={handleKeyDownTexto}
                  placeholder="Escribí y Enter"
                  className="text-sm border-2 border-blue-500 rounded px-2 py-1 bg-white shadow-lg outline-none"
                  style={{ minWidth: 140 }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={confirmarTexto}
                    className="bg-blue-600 text-white text-xs rounded px-2 py-1 shadow"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelarTexto}
                    className="bg-white border border-slate-300 text-slate-600 text-xs rounded px-2 py-1 shadow"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-3 border-t border-slate-200">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar como archivo nuevo'}
          </button>
        </div>
      </div>
    </div>
  )
}