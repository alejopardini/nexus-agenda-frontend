import { useEffect, useState } from 'react'
import { UserMinus } from 'lucide-react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import Boton from '../components/Boton'
import BotonIcono from '../components/BotonIcono'

export default function Secretarias() {
  const [secretarias, setSecretarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = () => {
    apiClient
      .get('/secretarias/')
      .then((res) => setSecretarias(res.data))
      .catch(() => setError('No se pudieron cargar las secretarias.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const darDeBaja = async (id, nombre) => {
    if (!confirm(`¿Quitar a ${nombre} de la organización?`)) return
    try {
      await apiClient.post(`/secretarias/${id}/dar_de_baja/`)
      cargar()
    } catch {
      alert('No se pudo dar de baja.')
    }
  }

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-slate-800">Secretaría</h1>
            <Boton to="/secretarias/nueva" variante="primary">
              + Nueva secretaria
            </Boton>
          </div>

          {secretarias.length === 0 ? (
            <p className="text-slate-500">No hay secretarias cargadas todavía.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Usuario</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {secretarias.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2">{s.nombre} {s.apellido}</td>
                    <td className="py-2">{s.username}</td>
                    <td className="py-2">
                      <BotonIcono
                        icono={UserMinus}
                        texto="Dar de baja"
                        color="destructive"
                        onClick={() => darDeBaja(s.id, `${s.nombre} ${s.apellido}`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}