import { useEffect, useState } from 'react'
import apiClient from '../api/client'

export default function CatalogoEditable({ titulo, endpoint, campos, valoresIniciales, renderResumen }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
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

  const toggleActivo = async (item) => {
    try {
      await apiClient.patch(`${endpoint}${item.id}/`, { activo: !item.activo })
      cargar()
    } catch {
      alert('No se pudo actualizar el estado.')
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Cargando...</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>

  const itemsFiltrados = items.filter((item) => (mostrarInactivos ? !item.activo : item.activo))

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-slate-800">{titulo}</h2>
        <button
          onClick={() => setMostrarInactivos(!mostrarInactivos)}
          className="text-sm text-blue-600 hover:underline"
        >
          {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
        </button>
      </div>

      {!mostrarInactivos && (
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end bg-slate-50 rounded p-3 mb-4">
          {campos.map((c) => (
            <div key={c.name} className={c.width || ''}>
              <label className="block text-xs text-slate-500 mb-1">{c.label}</label>
              <input
                type={c.type}
                min={c.min}
                step={c.step}
                value={form[c.name]}
                onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={guardando}
            className="bg-blue-600 text-white text-sm rounded px-4 py-1.5 hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : '+ Agregar'}
          </button>
          {errorForm && <p className="text-red-600 text-xs w-full">{errorForm}</p>}
        </form>
      )}

      {itemsFiltrados.length === 0 ? (
        <p className="text-slate-500 text-sm">
          {mostrarInactivos ? 'No hay inactivos.' : 'No hay nada cargado todavía.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {itemsFiltrados.map((item) => (
            <li key={item.id} className={`py-2 text-sm ${item.activo ? '' : 'opacity-50'}`}>
              {editandoId === item.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-end">
                    {campos.map((c) => (
                      <div key={c.name} className={c.width || ''}>
                        <label className="block text-xs text-slate-500 mb-1">{c.label}</label>
                        <input
                          type={c.type}
                          min={c.min}
                          step={c.step}
                          value={editForm[c.name] ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, [c.name]: e.target.value })}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
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
                  <div>
                    <span className="font-medium text-slate-800">{renderResumen(item)}</span>
                    {!item.activo && (
                      <span className="ml-2 text-xs bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="space-x-3 shrink-0">
                    {item.activo && (
                      <button onClick={() => iniciarEdicion(item)} className="text-blue-600 text-xs hover:underline">
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => toggleActivo(item)}
                      className={item.activo ? 'text-red-600 text-xs hover:underline' : 'text-green-600 text-xs hover:underline'}
                    >
                      {item.activo ? 'Desactivar' : 'Activar'}
                    </button>
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
