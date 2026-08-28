import { useRef, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'

export default function Soporte() {
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const inputArchivoRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    const formData = new FormData()
    formData.append('asunto', asunto)
    formData.append('mensaje', mensaje)
    if (archivo) formData.append('archivo', archivo)
    try {
      await apiClient.post('/soporte/', formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setAsunto('')
      setMensaje('')
      setArchivo(null)
      if (inputArchivoRef.current) inputArchivoRef.current.value = ''
      setEnviado(true)
    } catch (err) {
      const data = err.response?.data
      const mensajeError = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo enviar la consulta.'
      setError(mensajeError)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-4 max-w-2xl">
        <BotonVolver to="/" texto="Inicio" />

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Soporte técnico</h1>
          <p className="text-sm text-slate-500 mb-4">
            ¿Tenés un problema o una consulta? Escribinos y te vamos a responder pronto.
          </p>

          {enviado && (
            <p className="text-sm text-green-600 mb-4">
              Tu consulta fue enviada, te vamos a responder pronto.
            </p>
          )}
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Asunto</label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                required
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Mensaje</label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
                rows={5}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Archivo adjunto (opcional)</label>
              <input
                type="file"
                ref={inputArchivoRef}
                onChange={(e) => setArchivo(e.target.files[0] || null)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar consulta'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
