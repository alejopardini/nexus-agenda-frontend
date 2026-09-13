import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children, titulo, controles }) {
  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <Header titulo={titulo} controles={controles} />
      <main className="p-6 md:ml-16">{children}</main>
    </div>
  )
}