import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'
import { formatearFecha } from '../utils/fechas'

export default function ConsultaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [camposPersonalizados, setCamposPersonalizados] = useState([])
  const [valoresPersonalizados, setValoresPersonalizados] = useState({})

  useEffect(() => {
    apiClient
      .get(`/consultas/${id}/`)
      .then((res) => {
        setConsulta(res.data)
        setTitulo(res.data.titulo || '')
        setNotas(res.data.notas || '')
        setValoresPersonalizados(res.data.valores_personalizados || {})
        setCamposPersonalizados(res.data.campos_personalizados_disponibles || [])
      })
      .catch(() => setError('No se pudo cargar la consulta.'))
      .finally(() => setLoading(false))
  }, [id])

  const setValorCampoPersonalizado = (campoId, valor) => {
    setValoresPersonalizados((prev) => ({ ...prev, [campoId]: valor }))
  }

  const toggleValorCampoPersonalizado = (campoId, opcion) => {
    setValoresPersonalizados((prev) => {
      const actual = prev[campoId] || []
      const nuevo = actual.includes(opcion) ? actual.filter((v) => v !== opcion) : [...actual, opcion]
      return { ...prev, [campoId]: nuevo }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/consultas/${id}/`, {
        titulo,
        notas,
        estado: 'completada',
        valores_personalizados: valoresPersonalizados,
      })

      navigate(`/clientes/${consulta.cliente}`)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo guardar la consulta.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-500">Cargando...</p>
      </Layout>
    )
  }

  if (error || !consulta) {
    return (
      <Layout>
        <p className="text-red-600">{error || 'Consulta no encontrada.'}</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <BotonVolver to={`/clientes/${consulta.cliente}`} className="mb-4" />
      <div className="max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            Consulta — {consulta.estado === 'completada' ? 'completada' : 'pendiente'}
          </h1>
          <p className="text-sm text-slate-500">
            {consulta.cliente_nombre} — {formatearFecha(consulta.fecha)}
          </p>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        </div>

        <div>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Título (opcional)</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
                rows={10}
              />
            </div>

            {camposPersonalizados.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Campos adicionales</h2>
                {camposPersonalizados.map((campo) => (
                  <div key={campo.id}>
                    <label className="block text-sm text-slate-600 mb-1">{campo.etiqueta}</label>
                    {campo.tipo === 'texto' && (
                      <input
                        type="text"
                        value={valoresPersonalizados[campo.id] || ''}
                        onChange={(e) => setValorCampoPersonalizado(campo.id, e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      />
                    )}
                    {campo.tipo === 'select' && (
                      <select
                        value={valoresPersonalizados[campo.id] || ''}
                        onChange={(e) => setValorCampoPersonalizado(campo.id, e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2"
                      >
                        <option value="">Sin definir</option>
                        {(campo.opciones || []).map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    )}
                    {campo.tipo === 'checkbox' && (
                      <div className="flex flex-wrap gap-3">
                        {(campo.opciones || []).map((op) => (
                          <label key={op} className="flex items-center gap-1 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={(valoresPersonalizados[campo.id] || []).includes(op)}
                              onChange={() => toggleValorCampoPersonalizado(campo.id, op)}
                            />
                            {op}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
                {guardando ? 'Guardando...' : consulta.estado === 'completada' ? 'Guardar cambios' : 'Marcar como completada'}
              </Boton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}