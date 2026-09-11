import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BuscadorPaciente from '../components/BuscadorPaciente'
import { useAuth } from '../context/AuthContext'
import Boton from '../components/Boton'

const TIPOS_DATO_LABEL = {
  historia_clinica: 'Historia clínica',
  consulta: 'Consulta',
  ajustes_vertebrales: 'Ajustes vertebrales',
  seguimiento_quiropractico: 'Seguimiento quiropráctico',
}

export default function Auditoria() {
  const { auth } = useAuth()
  const [accesos, setAccesos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacienteId, setPacienteId] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [pacientes, setPacientes] = useState([])

  useEffect(() => {
    if (auth.rol !== 'dueño') return
    apiClient.get('/pacientes/').then((res) => setPacientes(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Opciones del <select> de usuario: se arman solo con los usuarios que
  // ya aparecen en los accesos cargados — sin pedir un endpoint nuevo.
  const usuariosEnResultados = Array.from(
    new Map(accesos.map((a) => [a.usuario, a.usuario_nombre])).entries()
  ).filter(([id]) => id != null)

  const buscar = (params) => {
    apiClient
      .get('/auditoria/', { params })
      .then((res) => setAccesos(res.data))
      .catch(() => setError('No se pudo cargar la auditoría.'))
      .finally(() => setLoading(false))
  }

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (pacienteId) params.paciente_id = pacienteId
    if (usuarioId) params.usuario_id = usuarioId
    buscar(params)
  }

  useEffect(() => {
    if (auth.rol === 'dueño') buscar({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (auth.rol !== 'dueño') {
    return (
      <Layout>
        <p className="text-red-600">No tenés permiso para ver esta pantalla.</p>
      </Layout>
    )
  }

  const aplicarFiltros = (e) => {
    e.preventDefault()
    cargar()
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Auditoría de acceso a datos clínicos</h1>

        <form onSubmit={aplicarFiltros} className="flex flex-wrap gap-3 items-end mb-4">
          <div className="w-64">
            <label className="block text-xs text-slate-500 mb-1">Paciente</label>
            <BuscadorPaciente pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Usuario</label>
            <select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              disabled={usuariosEnResultados.length === 0}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-48 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Todos</option>
              {usuariosEnResultados.map(([id, nombre]) => (
                <option key={id} value={id}>{nombre || `Usuario #${id}`}</option>
              ))}
            </select>
          </div>
          <Boton type="submit" variante="primary">
            Filtrar
          </Boton>
        </form>

        {loading && <p className="text-slate-500">Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          accesos.length === 0 ? (
            <p className="text-slate-500">No hay accesos registrados con estos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Fecha y hora</th>
                    <th className="py-2">Usuario</th>
                    <th className="py-2">Paciente</th>
                    <th className="py-2">Tipo de dato</th>
                  </tr>
                </thead>
                <tbody>
                  {accesos.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2">{new Date(a.fecha_hora).toLocaleString('es-AR')}</td>
                      <td className="py-2">{a.usuario_nombre || '—'}</td>
                      <td className="py-2">{a.paciente_nombre}</td>
                      <td className="py-2">{TIPOS_DATO_LABEL[a.tipo_dato] || a.tipo_dato}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  )
}
