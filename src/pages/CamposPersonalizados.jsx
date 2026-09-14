import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'

const TIPOS = [
  ['texto', 'Texto libre'],
  ['checkbox', 'Checkboxes (multi-selección)'],
  ['select', 'Desplegable (una opción)'],
]

const TIPO_LABEL = Object.fromEntries(TIPOS)

const parseOpciones = (texto) => texto.split(',').map((s) => s.trim()).filter(Boolean)

const CAMPO_VACIO = { etiqueta: '', tipo: 'texto', opcionesTexto: '', orden: 0 }

export default function CamposPersonalizados() {
  const [campos, setCampos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState(CAMPO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [edit, setEdit] = useState(CAMPO_VACIO)

  const cargar = () => {
    apiClient
      .get('/campos-personalizados/')
      .then((res) => setCampos(res.data))
      .catch(() => setError('No se pudieron cargar los campos personalizados.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const crearCampo = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await apiClient.post('/campos-personalizados/', {
        etiqueta: nuevo.etiqueta,
        tipo: nuevo.tipo,
        opciones: nuevo.tipo === 'texto' ? [] : parseOpciones(nuevo.opcionesTexto),
        orden: Number(nuevo.orden) || 0,
      })
      setNuevo(CAMPO_VACIO)
      setMostrarForm(false)
      cargar()
    } catch {
      alert('No se pudo crear el campo.')
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEdicion = (c) => {
    setEditandoId(c.id)
    setEdit({
      etiqueta: c.etiqueta,
      tipo: c.tipo,
      opcionesTexto: (c.opciones || []).join(', '),
      orden: c.orden,
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEdit(CAMPO_VACIO)
  }

  const guardarEdicion = async (id) => {
    setGuardando(true)
    try {
      await apiClient.patch(`/campos-personalizados/${id}/`, {
        etiqueta: edit.etiqueta,
        tipo: edit.tipo,
        opciones: edit.tipo === 'texto' ? [] : parseOpciones(edit.opcionesTexto),
        orden: Number(edit.orden) || 0,
      })
      cancelarEdicion()
      cargar()
    } catch {
      alert('No se pudo guardar el campo.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarCampo = async (id, etiqueta) => {
    if (!confirm(`¿Eliminar el campo "${etiqueta}"?`)) return
    try {
      await apiClient.delete(`/campos-personalizados/${id}/`)
      cargar()
    } catch {
      alert('No se pudo eliminar el campo.')
    }
  }

  return (
    <Layout>
      <BotonVolver to="/" className="mb-4" />
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-slate-800">Campos personalizados</h1>
            <Boton variante="primary" onClick={() => setMostrarForm((prev) => !prev)}>
              {mostrarForm ? 'Cancelar' : '+ Nuevo campo'}
            </Boton>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Estos campos aparecen en la sección "Campos adicionales" al completar una consulta.
          </p>

          {mostrarForm && (
            <form onSubmit={crearCampo} className="space-y-3 mb-6 border-b border-slate-100 pb-6">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Etiqueta</label>
                <input
                  type="text"
                  value={nuevo.etiqueta}
                  onChange={(e) => setNuevo({ ...nuevo, etiqueta: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tipo</label>
                <select
                  value={nuevo.tipo}
                  onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  {TIPOS.map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>
              {nuevo.tipo !== 'texto' && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Opciones (separadas por coma)</label>
                  <input
                    type="text"
                    value={nuevo.opcionesTexto}
                    onChange={(e) => setNuevo({ ...nuevo, opcionesTexto: e.target.value })}
                    placeholder="Ej: Opción A, Opción B, Opción C"
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Orden</label>
                <input
                  type="number"
                  value={nuevo.orden}
                  onChange={(e) => setNuevo({ ...nuevo, orden: e.target.value })}
                  className="w-32 border border-slate-300 rounded px-3 py-2"
                />
              </div>
              <Boton type="submit" variante="primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar campo'}
              </Boton>
            </form>
          )}

          {campos.length === 0 ? (
            <p className="text-slate-500">No tenés campos personalizados creados todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {campos.map((c) => (
                <li key={c.id} className="py-3">
                  {editandoId === c.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={edit.etiqueta}
                        onChange={(e) => setEdit({ ...edit, etiqueta: e.target.value })}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        maxLength={100}
                        required
                      />
                      <select
                        value={edit.tipo}
                        onChange={(e) => setEdit({ ...edit, tipo: e.target.value })}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      >
                        {TIPOS.map(([valor, label]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </select>
                      {edit.tipo !== 'texto' && (
                        <input
                          type="text"
                          value={edit.opcionesTexto}
                          onChange={(e) => setEdit({ ...edit, opcionesTexto: e.target.value })}
                          placeholder="Ej: Opción A, Opción B, Opción C"
                          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                          required
                        />
                      )}
                      <input
                        type="number"
                        value={edit.orden}
                        onChange={(e) => setEdit({ ...edit, orden: e.target.value })}
                        className="w-32 border border-slate-300 rounded px-3 py-2 text-sm"
                      />
                      <div className="space-x-3">
                        <button
                          onClick={() => guardarEdicion(c.id)}
                          disabled={guardando}
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
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{c.etiqueta}</p>
                        <p className="text-xs text-slate-500">
                          {TIPO_LABEL[c.tipo] || c.tipo}
                          {c.tipo !== 'texto' && c.opciones?.length > 0 && ` — ${c.opciones.join(', ')}`}
                        </p>
                      </div>
                      <div className="space-x-3 whitespace-nowrap">
                        <button onClick={() => iniciarEdicion(c)} className="text-blue-600 text-xs hover:underline">
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarCampo(c.id, c.etiqueta)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Layout>
  )
}
