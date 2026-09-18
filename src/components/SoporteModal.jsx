import { useState } from 'react'
import apiClient from '../api/client'
import Modal from './Modal'
import Boton from './Boton'

export default function SoporteModal({ onClose }) {
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

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
    <Modal titulo="Soporte técnico" onClose={onClose}>
      {enviado ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-green-600">Tu consulta fue enviada, te vamos a responder pronto.</p>
          <Boton variante="primary" onClick={onClose} className="w-full">Listo</Boton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            ¿Tenés un problema o una consulta? Escribinos y te vamos a responder pronto.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

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
            <label
              htmlFor="archivo-input-soporte"
              className="block w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-600 truncate cursor-pointer hover:bg-slate-50"
            >
              {archivo ? archivo.name : 'Elegir archivo...'}
            </label>
            <input
              id="archivo-input-soporte"
              type="file"
              onChange={(e) => setArchivo(e.target.files[0] || null)}
              className="sr-only"
            />
          </div>

          <Boton type="submit" variante="primary" disabled={enviando} className="w-full">
            {enviando ? 'Enviando...' : 'Enviar consulta'}
          </Boton>
        </form>
      )}
    </Modal>
  )
}
