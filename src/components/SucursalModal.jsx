import { useState } from 'react'
import apiClient from '../api/client'
import Modal from './Modal'
import Boton from './Boton'

export default function SucursalModal({ sucursal, onClose, onGuardado }) {
  const editando = Boolean(sucursal)
  const [nombre, setNombre] = useState(sucursal?.nombre || '')
  const [direccion, setDireccion] = useState(sucursal?.direccion || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    const payload = { nombre, direccion: direccion || null }
    try {
      if (editando) {
        await apiClient.patch(`/sucursales/${sucursal.id}/`, payload)
      } else {
        await apiClient.post('/sucursales/', payload)
      }
      onGuardado()
      onClose()
    } catch (err) {
      const data = err.response?.data
      const mensajeError = data?.detail
        ? data.detail
        : data
          ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
          : 'No se pudo guardar la sucursal.'
      setError(mensajeError)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar sucursal' : 'Nueva sucursal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm text-slate-600 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Dirección (opcional)</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
          {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear sucursal'}
        </Boton>
      </form>
    </Modal>
  )
}
