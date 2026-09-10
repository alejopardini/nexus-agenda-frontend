import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <Header />
      <main className="p-6 md:ml-16">{children}</main>
    </div>
  )
}