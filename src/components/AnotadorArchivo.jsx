import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'

const COLORES = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff']

export default function AnotadorArchivo({ archivo, pacienteId, onClose, onGuardado }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const contenedorRef = useRef(null)

  const [herramienta, setHerramienta] = useState('lapiz') // 'lapiz' | 'linea' | 'borrador'
  const [color, setColor] = useState(COLORES[0])
  const [grosor, setGrosor] = useState(3)
  const [dibujando, setDibujando] = useState(false)
  const [puntoInicioLinea, setPuntoInicioLinea] = useState(null)
  const [historial, setHistorial] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [imagenLista, setImagenLista] = useState(false)

  const ajustarCanvas = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight
  }

  useEffect(() => {
    window.addEventListener('resize', ajustarCanvas)
    return () => window.removeEventListener('resize', ajustarCanvas)
  }, [])

  const handleImgLoad = () => {
    ajustarCanvas()
    setImagenLista(true)
  }

  const posicionRelativa = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const guardarSnapshot = () => {
    const canvas = canvasRef.current
    setHistorial((prev) => [...prev, canvas.toDataURL()])
  }

  const handleStart = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = posicionRelativa(e)

    if (herramienta === 'linea') {
      if (!puntoInicioLinea) {
        setPuntoInicioLinea({ x, y })
      } else {
        guardarSnapshot()
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = color
        ctx.lineWidth = grosor
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(puntoInicioLinea.x, puntoInicioLinea.y)
        ctx.lineTo(x, y)
        ctx.stroke()
        setPuntoInicioLinea(null)
      }
      return
    }

    guardarSnapshot()
    setDibujando(true)
    ctx.globalCompositeOperation = herramienta === 'borrador' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.lineWidth = herramienta === 'borrador' ? grosor * 4 : grosor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleMove = (e) => {
    if (herramienta === 'linea' || !dibujando) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = posicionRelativa(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleEnd = () => {
    setDibujando(false)
  }

  const deshacer = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (historial.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    const anterior = historial[historial.length - 1]
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = anterior
    setHistorial((prev) => prev.slice(0, -1))
  }

  const borrarTodo = () => {
    guardarSnapshot()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
      const escalaX = canvasFinal.width / canvasDibujo.width
      const escalaY = canvasFinal.height / canvasDibujo.height
      ctxFinal.drawImage(
        canvasDibujo, 0, 0, canvasDibujo.width, canvasDibujo.height,
        0, 0, canvasDibujo.width * escalaX, canvasDibujo.height * escalaY
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
              onClick={() => { setHerramienta('lapiz'); setPuntoInicioLinea(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'lapiz' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              ✏️ Lápiz
            </button>
            <button
              onClick={() => setHerramienta('linea')}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'linea' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              📏 Línea recta
            </button>
            <button
              onClick={() => { setHerramienta('borrador'); setPuntoInicioLinea(null) }}
              className={`text-xs px-3 py-1.5 rounded ${herramienta === 'borrador' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
              🧹 Borrador
            </button>
          </div>

          {herramienta !== 'borrador' && (
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

          <select
            value={grosor}
            onChange={(e) => setGrosor(Number(e.target.value))}
            className="text-xs border border-slate-300 rounded px-2 py-1.5"
          >
            <option value={2}>Fino</option>
            <option value={3}>Medio</option>
            <option value={5}>Grueso</option>
          </select>

          <button onClick={deshacer} className="text-xs px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100">
            ↩ Deshacer
          </button>
          <button onClick={borrarTodo} className="text-xs px-3 py-1.5 rounded bg-white border border-slate-300 text-red-600 hover:bg-red-50">
            Borrar todo
          </button>

          {herramienta === 'linea' && puntoInicioLinea && (
            <span className="text-xs text-blue-600">Click en el segundo punto para trazar la línea</span>
          )}
        </div>

        <div ref={contenedorRef} className="relative flex-1 overflow-auto flex items-center justify-center bg-slate-900 p-2">
          <div className="relative inline-block">
            <img
              ref={imgRef}
              src={archivo.archivo}
              alt={archivo.nombre}
              onLoad={handleImgLoad}
              className="max-w-full max-h-[60vh] block select-none"
              draggable={false}
            />
            {imagenLista && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-crosshair touch-none"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
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