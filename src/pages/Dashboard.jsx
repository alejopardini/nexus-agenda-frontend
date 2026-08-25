import { Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { auth } = useAuth()

  if (!auth.rol) {
    return <Navigate to="/invitaciones" replace />
  }

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
        <h1 className="text-xl font-bold text-slate-800">Bienvenido</h1>
        <p className="text-slate-600 mt-1">Usá el menú de arriba para navegar.</p>
      </div>
    </Layout>
  )
}