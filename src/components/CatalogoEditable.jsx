import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import apiClient from '../api/client'
import Boton from './Boton'
import BotonIcono from './BotonIcono'

export default function CatalogoEditable({ titulo, endpoint, campos, valoresIniciales, renderResumen }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(valoresIniciales)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState(valoresIniciales)
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const cargar = () => {
    apiClient
      .get(endpoint)
      .then((res) => setItems(res.data))
      .catch(() => setError('No se pudo cargar el listado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    try {
      await apiClient.post(endpoint, form)
      setForm(valoresIniciales)
      cargar()
    } catch (err) {
      const data = err.response?.data
      setErrorForm(data ? Object.values(data).flat().join(' ') : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEdicion = (item) => {
    setEditandoId(item.id)
    const valores = {}
    campos.forEach((c) => { valores[c.name] = item[c.name] })
    setEditForm(valores)
  }

  const cancelarEdicion = () => setEditandoId(null)

  const guardarEdicion = async (id) => {
    setGuardandoEdit(true)
    try {
      await apiClient.patch(`${endpoint}${id}/`, editForm)
      setEditandoId(null)
      cargar()
    } catch {
      alert('No se pudo guardar.')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const desactivar = async (item) => {
    try {
      await apiClient.patch(`${endpoint}${item.id}/`, { activo: false })
      cargar()
    } catch {
      alert('No se pudo desactivar.')
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Cargando...</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>

  // El backend sigue devolviendo activos e inactivos mezclados (el borrado
  // es soft, no DELETE — ver desactivar) pero esta pantalla ya no tiene UI
  // para ver ni reactivar inactivos, así que se filtran acá.
  const itemsActivos = items.filter((item) => item.activo)

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="font-bold text-slate-800 mb-3">{titulo}</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end bg-white border border-borde-suave rounded p-3 mb-4">
        {campos.map((c) => (
          <div key={c.name} className={c.width || ''}>
            <label className="block text-xs text-input-label mb-1">{c.label}</label>
            <input
              type={c.type}
              min={c.min}
              step={c.step}
              value={form[c.name]}
              onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
              className="w-full text-sm border border-input-border rounded px-2 py-1.5 focus:outline-none focus:border-input-focus"
              required
            />
          </div>
        ))}
        <Boton type="submit" tamaño="sm" disabled={guardando}>
          {guardando ? 'Guardando...' : '+ Agregar'}
        </Boton>
        {errorForm && <p className="text-red-600 text-xs w-full">{errorForm}</p>}
      </form>

      {itemsActivos.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay nada cargado todavía.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {itemsActivos.map((item) => (
            <li key={item.id} className="py-2 text-sm">
              {editandoId === item.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-end">
                    {campos.map((c) => (
                      <div key={c.name} className={c.width || ''}>
                        <label className="block text-xs text-input-label mb-1">{c.label}</label>
                        <input
                          type={c.type}
                          min={c.min}
                          step={c.step}
                          value={editForm[c.name] ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, [c.name]: e.target.value })}
                          className="w-full text-sm border border-input-border rounded px-2 py-1.5 focus:outline-none focus:border-input-focus"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => guardarEdicion(item.id)}
                      disabled={guardandoEdit}
                      className="text-green-600 text-xs hover:underline disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button onClick={cancelarEdicion} className="text-slate-500 text-xs hover:underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{renderResumen(item)}</span>
                  <div className="flex gap-3 items-center shrink-0">
                    <BotonIcono icono={Pencil} texto="Editar" color="primary" onClick={() => iniciarEdicion(item)} />
                    <BotonIcono icono={Trash2} texto="Desactivar" color="destructive" onClick={() => desactivar(item)} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
