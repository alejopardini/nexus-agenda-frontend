import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'

const LARGO_PREVIEW = 60

export default function FrasesRapidas() {
  const [frases, setFrases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editTexto, setEditTexto] = useState('')

  const cargar = () => {
    apiClient
      .get('/frases-rapidas/')
      .then((res) => setFrases(res.data))
      .catch(() => setError('No se pudieron cargar las frases rápidas.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const crearFrase = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await apiClient.post('/frases-rapidas/', { titulo: nuevoTitulo, texto: nuevoTexto })
      setNuevoTitulo('')
      setNuevoTexto('')
      setMostrarForm(false)
      cargar()
    } catch {
      alert('No se pudo crear la frase.')
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEdicion = (f) => {
    setEditandoId(f.id)
    setEditTitulo(f.titulo)
    setEditTexto(f.texto)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEditTitulo('')
    setEditTexto('')
  }

  const guardarEdicion = async (id) => {
    setGuardando(true)
    try {
      await apiClient.patch(`/frases-rapidas/${id}/`, { titulo: editTitulo, texto: editTexto })
      cancelarEdicion()
      cargar()
    } catch {
      alert('No se pudo guardar la frase.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarFrase = async (id, titulo) => {
    if (!confirm(`¿Eliminar la frase "${titulo}"?`)) return
    try {
      await apiClient.delete(`/frases-rapidas/${id}/`)
      cargar()
    } catch {
      alert('No se pudo eliminar la frase.')
    }
  }

  return (
    <Layout>
      <BotonVolver to="/" />
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-slate-800">Frases rápidas</h1>
            <button
              onClick={() => setMostrarForm((prev) => !prev)}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
            >
              {mostrarForm ? 'Cancelar' : '+ Nueva frase'}
            </button>
          </div>

          {mostrarForm && (
            <form onSubmit={crearFrase} className="space-y-3 mb-6 border-b border-slate-100 pb-6">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Título</label>
                <input
                  type="text"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Texto</label>
                <textarea
                  value={nuevoTexto}
                  onChange={(e) => setNuevoTexto(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar frase'}
              </button>
            </form>
          )}

          {frases.length === 0 ? (
            <p className="text-slate-500">No tenés frases guardadas todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {frases.map((f) => (
                <li key={f.id} className="py-3">
                  {editandoId === f.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitulo}
                        onChange={(e) => setEditTitulo(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        maxLength={50}
                        required
                      />
                      <textarea
                        value={editTexto}
                        onChange={(e) => setEditTexto(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        rows={3}
                        required
                      />
                      <div className="space-x-3">
                        <button
                          onClick={() => guardarEdicion(f.id)}
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
                        <p className="font-medium text-slate-800 text-sm">{f.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {f.texto.length > LARGO_PREVIEW ? `${f.texto.slice(0, LARGO_PREVIEW)}…` : f.texto}
                        </p>
                      </div>
                      <div className="space-x-3 whitespace-nowrap">
                        <button onClick={() => iniciarEdicion(f)} className="text-blue-600 text-xs hover:underline">
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarFrase(f.id, f.titulo)}
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
