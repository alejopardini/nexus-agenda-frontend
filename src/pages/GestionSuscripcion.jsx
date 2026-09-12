import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'

export default function GestionSuscripcion() {
  return (
    <Layout>
      <BotonVolver to="/profesionales" />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Gestión de suscripción</h1>
        <p className="text-slate-600 text-sm">
          Esta función va a estar disponible próximamente. Todavía no podés cambiar de
          plan ni gestionar el pago de tu suscripción desde acá.
        </p>
      </div>
    </Layout>
  )
}
