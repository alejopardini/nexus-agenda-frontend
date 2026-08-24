import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import Layout from '../components/Layout'

export default function CompletarConsulta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    apiClient
      .get(`/consultas/${id}/`)
      .then((res) => {
        setConsulta(res.data)
        setMotivo(res.data.motivo || '')
        setObservaciones(res.data.observaciones || '')
      })
      .catch(() => setError('No se pudo cargar la consulta.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await apiClient.patch(`/consultas/${id}/`, {
        motivo,
        observaciones,
        estado: 'completada',
      })
      navigate(`/pacientes/${consulta.paciente}`)
    } catch (err) {
      setError('No se pudo guardar la consulta.')
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
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Completar consulta</h1>
        <p className="text-sm text-slate-500 mb-4">
          {consulta.paciente_nombre} — {consulta.fecha}
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
              rows={5}
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Marcar como completada'}
          </button>
        </form>
      </div>
    </Layout>
  )
}