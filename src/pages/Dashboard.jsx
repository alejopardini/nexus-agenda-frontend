import Layout from '../components/Layout'

export default function Dashboard() {
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
        <h1 className="text-xl font-bold text-slate-800">Bienvenido</h1>
        <p className="text-slate-600 mt-1">Usá el menú de arriba para navegar.</p>
      </div>
    </Layout>
  )
}