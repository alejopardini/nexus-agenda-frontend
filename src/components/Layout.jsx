import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <main className="p-6 md:ml-16">{children}</main>
    </div>
  )
}